import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Image,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import {
  Menu, Search, CheckCircle, AlertCircle, ShieldAlert,
  RotateCcw, X, Book, User, Calendar, Clock, DollarSign,
} from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { returnBook } from '../../services/borrowService';
import { BLACKLIST_THRESHOLD_DAYS } from '../../utils/constants';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const TABS = [
  { key: 'active', label: 'Active', icon: CheckCircle, color: AdminColors.green, bg: AdminColors.greenLight },
  { key: 'overdue', label: 'Overdue', icon: AlertCircle, color: AdminColors.orange, bg: AdminColors.orangeLight },
  { key: 'blocked', label: 'Blocked', icon: ShieldAlert, color: AdminColors.red, bg: AdminColors.redLight },
];

const ReturnsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allRecords, setAllRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [returningId, setReturningId] = useState(null);

  const fetchActiveBorrows = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'borrow_records'),
        where('status', 'in', ['BORROWED', 'OVERDUE'])
      );
      const snap = await getDocs(q);

      const records = [];
      for (const docSnap of snap.docs) {
        const d = docSnap.data();

        // Fetch actual book details
        let bookData = null;
        try {
          const bookDoc = await getDoc(doc(db, 'books', d.bookId));
          if (bookDoc.exists()) {
            bookData = { id: bookDoc.id, ...bookDoc.data() };
          }
        } catch (e) { console.warn('Book fetch error', e); }

        // Fetch actual student details
        let studentData = null;
        try {
          const studentDoc = await getDoc(doc(db, 'students', d.studentId));
          if (studentDoc.exists()) {
            studentData = { id: studentDoc.id, ...studentDoc.data() };
          }
        } catch (e) { console.warn('Student fetch error', e); }

        const dueDate = d.dueDate?.toDate?.() || (d.dueDate ? new Date(d.dueDate) : null);
        const borrowDate = d.borrowDate?.toDate?.() || (d.borrowDate ? new Date(d.borrowDate) : null);
        const now = new Date();

        // Calculate days overdue
        let daysOverdue = 0;
        if (dueDate && now > dueDate) {
          daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        }

        // Determine category
        const isBlocked = studentData?.isBlacklisted === true || daysOverdue >= BLACKLIST_THRESHOLD_DAYS;
        const isOverdue = dueDate && now > dueDate;

        let category = 'active';
        if (isBlocked) category = 'blocked';
        else if (isOverdue) category = 'overdue';

        records.push({
          id: docSnap.id,
          ...d,
          dueDate: dueDate?.toISOString(),
          borrowDate: borrowDate?.toISOString(),
          book: bookData,
          student: studentData,
          daysOverdue,
          category,
        });
      }
      setAllRecords(records);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load active borrows');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchActiveBorrows);
    return unsubscribe;
  }, [navigation, fetchActiveBorrows]);

  const handleReturn = async (item) => {
    Alert.alert(
      'Confirm Return',
      `Process return for "${item.book?.title || item.bookId}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', style: 'destructive', onPress: async () => {
            setReturningId(item.id);
            try {
              const res = await returnBook(item.id);
              if (res.fine > 0) {
                Alert.alert('Returned', `Book returned. Student owes ₹${res.fine}.`);
              } else {
                Alert.alert('Returned', 'Book returned successfully.');
              }
              setDetailVisible(false);
              fetchActiveBorrows();
            } catch (e) {
              Alert.alert('Error', e.message);
            } finally {
              setReturningId(null);
            }
          }
        },
      ]
    );
  };

  // Tab counts
  const activeCount = allRecords.filter(r => r.category === 'active').length;
  const overdueCount = allRecords.filter(r => r.category === 'overdue').length;
  const blockedCount = allRecords.filter(r => r.category === 'blocked').length;
  const tabCounts = { active: activeCount, overdue: overdueCount, blocked: blockedCount };

  // Filter by tab + search
  const filteredRecords = useMemo(() => {
    let results = allRecords.filter(r => r.category === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(r =>
        r.book?.title?.toLowerCase().includes(q) ||
        r.book?.author?.toLowerCase().includes(q) ||
        r.book?.bookCode?.toLowerCase().includes(q) ||
        r.student?.name?.toLowerCase().includes(q) ||
        r.student?.usn?.toLowerCase().includes(q) ||
        r.studentId?.toLowerCase().includes(q) ||
        r.bookId?.toLowerCase().includes(q)
      );
    }
    return results;
  }, [allRecords, activeTab, searchQuery]);

  const openDetail = (item) => {
    setSelectedRecord(item);
    setDetailVisible(true);
  };

  const getCoverUri = (book) => book?.frontImage || book?.coverUrl || null;

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderCard = ({ item }) => {
    const book = item.book;
    const student = item.student;
    const coverUri = getCoverUri(book);
    const isOverdue = item.category === 'overdue' || item.category === 'blocked';

    return (
      <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => openDetail(item)}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={s.cover} />
        ) : (
          <View style={[s.cover, s.coverPlaceholder]}>
            <Book size={22} color={AdminColors.textMuted} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.bookTitle} numberOfLines={1}>{book?.title || item.bookId}</Text>
          <Text style={s.author} numberOfLines={1}>{book?.author || 'Unknown Author'}</Text>
          <View style={s.borrowerRow}>
            <User size={12} color={AdminColors.textMuted} />
            <Text style={s.borrower} numberOfLines={1}>{student?.name || item.studentId}</Text>
            {student?.usn ? <Text style={s.usn}>({student.usn})</Text> : null}
          </View>
          <View style={s.dateRow}>
            <View style={s.dateBlock}>
              <Text style={s.dateLabel}>Due</Text>
              <Text style={[s.dateVal, isOverdue && { color: AdminColors.red }]}>{formatDate(item.dueDate)}</Text>
            </View>
            {item.daysOverdue > 0 && (
              <View style={[s.overdueTag, {
                backgroundColor: item.category === 'blocked' ? AdminColors.redLight : AdminColors.orangeLight
              }]}>
                <Text style={[s.overdueText, {
                  color: item.category === 'blocked' ? AdminColors.red : AdminColors.orange
                }]}>
                  {item.daysOverdue}d overdue
                </Text>
              </View>
            )}
          </View>
        </View>
        {item.category === 'blocked' && (
          <View style={s.blockedBadge}>
            <ShieldAlert size={12} color={AdminColors.red} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Detail Modal
  const renderDetailModal = () => {
    if (!selectedRecord) return null;
    const r = selectedRecord;
    const book = r.book;
    const student = r.student;
    const coverUri = getCoverUri(book);
    const isOverdue = r.category === 'overdue' || r.category === 'blocked';

    return (
      <Modal visible={detailVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Borrow Details</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)} style={s.closeBtn}>
                <X size={20} color={AdminColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Book Section */}
              <View style={s.detailSection}>
                <Text style={s.sectionLabel}>BOOK INFORMATION</Text>
                <View style={s.detailBookRow}>
                  {coverUri ? (
                    <Image source={{ uri: coverUri }} style={s.detailCover} />
                  ) : (
                    <View style={[s.detailCover, s.coverPlaceholder]}>
                      <Book size={28} color={AdminColors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={s.detailBookTitle}>{book?.title || r.bookId}</Text>
                    <Text style={s.detailBookAuthor}>{book?.author || 'Unknown'}</Text>
                    {book?.genre ? <Text style={s.detailMeta}>Genre: {book.genre}{book.innerGenre ? ` / ${book.innerGenre}` : ''}</Text> : null}
                    {book?.department ? <Text style={s.detailMeta}>Dept: {book.department}</Text> : null}
                    <Text style={s.detailMeta}>Book Code: {book?.id || r.bookId}</Text>
                  </View>
                </View>
              </View>

              {/* Student Section */}
              <View style={s.detailSection}>
                <Text style={s.sectionLabel}>STUDENT INFORMATION</Text>
                <View style={s.infoGrid}>
                  <InfoRow icon={User} label="Name" value={student?.name || r.studentId} />
                  <InfoRow icon={User} label="USN" value={student?.usn || '—'} />
                  <InfoRow icon={User} label="Library Card" value={student?.id || r.studentId} />
                  <InfoRow icon={User} label="Email" value={student?.college_id || '—'} />
                  {student?.isBlacklisted && (
                    <View style={s.blacklistAlert}>
                      <ShieldAlert size={14} color={AdminColors.red} />
                      <Text style={s.blacklistAlertText}>Student is Blacklisted</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Borrow Details */}
              <View style={s.detailSection}>
                <Text style={s.sectionLabel}>BORROW DETAILS</Text>
                <View style={s.infoGrid}>
                  <InfoRow icon={Calendar} label="Borrow Date" value={formatDate(r.borrowDate)} />
                  <InfoRow icon={Clock} label="Due Date" value={formatDate(r.dueDate)} isAlert={isOverdue} />
                  {r.daysOverdue > 0 && (
                    <InfoRow icon={AlertCircle} label="Days Overdue" value={`${r.daysOverdue} days`} isAlert />
                  )}
                  {(r.fine || 0) > 0 && (
                    <InfoRow icon={DollarSign} label="Fine" value={`₹${r.fine}`} isAlert />
                  )}
                  <InfoRow icon={CheckCircle} label="Status" value={r.status} />
                </View>
              </View>

              {/* Return Button */}
              <TouchableOpacity
                style={s.modalReturnBtn}
                onPress={() => handleReturn(r)}
                disabled={returningId === r.id}
              >
                {returningId === r.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <RotateCcw size={18} color="#fff" />
                    <Text style={s.modalReturnText}>Process Return</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}>
          <Menu size={24} color={AdminColors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={s.title}>Book Returns</Text>
          <Text style={s.sub}>Manage active borrows, overdue & blocked</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchBox}>
        <Search size={18} color={AdminColors.textMuted} />
        <TextInput
          style={s.searchIn}
          placeholder="Search book, author, student, USN..."
          placeholderTextColor={AdminColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={AdminColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          const count = tabCounts[tab.key];
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, isActive && { backgroundColor: tab.bg, borderColor: tab.color }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Icon size={16} color={isActive ? tab.color : AdminColors.textMuted} />
              <Text style={[s.tabLabel, isActive && { color: tab.color, fontWeight: '700' }]}>{tab.label}</Text>
              <View style={[s.tabBadge, { backgroundColor: isActive ? tab.color : AdminColors.textMuted }]}>
                <Text style={s.tabBadgeText}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AdminColors.navy} />
          <Text style={{ color: AdminColors.textMuted, marginTop: 12, fontSize: 13 }}>Loading records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={i => i.id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <RotateCcw size={48} color={AdminColors.textMuted} />
              <Text style={s.emptyT}>
                {searchQuery ? 'No matching records' : `No ${activeTab} borrows`}
              </Text>
              <Text style={s.emptySub}>
                {searchQuery ? 'Try different search terms' : activeTab === 'active' ? 'All books are returned on time' : activeTab === 'overdue' ? 'No overdue books right now' : 'No blocked students'}
              </Text>
            </View>
          }
        />
      )}

      {renderDetailModal()}
    </View>
  );
};

// Info row component for detail modal
const InfoRow = ({ icon: Icon, label, value, isAlert }) => (
  <View style={s.infoRow}>
    <Icon size={14} color={isAlert ? AdminColors.red : AdminColors.textMuted} />
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={[s.infoValue, isAlert && { color: AdminColors.red, fontWeight: '700' }]} numberOfLines={1}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: AdminColors.bgGrey },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', color: AdminColors.textPrimary },
  sub: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: AdminColors.border },
  searchIn: { flex: 1, fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8, paddingVertical: 0 },

  // Tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: AdminColors.border, gap: 5 },
  tabLabel: { fontSize: 13, fontWeight: '500', color: AdminColors.textMuted },
  tabBadge: { minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Cards
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1, borderWidth: 1, borderColor: AdminColors.border },
  cover: { width: 56, height: 75, borderRadius: 8, backgroundColor: '#eee' },
  coverPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  bookTitle: { fontSize: 15, fontWeight: '700', color: AdminColors.textPrimary },
  author: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 1 },
  borrowerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  borrower: { fontSize: 12, color: AdminColors.textMuted, maxWidth: 120 },
  usn: { fontSize: 11, color: AdminColors.textMuted },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  dateBlock: {},
  dateLabel: { fontSize: 10, color: AdminColors.textMuted },
  dateVal: { fontSize: 12, fontWeight: '600', color: AdminColors.textPrimary, marginTop: 1 },
  overdueTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  overdueText: { fontSize: 11, fontWeight: '700' },
  blockedBadge: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: AdminColors.redLight, justifyContent: 'center', alignItems: 'center' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyT: { fontSize: 16, fontWeight: '600', color: AdminColors.textMuted, marginTop: 12 },
  emptySub: { fontSize: 13, color: AdminColors.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', paddingTop: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: AdminColors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: AdminColors.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: AdminColors.bgGrey, justifyContent: 'center', alignItems: 'center' },

  detailSection: { paddingHorizontal: 20, marginTop: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: AdminColors.textMuted, letterSpacing: 1, marginBottom: 12 },
  detailBookRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailCover: { width: 70, height: 100, borderRadius: 10, backgroundColor: '#eee' },
  detailBookTitle: { fontSize: 17, fontWeight: '700', color: AdminColors.textPrimary },
  detailBookAuthor: { fontSize: 14, color: AdminColors.textSecondary, marginTop: 2 },
  detailMeta: { fontSize: 12, color: AdminColors.textMuted, marginTop: 3 },

  infoGrid: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, color: AdminColors.textMuted, width: 100 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '600', color: AdminColors.textPrimary },

  blacklistAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: AdminColors.redLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, marginTop: 4 },
  blacklistAlertText: { fontSize: 13, fontWeight: '600', color: AdminColors.red },

  modalReturnBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: AdminColors.navy, marginHorizontal: 20, marginTop: 24, paddingVertical: 16, borderRadius: 14, gap: 8 },
  modalReturnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default ReturnsScreen;
