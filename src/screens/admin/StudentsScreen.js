import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import {
  Menu, Search, UserPlus, Mail, Building2, BookOpen,
  AlertCircle, Eye, Users as UsersIcon,
} from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { STUDENTS, BORROW_RECORDS } from '../../services/mockData';

const StudentsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const totalBorrowed = BORROW_RECORDS.filter(br => br.status === 'active' || br.status === 'overdue').length;
  const totalFines = STUDENTS.reduce((sum, s) => sum + s.fines, 0);
  const filteredStudents = useMemo(() => {
    if (!appliedQuery.trim()) return STUDENTS;
    const q = appliedQuery.toLowerCase();
    return STUDENTS.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [appliedQuery]);
  const handleSearch = () => setAppliedQuery(searchQuery);
  const initialColors = ['#003366', '#6F42C1', '#28A745', '#DC3545', '#F57C00'];

  const renderStudent = ({ item, index }) => {
    const borrowed = BORROW_RECORDS.filter(br => br.studentId === item.id && (br.status === 'active' || br.status === 'overdue')).length;
    return (
      <View style={s.card}>
        <View style={[s.avatar, { backgroundColor: initialColors[index % initialColors.length] }]}>
          <Text style={s.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <Text style={s.name}>{item.name}</Text>
        <View style={s.row}><Mail size={12} color={AdminColors.textMuted} /><Text style={s.info} numberOfLines={1}>{item.email}</Text></View>
        <View style={s.row}><Building2 size={12} color={AdminColors.textMuted} /><Text style={s.info} numberOfLines={1}>{item.department}</Text></View>
        <View style={s.stats}>
          <View style={s.si}><BookOpen size={12} color={AdminColors.textMuted} /><Text style={s.sl}> Borrowed</Text></View>
          <Text style={s.sv}>{borrowed}</Text>
          <View style={[s.si, { marginLeft: 16 }]}><AlertCircle size={12} color={AdminColors.textMuted} /><Text style={s.sl}> Fines</Text></View>
          <Text style={[s.sv, item.fines > 0 && { color: AdminColors.red }]}>₹{item.fines}</Text>
        </View>
        <View style={s.footer}>
          <TouchableOpacity style={s.detBtn} onPress={() => Alert.alert('Details', item.name)}>
            <Eye size={14} color={AdminColors.textSecondary} /><Text style={s.detText}>View Details</Text>
          </TouchableOpacity>
          {item.fines > 0 && <View style={s.badge}><Text style={s.badgeText}>Has Fines</Text></View>}
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}><Menu size={24} color={AdminColors.navy} /></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={s.title}>Manage Students</Text>
          <Text style={s.sub}>View and manage registered students</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => Alert.alert('Add Student')}>
          <UserPlus size={18} color="#fff" /><Text style={s.addText}>Add Student</Text>
        </TouchableOpacity>
      </View>
      <View style={s.sumRow}>
        {[{ icon: Mail, v: STUDENTS.length, l: 'Total Students', ic: AdminColors.blue, bg: AdminColors.blueLight },
          { icon: BookOpen, v: totalBorrowed, l: 'Books Borrowed', ic: AdminColors.navy, bg: AdminColors.blueLight },
          { icon: AlertCircle, v: `₹${totalFines}`, l: 'Total Fines', ic: AdminColors.red, bg: AdminColors.redLight },
        ].map((c, i) => (
          <View key={i} style={s.sumCard}>
            <View style={[s.sumIcon, { backgroundColor: c.bg }]}><c.icon size={18} color={c.ic} /></View>
            <Text style={s.sumVal}>{c.v}</Text><Text style={s.sumLbl}>{c.l}</Text>
          </View>
        ))}
      </View>
      <View style={s.searchBox}>
        <Search size={18} color={AdminColors.textMuted} />
        <TextInput style={s.searchIn} placeholder="Search by name or email..." placeholderTextColor={AdminColors.textMuted} value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} />
        <TouchableOpacity style={s.sBtn} onPress={handleSearch}><Text style={s.sBtnT}>Search</Text></TouchableOpacity>
      </View>
      <Text style={s.cnt}>{filteredStudents.length} students found</Text>
      <FlatList data={filteredStudents} keyExtractor={i => i.id} renderItem={renderStudent}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={s.empty}><UsersIcon size={48} color={AdminColors.textMuted} /><Text style={s.emptyT}>No students found</Text></View>}
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
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: AdminColors.navy, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addText: { fontSize: 13, fontWeight: '600', color: '#fff', marginLeft: 6 },
  sumRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  sumCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 1 },
  sumIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  sumVal: { fontSize: 22, fontWeight: '700', color: AdminColors.textPrimary },
  sumLbl: { fontSize: 11, color: AdminColors.textSecondary, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: AdminColors.border },
  searchIn: { flex: 1, fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8, paddingVertical: 0 },
  sBtn: { backgroundColor: AdminColors.navy, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  sBtnT: { fontSize: 12, fontWeight: '600', color: '#fff' },
  cnt: { fontSize: 13, color: AdminColors.textSecondary, paddingHorizontal: 20, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 10 },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  name: { fontSize: 15, fontWeight: '700', color: AdminColors.textPrimary, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  info: { fontSize: 11, color: AdminColors.textSecondary, marginLeft: 4, flex: 1 },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: AdminColors.border },
  si: { flexDirection: 'row', alignItems: 'center' },
  sl: { fontSize: 11, color: AdminColors.textMuted },
  sv: { fontSize: 16, fontWeight: '700', color: AdminColors.textPrimary, marginLeft: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  detBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: AdminColors.border },
  detText: { fontSize: 11, fontWeight: '500', color: AdminColors.textSecondary, marginLeft: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: AdminColors.redLight },
  badgeText: { fontSize: 10, fontWeight: '600', color: AdminColors.red },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyT: { fontSize: 16, color: AdminColors.textMuted, marginTop: 12 },
});

export default StudentsScreen;
