import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Alert } from 'react-native';
import { Menu, BookOpen, Users, Calendar, CheckCircle, X } from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { BOOKS, STUDENTS } from '../../services/mockData';

const IssueBookScreen = ({ navigation }) => {
  const [student, setStudent] = useState('');
  const [book, setBook] = useState('');
  const availableBooks = BOOKS.filter(b => b.availableCopies > 0).length;
  const today = new Date();
  const issueDate = today.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const due = new Date(today); due.setDate(due.getDate() + 14);
  const dueDate = due.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleIssue = () => {
    if (!student.trim() || !book.trim()) { Alert.alert('Error', 'Please fill in all fields'); return; }
    Alert.alert('Success', `Book issued to ${student}`);
    setStudent(''); setBook('');
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}><Menu size={24} color={AdminColors.navy} /></TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.title}>Issue Book</Text>
            <Text style={s.sub}>Issue a book to a student</Text>
          </View>
        </View>
        <View style={s.sumRow}>
          <View style={s.sumCard}>
            <View style={[s.sumIcon, { backgroundColor: AdminColors.blueLight }]}><BookOpen size={18} color={AdminColors.navy} /></View>
            <Text style={s.sumVal}>{availableBooks}</Text><Text style={s.sumLbl}>Books Available</Text>
          </View>
          <View style={s.sumCard}>
            <View style={[s.sumIcon, { backgroundColor: AdminColors.purpleLight }]}><Users size={18} color={AdminColors.purple} /></View>
            <Text style={s.sumVal}>{STUDENTS.length}</Text><Text style={s.sumLbl}>Active Students</Text>
          </View>
        </View>
        <View style={s.formCard}>
          <Text style={s.formTitle}>Book Issue Details</Text>
          <Text style={s.label}>Select Student *</Text>
          <View style={s.inputBox}>
            <Users size={16} color={AdminColors.textMuted} />
            <TextInput style={s.input} placeholder="Search student by name or email..." placeholderTextColor={AdminColors.textMuted} value={student} onChangeText={setStudent} />
          </View>
          <Text style={s.label}>Select Book *</Text>
          <View style={s.inputBox}>
            <BookOpen size={16} color={AdminColors.textMuted} />
            <TextInput style={s.input} placeholder="Search book by title or author..." placeholderTextColor={AdminColors.textMuted} value={book} onChangeText={setBook} />
          </View>
          <View style={s.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Issue Date *</Text>
              <View style={s.dateBox}><Calendar size={16} color={AdminColors.textMuted} /><Text style={s.dateText}>{issueDate}</Text></View>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.label}>Due Date</Text>
              <View style={s.dateBox}><Calendar size={16} color={AdminColors.textMuted} /><Text style={s.dateText}>{dueDate}</Text></View>
              <Text style={s.dateHint}>14 days from issue date</Text>
            </View>
          </View>
          <View style={s.btnRow}>
            <TouchableOpacity style={s.issueBtn} onPress={handleIssue} activeOpacity={0.8}>
              <CheckCircle size={18} color="#fff" /><Text style={s.issueBtnText}>Issue Book</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.clearBtn} onPress={() => { setStudent(''); setBook(''); }}>
              <Text style={s.clearBtnText}>Clear Form</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: AdminColors.bgGrey },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', color: AdminColors.textPrimary },
  sub: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 2 },
  sumRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  sumCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  sumIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  sumVal: { fontSize: 28, fontWeight: '700', color: AdminColors.textPrimary },
  sumLbl: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 2 },
  formCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 20, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: '700', color: AdminColors.textPrimary, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: AdminColors.textPrimary, marginBottom: 8, marginTop: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: AdminColors.border, borderRadius: 10, paddingHorizontal: 14, height: 46, marginBottom: 12 },
  input: { flex: 1, fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8, paddingVertical: 0 },
  dateRow: { flexDirection: 'row', marginTop: 4 },
  dateBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: AdminColors.border, borderRadius: 10, paddingHorizontal: 14, height: 46, backgroundColor: AdminColors.bgGrey },
  dateText: { fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8 },
  dateHint: { fontSize: 11, color: AdminColors.textMuted, marginTop: 4 },
  btnRow: { flexDirection: 'row', marginTop: 24, gap: 12 },
  issueBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: AdminColors.navy, paddingVertical: 14, borderRadius: 10 },
  issueBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', marginLeft: 8 },
  clearBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: AdminColors.border, borderRadius: 10, paddingVertical: 14 },
  clearBtnText: { fontSize: 15, fontWeight: '500', color: AdminColors.textSecondary },
});

export default IssueBookScreen;
