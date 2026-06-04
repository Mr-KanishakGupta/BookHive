import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import {
  Menu, Search, UserPlus, Mail, Building2, BookOpen,
  AlertCircle, Eye, Users as UsersIcon, Trash2
} from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { getAllStudents, createStudent, deleteStudent } from '../../services/studentService';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../config/firebase';

const StudentsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalBorrowed: 0, totalFines: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', libraryCardId: '', email: '', usn: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);

      const q = query(collection(db, 'borrow_records'), where('status', 'in', ['BORROWED', 'OVERDUE']));
      const borrowSnap = await getCountFromServer(q);
      
      const totalFines = data.reduce((sum, s) => sum + (s.fineAmount || 0), 0);
      
      setStats({
        totalBorrowed: borrowSnap.data().count,
        totalFines: totalFines,
      });

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchStudents);
    return unsubscribe;
  }, [navigation]);

  const filteredStudents = useMemo(() => {
    if (!appliedQuery.trim()) return students;
    const q = appliedQuery.toLowerCase();
    return students.filter(s => 
      s.name?.toLowerCase().includes(q) || 
      s.college_id?.toLowerCase().includes(q) || 
      s.library_card_id?.toLowerCase().includes(q)
    );
  }, [appliedQuery, students]);

  const handleSearch = () => setAppliedQuery(searchQuery);

  const handleAddStudent = () => {
    setShowAddModal(true);
  };

  const submitAddStudent = async () => {
    if (!newStudent.libraryCardId || !newStudent.email) {
      Alert.alert('Error', 'Library Card ID and Email are required.');
      return;
    }
    
    // Domain validation
    if (!newStudent.email.trim().toLowerCase().endsWith('@bmsce.ac.in')) {
      Alert.alert('Error', 'Only @bmsce.ac.in college emails are allowed.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStudent(
        newStudent.libraryCardId.trim(),
        newStudent.email.trim().toLowerCase(),
        newStudent.usn.trim(),
        newStudent.name.trim()
      );
      Alert.alert('Success', 'Student added and email sent successfully!');
      setShowAddModal(false);
      setNewStudent({ name: '', libraryCardId: '', email: '', usn: '' });
      fetchStudents();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = (item) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${item.name || item.library_card_id}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(item.library_card_id);
              Alert.alert('Success', 'Student deleted successfully.');
              fetchStudents();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const initialColors = ['#003366', '#6F42C1', '#28A745', '#DC3545', '#F57C00'];

  const renderStudent = ({ item, index }) => {
    return (
      <View style={s.card}>
        <View style={[s.avatar, { backgroundColor: initialColors[index % initialColors.length] }]}>
          <Text style={s.avatarText}>{(item.name || item.library_card_id).charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{item.name || item.library_card_id}</Text>
        <View style={s.row}><Mail size={12} color={AdminColors.textMuted} /><Text style={s.info} numberOfLines={1}>{item.college_id}</Text></View>
        <View style={s.row}><Building2 size={12} color={AdminColors.textMuted} /><Text style={s.info} numberOfLines={1}>{item.usn || 'N/A'}</Text></View>
        <View style={s.stats}>
          <View style={s.si}><AlertCircle size={12} color={AdminColors.textMuted} /><Text style={s.sl}> Fines</Text></View>
          <Text style={[s.sv, item.fineAmount > 0 && { color: AdminColors.red }]}>₹{item.fineAmount || 0}</Text>
        </View>
        <View style={s.footer}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={s.detBtn} onPress={() => Alert.alert('Student Details', `Name: ${item.name || 'N/A'}\nCard ID: ${item.library_card_id}\nEmail: ${item.college_id}\nUSN: ${item.usn || 'N/A'}`)}>
              <Eye size={14} color={AdminColors.textSecondary} /><Text style={s.detText}>Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[s.detBtn, { borderColor: AdminColors.redLight }]} onPress={() => handleDeleteStudent(item)}>
              <Trash2 size={14} color={AdminColors.red} /><Text style={[s.detText, { color: AdminColors.red }]}>Delete</Text>
            </TouchableOpacity>
          </View>
          {(item.fineAmount > 0 || item.isBlacklisted) && (
            <View style={s.badge}><Text style={s.badgeText}>{item.isBlacklisted ? 'Blacklisted' : 'Has Fines'}</Text></View>
          )}
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
        <TouchableOpacity style={s.addBtn} onPress={handleAddStudent}>
          <UserPlus size={18} color="#fff" /><Text style={s.addText}>Add Student</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AdminColors.navy} />
        </View>
      ) : (
        <>
          <View style={s.sumRow}>
            {[{ icon: Mail, v: students.length, l: 'Total Students', ic: AdminColors.blue, bg: AdminColors.blueLight },
              { icon: BookOpen, v: stats.totalBorrowed, l: 'Books Borrowed', ic: AdminColors.navy, bg: AdminColors.blueLight },
              { icon: AlertCircle, v: `₹${stats.totalFines}`, l: 'Total Fines', ic: AdminColors.red, bg: AdminColors.redLight },
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
          <FlatList data={filteredStudents} keyExtractor={i => i.id || i.library_card_id} renderItem={renderStudent}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={s.empty}><UsersIcon size={48} color={AdminColors.textMuted} /><Text style={s.emptyT}>No students found</Text></View>}
          />
        </>
      )}

      {/* Add Student Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Add New Student</Text>
            
            <TextInput
              style={s.modalInput}
              placeholder="Full Name (Optional)"
              value={newStudent.name}
              onChangeText={t => setNewStudent({ ...newStudent, name: t })}
            />
            <TextInput
              style={s.modalInput}
              placeholder="Library Card ID *"
              value={newStudent.libraryCardId}
              onChangeText={t => setNewStudent({ ...newStudent, libraryCardId: t })}
              autoCapitalize="characters"
            />
            <TextInput
              style={s.modalInput}
              placeholder="College Email *"
              value={newStudent.email}
              onChangeText={t => setNewStudent({ ...newStudent, email: t })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={s.modalInput}
              placeholder="USN (Optional)"
              value={newStudent.usn}
              onChangeText={t => setNewStudent({ ...newStudent, usn: t })}
              autoCapitalize="characters"
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowAddModal(false)} disabled={isSubmitting}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSubmit} onPress={submitAddStudent} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={s.modalSubmitText}>Add & Send Email</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: AdminColors.navy, marginBottom: 20 },
  modalInput: { borderWidth: 1, borderColor: AdminColors.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, fontSize: 15, color: AdminColors.textPrimary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalCancelText: { color: AdminColors.textSecondary, fontWeight: '600', fontSize: 15 },
  modalSubmit: { backgroundColor: AdminColors.navy, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

export default StudentsScreen;
