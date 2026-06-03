import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Image, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Menu, Search, CheckCircle, AlertCircle, DollarSign, RotateCcw } from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { returnBook } from '../../services/borrowService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const ReturnsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRecords, setActiveRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveBorrows = async () => {
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
        records.push({
          id: docSnap.id,
          ...d,
          dueDate: d.dueDate?.toDate?.()?.toISOString(),
          borrowDate: d.borrowDate?.toDate?.()?.toISOString(),
          // Note: In a real app we'd fetch book/student details properly or use populated views
          book: { title: 'Book ' + d.bookId, coverUrl: 'https://via.placeholder.com/150' },
          student: { name: d.studentId },
        });
      }
      setActiveRecords(records);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load active borrows');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchActiveBorrows);
    return unsubscribe;
  }, [navigation]);

  const handleReturn = async (item) => {
    try {
      const res = await returnBook(item.id);
      if (res.fine > 0) {
        Alert.alert('Returned', `Book returned. Student owes a fine of ₹${res.fine}.`);
      } else {
        Alert.alert('Returned', `Book returned successfully.`);
      }
      fetchActiveBorrows();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const overdueCount = activeRecords.filter(br => br.status === 'OVERDUE').length;
  const activeCount = activeRecords.filter(br => br.status === 'BORROWED').length;
  const totalFines = activeRecords.reduce((sum, br) => sum + (br.fine || 0), 0);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return activeRecords;
    const q = searchQuery.toLowerCase();
    return activeRecords.filter(br => {
      return br.book?.title?.toLowerCase().includes(q) || br.studentId?.toLowerCase().includes(q);
    });
  }, [searchQuery, activeRecords]);

  const renderReturn = ({ item }) => {
    const book = item.book;
    const student = item.student;
    const isOverdue = item.status === 'OVERDUE';
    return (
      <View style={s.card}>
        <Image source={{ uri: book?.coverUrl }} style={s.cover} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.bookTitle}>{book?.title}</Text>
          <Text style={s.author}>{book?.author || 'Unknown'}</Text>
          <Text style={s.borrower}>Borrower: {student?.name}</Text>
          <View style={s.dateRow}>
            <View>
              <Text style={s.dateLabel}>Borrow Date</Text>
              <Text style={s.dateVal}>{item.borrowDate ? new Date(item.borrowDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
            <View style={{ marginLeft: 24 }}>
              <Text style={s.dateLabel}>Due Date</Text>
              <Text style={[s.dateVal, isOverdue && { color: AdminColors.red }]}>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
          </View>
          <View style={s.statusRow}>
            <View style={[s.statusTag, { backgroundColor: isOverdue ? AdminColors.redLight : AdminColors.greenLight }]}>
              <Text style={[s.statusText, { color: isOverdue ? AdminColors.red : AdminColors.green }]}>{isOverdue ? 'Overdue' : 'On Time'}</Text>
            </View>
            {(item.fine || 0) > 0 && (
              <View style={[s.statusTag, { backgroundColor: AdminColors.redLight, marginLeft: 6 }]}>
                <Text style={[s.statusText, { color: AdminColors.red }]}>Fine: ₹{item.fine}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={s.returnBtn} onPress={() => handleReturn(item)}>
          <CheckCircle size={16} color="#fff" /><Text style={s.returnText}>Process Return</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}><Menu size={24} color={AdminColors.navy} /></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={s.title}>Book Returns</Text>
          <Text style={s.sub}>Process book returns and collect fines</Text>
        </View>
      </View>
      <View style={s.searchBox}>
        <Search size={18} color={AdminColors.textMuted} />
        <TextInput style={s.searchIn} placeholder="Search by book title or student..." placeholderTextColor={AdminColors.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <View style={s.sumRow}>
        {[{ icon: CheckCircle, v: activeCount, l: 'Active', ic: AdminColors.green, bg: AdminColors.greenLight },
          { icon: AlertCircle, v: overdueCount, l: 'Overdue', ic: AdminColors.red, bg: AdminColors.redLight },
          { icon: DollarSign, v: `₹${totalFines}`, l: 'Total Fines', ic: AdminColors.red, bg: AdminColors.redLight },
        ].map((c, i) => (
          <View key={i} style={s.sumCard}>
            <View style={[s.sumIcon, { backgroundColor: c.bg }]}><c.icon size={16} color={c.ic} /></View>
            <Text style={s.sumVal}>{c.v}</Text><Text style={s.sumLbl}>{c.l}</Text>
          </View>
        ))}
      </View>
      
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AdminColors.navy} />
        </View>
      ) : (
        <FlatList data={filteredRecords} keyExtractor={i => i.id} renderItem={renderReturn}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={s.empty}><RotateCcw size={48} color={AdminColors.textMuted} /><Text style={s.emptyT}>No active borrows</Text></View>}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: AdminColors.bgGrey },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', color: AdminColors.textPrimary },
  sub: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: AdminColors.border },
  searchIn: { flex: 1, fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8, paddingVertical: 0 },
  sumRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  sumCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 1 },
  sumIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  sumVal: { fontSize: 20, fontWeight: '700', color: AdminColors.textPrimary },
  sumLbl: { fontSize: 11, color: AdminColors.textSecondary, marginLeft: 4 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1 },
  cover: { width: 56, height: 75, borderRadius: 8, backgroundColor: '#eee' },
  bookTitle: { fontSize: 15, fontWeight: '700', color: AdminColors.textPrimary },
  author: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 1 },
  borrower: { fontSize: 11, color: AdminColors.textMuted, marginTop: 2 },
  dateRow: { flexDirection: 'row', marginTop: 6 },
  dateLabel: { fontSize: 10, color: AdminColors.textMuted },
  dateVal: { fontSize: 12, fontWeight: '600', color: AdminColors.textPrimary, marginTop: 1 },
  statusRow: { flexDirection: 'row', marginTop: 6 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  returnBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: AdminColors.navy, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, position: 'absolute', right: 14, top: 14 },
  returnText: { fontSize: 11, fontWeight: '600', color: '#fff', marginLeft: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyT: { fontSize: 16, color: AdminColors.textMuted, marginTop: 12 },
});

export default ReturnsScreen;
