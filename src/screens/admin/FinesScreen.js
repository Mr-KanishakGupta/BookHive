import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, StatusBar, Alert } from 'react-native';
import { Menu, Search, DollarSign, CheckCircle, AlertCircle, User, Mail, Building2, BookOpen, Calendar } from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { FINES, STUDENTS, BOOKS } from '../../services/mockData';

const FinesScreen = ({ navigation }) => {
  const [tab, setTab] = useState('unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const unpaid = FINES.filter(f => f.status === 'unpaid');
  const paid = FINES.filter(f => f.status === 'paid');
  const totalUnpaid = unpaid.reduce((s, f) => s + f.amount, 0);
  const totalPaid = paid.reduce((s, f) => s + f.amount, 0);

  const data = useMemo(() => {
    const list = tab === 'unpaid' ? unpaid : paid;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(f => {
      const student = STUDENTS.find(s => s.id === f.studentId);
      const book = BOOKS.find(b => b.id === f.bookId);
      return student?.name.toLowerCase().includes(q) || book?.title.toLowerCase().includes(q);
    });
  }, [tab, searchQuery]);

  const renderFine = ({ item }) => {
    const student = STUDENTS.find(s => s.id === item.studentId);
    const book = BOOKS.find(b => b.id === item.bookId);
    const isUnpaid = item.status === 'unpaid';
    return (
      <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: isUnpaid ? AdminColors.orange : AdminColors.green }]}>
        <View style={s.cardTop}>
          <View style={s.cardLeft}>
            <View style={[s.avatar, { backgroundColor: isUnpaid ? AdminColors.redLight : AdminColors.greenLight }]}>
              <User size={18} color={isUnpaid ? AdminColors.red : AdminColors.green} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.name}>{student?.name}</Text>
              <View style={s.infoRow}><Mail size={11} color={AdminColors.textMuted} /><Text style={s.infoText}>{student?.email}</Text></View>
              <View style={s.infoRow}><Building2 size={11} color={AdminColors.textMuted} /><Text style={s.infoText}>{student?.department}</Text></View>
              <View style={s.infoRow}><BookOpen size={11} color={AdminColors.textMuted} /><Text style={s.infoText}>{book?.title}</Text></View>
              <View style={s.infoRow}><Calendar size={11} color={AdminColors.textMuted} /><Text style={s.infoText}>Due: {item.dueDate}  <Text style={{ color: AdminColors.red }}>{item.daysOverdue} days overdue</Text></Text></View>
            </View>
          </View>
          <View style={s.cardRight}>
            <View style={[s.statusTag, { backgroundColor: isUnpaid ? AdminColors.orangeLight : AdminColors.greenLight }]}>
              <Text style={[s.statusText, { color: isUnpaid ? AdminColors.orange : AdminColors.green }]}>{isUnpaid ? 'Overdue' : 'Paid'}</Text>
            </View>
            <Text style={s.amountLabel}>Fine Amount</Text>
            <Text style={[s.amount, { color: isUnpaid ? AdminColors.red : AdminColors.green }]}>₹{item.amount}</Text>
            <Text style={s.perDay}>₹{item.perDay} per day</Text>
          </View>
        </View>
        {isUnpaid && (
          <TouchableOpacity style={s.payBtn} onPress={() => Alert.alert('Paid', `Fine of ₹${item.amount} marked as paid`)}>
            <CheckCircle size={16} color="#fff" /><Text style={s.payText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}><Menu size={24} color={AdminColors.navy} /></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={s.title}>Fine Management</Text>
          <Text style={s.sub}>Track and manage student fines</Text>
        </View>
      </View>
      <View style={s.sumRow}>
        {[{ icon: DollarSign, v: `₹${totalUnpaid}`, l: 'Total Unpaid Amount', sub: `${unpaid.length} students with pending fines`, ic: AdminColors.red, bg: AdminColors.redLight, border: AdminColors.red },
          { icon: CheckCircle, v: `₹${totalPaid}`, l: 'Total Paid Amount', sub: `${paid.length} payments collected`, ic: AdminColors.green, bg: AdminColors.greenLight, border: AdminColors.green },
          { icon: User, v: unpaid.length, l: 'Students with Pending Fines', sub: 'Requires immediate attention', ic: AdminColors.navy, bg: AdminColors.blueLight, border: AdminColors.navy },
        ].map((c, i) => (
          <View key={i} style={[s.sumCard, { borderTopWidth: 3, borderTopColor: c.border }]}>
            <View style={[s.sumIcon, { backgroundColor: c.bg }]}><c.icon size={18} color={c.ic} /></View>
            <Text style={s.sumLabel}>{c.l}</Text>
            <Text style={[s.sumVal, { color: c.ic }]}>{c.v}</Text>
            <Text style={s.sumSub}>{c.sub}</Text>
          </View>
        ))}
      </View>
      <View style={s.searchBox}>
        <Search size={18} color={AdminColors.textMuted} />
        <TextInput style={s.searchIn} placeholder="Search by student name, book title..." placeholderTextColor={AdminColors.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'unpaid' && s.tabActive]} onPress={() => setTab('unpaid')}>
          <AlertCircle size={14} color={tab === 'unpaid' ? '#fff' : AdminColors.textSecondary} />
          <Text style={[s.tabText, tab === 'unpaid' && s.tabTextA]}>Unpaid Fines ({unpaid.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'paid' && s.tabActive]} onPress={() => setTab('paid')}>
          <CheckCircle size={14} color={tab === 'paid' ? '#fff' : AdminColors.textSecondary} />
          <Text style={[s.tabText, tab === 'paid' && s.tabTextA]}>Paid Fines ({paid.length})</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={data} keyExtractor={i => i.id} renderItem={renderFine}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No fines found</Text></View>}
      />
    </View>
  );
};

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
  sumVal: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  sumSub: { fontSize: 9, color: AdminColors.textMuted, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: AdminColors.border },
  searchIn: { flex: 1, fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8, paddingVertical: 0 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: AdminColors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: AdminColors.navy },
  tabText: { fontSize: 12, fontWeight: '600', color: AdminColors.textSecondary, marginLeft: 4 },
  tabTextA: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, elevation: 1 },
  cardTop: { flexDirection: 'row' },
  cardLeft: { flex: 1, flexDirection: 'row' },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: AdminColors.textPrimary },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  infoText: { fontSize: 11, color: AdminColors.textSecondary, marginLeft: 4, flex: 1 },
  cardRight: { alignItems: 'flex-end' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  amountLabel: { fontSize: 10, color: AdminColors.textMuted, marginTop: 4 },
  amount: { fontSize: 24, fontWeight: '700' },
  perDay: { fontSize: 10, color: AdminColors.textMuted },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: AdminColors.green, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  payText: { fontSize: 14, fontWeight: '600', color: '#fff', marginLeft: 6 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyT: { fontSize: 16, color: AdminColors.textMuted },
});

export default FinesScreen;
