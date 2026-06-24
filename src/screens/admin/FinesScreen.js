import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import {
  Menu, Search, DollarSign, CheckCircle, AlertCircle,
  User, Mail, Building2, BookOpen, Calendar, CreditCard, Hash, ArrowRight,
} from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { getDueBooks, markFinePaid } from '../../services/fineService';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const FinesScreen = ({ navigation }) => {
  const [tab, setTab] = useState('unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [unpaid, setUnpaid] = useState([]);
  const [paid, setPaid] = useState([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // ── Unpaid fines from due_books (already has student+book via getDueBooks) ──
      const dues = await getDueBooks();
      const unpaidMapped = dues.map(d => ({
        id: d.id,
        studentId: d.studentId,
        bookId: d.bookId,
        amount: d.fine,
        perDay: 5,
        dueDate: d.dueDate,
        daysOverdue: Math.max(0, Math.floor((new Date() - new Date(d.dueDate)) / (1000 * 60 * 60 * 24))),
        status: 'unpaid',
        student: d.student,
        book: d.book,
      }));
      setUnpaid(unpaidMapped);

      // ── Paid fines from borrow_records with full student+book hydration ──
      const q = query(collection(db, 'borrow_records'), where('fineStatus', '==', true));
      const snap = await getDocs(q);

      const paidMapped = [];
      for (const docSnap of snap.docs) {
        const d = docSnap.data();

        let studentData = { name: d.studentId, college_id: '', usn: '', library_card_id: d.studentId, department: '' };
        let bookData = { title: 'Unknown Book' };

        try {
          const studentDoc = await getDoc(doc(db, 'students', d.studentId));
          if (studentDoc.exists()) studentData = { id: studentDoc.id, ...studentDoc.data() };
        } catch (_) {}

        try {
          const bookDoc = await getDoc(doc(db, 'books', d.bookId));
          if (bookDoc.exists()) bookData = { id: bookDoc.id, ...bookDoc.data() };
        } catch (_) {}

        const dueDate = d.dueDate?.toDate?.()?.toISOString() ?? d.dueDate;
        const returnDate = d.returnDate?.toDate?.()?.toISOString() ?? d.returnDate;

        paidMapped.push({
          id: docSnap.id,
          studentId: d.studentId,
          bookId: d.bookId,
          amount: d.fine || 0,
          perDay: 5,
          dueDate,
          returnDate,
          daysOverdue: dueDate
            ? Math.max(0, Math.floor((new Date(returnDate || new Date()) - new Date(dueDate)) / (1000 * 60 * 60 * 24)))
            : 0,
          status: 'paid',
          student: studentData,
          book: bookData,
        });
      }
      setPaid(paidMapped);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalUnpaid = unpaid.reduce((s, f) => s + f.amount, 0);
  const totalPaid = paid.reduce((s, f) => s + f.amount, 0);

  const data = useMemo(() => {
    const list = tab === 'unpaid' ? unpaid : paid;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(f => {
      const st = f.student;
      return (
        st?.name?.toLowerCase().includes(q) ||
        st?.college_id?.toLowerCase().includes(q) ||
        st?.usn?.toLowerCase().includes(q) ||
        st?.library_card_id?.toLowerCase().includes(q) ||
        f.book?.title?.toLowerCase().includes(q)
      );
    });
  }, [tab, searchQuery, unpaid, paid]);

  const handleMarkPaid = async (item) => {
    Alert.alert(
      'Mark as Paid',
      `Mark fine of ₹${item.amount} for ${item.student?.name || item.studentId} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await markFinePaid(item.id);
              Alert.alert('Success', `Fine of ₹${item.amount} marked as paid.`);
              fetchData();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const renderFine = ({ item }) => {
    const student = item.student;
    const book = item.book;
    const isUnpaid = item.status === 'unpaid';

    const dueDateStr = item.dueDate
      ? (() => { try { return new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return item.dueDate; } })()
      : 'N/A';

    return (
      <View style={[
        s.card,
        { borderLeftWidth: 4, borderLeftColor: isUnpaid ? AdminColors.red : AdminColors.green },
      ]}>
        {/* ── Status banner ── */}
        <View style={[s.statusBanner, { backgroundColor: isUnpaid ? AdminColors.redLight : AdminColors.greenLight }]}>
          {isUnpaid
            ? <AlertCircle size={12} color={AdminColors.red} />
            : <CheckCircle size={12} color={AdminColors.green} />}
          <Text style={[s.statusBannerText, { color: isUnpaid ? AdminColors.red : AdminColors.green }]}>
            {isUnpaid ? `${item.daysOverdue > 0 ? `${item.daysOverdue} days overdue` : 'Overdue'}` : 'Fine Paid'}
          </Text>
        </View>

        <View style={s.cardBody}>
          {/* ── Left: student + book info ── */}
          <View style={{ flex: 1 }}>
            {/* Student name */}
            <View style={s.nameRow}>
              <View style={[s.avatar, { backgroundColor: isUnpaid ? AdminColors.redLight : AdminColors.greenLight }]}>
                <User size={16} color={isUnpaid ? AdminColors.red : AdminColors.green} />
              </View>
              <Text style={s.name} numberOfLines={1}>{student?.name || student?.library_card_id || student?.id || 'Unknown'}</Text>
            </View>

            {/* Student ID rows */}
            <InfoRow icon={Hash} value={student?.usn || student?.college_id?.split('@')[0] || 'N/A'} label="USN" />
            <InfoRow icon={CreditCard} value={student?.library_card_id || student?.id || 'N/A'} label="Card ID" />
            <InfoRow icon={Mail} value={student?.college_id || student?.email || 'N/A'} label="Email" />
            {student?.department ? <InfoRow icon={Building2} value={student.department} label="Dept" /> : null}

            {/* Divider */}
            <View style={[s.innerDivider, { backgroundColor: AdminColors.border }]} />

            {/* Book info */}
            <InfoRow icon={BookOpen} value={book?.title || 'Unknown Book'} label="Book" />
            <InfoRow icon={Calendar} value={dueDateStr} label="Due" />
          </View>

          {/* ── Right: amount block ── */}
          <View style={s.amountBlock}>
            <Text style={s.amountLabel}>Fine Amount</Text>
            <Text style={[s.amount, { color: isUnpaid ? AdminColors.red : AdminColors.green }]}>
              ₹{item.amount}
            </Text>
            <Text style={s.perDay}>₹{item.perDay}/day</Text>
          </View>
        </View>

        {/* ── Actions row ── */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.viewBtn}
            onPress={() =>
              Alert.alert(
                'Student Profile',
                `Name: ${student?.name || 'N/A'}\nUSN: ${student?.usn || 'N/A'}\nCard: ${student?.library_card_id || 'N/A'}\nEmail: ${student?.college_id || 'N/A'}\nFine: ₹${item.amount}`,
              )
            }
          >
            <ArrowRight size={14} color={AdminColors.navy} />
            <Text style={s.viewBtnText}>View Profile</Text>
          </TouchableOpacity>

          {isUnpaid && (
            <TouchableOpacity style={s.payBtn} onPress={() => handleMarkPaid(item)}>
              <CheckCircle size={14} color="#fff" />
              <Text style={s.payText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}>
          <Menu size={24} color={AdminColors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={s.title}>Fine Management</Text>
          <Text style={s.sub}>Track and manage student fines</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AdminColors.navy} />
        </View>
      ) : (
        <>
          {/* Summary cards */}
          <View style={s.sumRow}>
            {[
              { icon: DollarSign, v: `₹${totalUnpaid}`, l: 'Total Unpaid', sub: `${unpaid.length} pending fines`, ic: AdminColors.red, bg: AdminColors.redLight, border: AdminColors.red },
              { icon: CheckCircle, v: `₹${totalPaid}`, l: 'Total Collected', sub: `${paid.length} paid fines`, ic: AdminColors.green, bg: AdminColors.greenLight, border: AdminColors.green },
              { icon: User, v: unpaid.length, l: 'Students with Fines', sub: 'Requires attention', ic: AdminColors.navy, bg: AdminColors.blueLight, border: AdminColors.navy },
            ].map((c, i) => (
              <View key={i} style={[s.sumCard, { borderTopWidth: 3, borderTopColor: c.border }]}>
                <View style={[s.sumIcon, { backgroundColor: c.bg }]}><c.icon size={18} color={c.ic} /></View>
                <Text style={s.sumLabel}>{c.l}</Text>
                <Text style={[s.sumVal, { color: c.ic }]}>{c.v}</Text>
                <Text style={s.sumSub}>{c.sub}</Text>
              </View>
            ))}
          </View>

          {/* Search */}
          <View style={s.searchBox}>
            <Search size={18} color={AdminColors.textMuted} />
            <TextInput
              style={s.searchIn}
              placeholder="Search by name, USN, email, book..."
              placeholderTextColor={AdminColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Tabs */}
          <View style={s.tabs}>
            <TouchableOpacity style={[s.tab, tab === 'unpaid' && s.tabActive]} onPress={() => setTab('unpaid')}>
              <AlertCircle size={14} color={tab === 'unpaid' ? '#fff' : AdminColors.textSecondary} />
              <Text style={[s.tabText, tab === 'unpaid' && s.tabTextA]}>Unpaid ({unpaid.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, tab === 'paid' && s.tabActive]} onPress={() => setTab('paid')}>
              <CheckCircle size={14} color={tab === 'paid' ? '#fff' : AdminColors.textSecondary} />
              <Text style={[s.tabText, tab === 'paid' && s.tabTextA]}>Paid ({paid.length})</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={data}
            keyExtractor={i => i.id}
            renderItem={renderFine}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.empty}>
                <DollarSign size={48} color={AdminColors.textMuted} />
                <Text style={s.emptyT}>No fines found</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
};

// Small helper component for info rows
const InfoRow = ({ icon: Icon, value, label }) => (
  <View style={s.infoRow}>
    <Icon size={11} color={AdminColors.textMuted} />
    <Text style={s.infoLabel}>{label}:</Text>
    <Text style={s.infoText} numberOfLines={1}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: AdminColors.bgGrey },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', color: AdminColors.textPrimary },
  sub: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 2 },
  sumRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  sumCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 1 },
  sumIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  sumLabel: { fontSize: 10, color: AdminColors.textSecondary },
  sumVal: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  sumSub: { fontSize: 9, color: AdminColors.textMuted, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: AdminColors.border },
  searchIn: { flex: 1, fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8, paddingVertical: 0 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: AdminColors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: AdminColors.navy },
  tabText: { fontSize: 12, fontWeight: '600', color: AdminColors.textSecondary, marginLeft: 4 },
  tabTextA: { color: '#fff' },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, gap: 6 },
  statusBannerText: { fontSize: 11, fontWeight: '700' },
  cardBody: { flexDirection: 'row', padding: 14, paddingTop: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: AdminColors.textPrimary, flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, gap: 4 },
  infoLabel: { fontSize: 10, fontWeight: '600', color: AdminColors.textMuted, width: 40 },
  infoText: { fontSize: 11, color: AdminColors.textSecondary, flex: 1 },
  innerDivider: { height: 1, marginVertical: 8 },

  // Amount block (right column)
  amountBlock: { alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 12, minWidth: 90 },
  amountLabel: { fontSize: 10, color: AdminColors.textMuted },
  amount: { fontSize: 26, fontWeight: '800' },
  perDay: { fontSize: 10, color: AdminColors.textMuted },

  // Actions
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4, gap: 10 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: AdminColors.border },
  viewBtnText: { fontSize: 12, fontWeight: '600', color: AdminColors.navy },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: AdminColors.green, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 6, flex: 1 },
  payText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyT: { fontSize: 16, color: AdminColors.textMuted },
});

export default FinesScreen;
