import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Alert, FlatList, ActivityIndicator,
} from 'react-native';
import { Menu, BookOpen, Users, Calendar, CheckCircle, CreditCard, Hash, Search } from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { getAllStudents } from '../../services/studentService';
import { getBooks } from '../../services/bookService';
import { approveBorrow } from '../../services/borrowService';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { BORROW_STATUS, BORROW_DURATION_DAYS } from '../../utils/constants';

const IssueBookScreen = ({ navigation }) => {
  // Data
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  // Search
  const [studentQuery, setStudentQuery] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [showBookResults, setShowBookResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date calculations
  const today = new Date();
  const issueDate = today.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const due = new Date(today);
  due.setDate(due.getDate() + BORROW_DURATION_DAYS);
  const dueDate = due.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    const load = async () => {
      try {
        const [studentData, bookData] = await Promise.all([
          getAllStudents(),
          getBooks(),
        ]);
        setStudents(studentData);
        setBooks(bookData.filter(b => b.availableCopies > 0));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  // ─── Filtered Results ─────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!studentQuery.trim()) return [];
    const q = studentQuery.toLowerCase();
    return students.filter(s =>
      s.id?.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.usn?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [studentQuery, students]);

  const filteredBooks = useMemo(() => {
    if (!bookQuery.trim()) return [];
    const q = bookQuery.toLowerCase();
    return books.filter(b =>
      b.bookCode?.toLowerCase().includes(q) ||
      b.title?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [bookQuery, books]);

  const availableBooks = books.length;

  // ─── Issue Book ───────────────────────────────────────────────────────
  const handleIssue = async () => {
    if (!selectedStudent) { Alert.alert('Error', 'Please select a student by library card'); return; }
    if (!selectedBook) { Alert.alert('Error', 'Please select a book by book code'); return; }

    Alert.alert(
      'Confirm Issue',
      `Issue "${selectedBook.title}" to ${selectedStudent.name || selectedStudent.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              // Direct issue by admin — create borrow record as BORROWED immediately
              const borrowDate = new Date();
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

              const record = {
                studentId: selectedStudent.id,
                bookId: selectedBook.bookCode,
                status: BORROW_STATUS.BORROWED,
                borrowDate,
                dueDate,
                returnDate: null,
                fine: 0,
                fineStatus: false,
                approvedBy: 'admin',
                createdAt: serverTimestamp(),
              };

              const docRef = await addDoc(collection(db, 'borrow_records'), record);

              // Update book available copies
              const bookDocRef = doc(db, 'books', selectedBook.bookCode);
              const bookDoc = await getDoc(bookDocRef);
              if (bookDoc.exists()) {
                await updateDoc(bookDocRef, {
                  availableCopies: bookDoc.data().availableCopies - 1,
                });
              }

              // Create due_books tracking entry
              await addDoc(collection(db, 'due_books'), {
                borrowRecordId: docRef.id,
                bookId: selectedBook.bookCode,
                studentId: selectedStudent.id,
                dueDate,
                fine: 0,
              });

              Alert.alert('✅ Success', `"${selectedBook.title}" issued to ${selectedStudent.name || selectedStudent.id}`);
              setSelectedStudent(null);
              setSelectedBook(null);
              setStudentQuery('');
              setBookQuery('');
            } catch (err) {
              console.error(err);
              Alert.alert('Error', err.message || 'Failed to issue book');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}><Menu size={24} color={AdminColors.navy} /></TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.title}>Issue Book</Text>
            <Text style={s.sub}>Issue a book directly to a student</Text>
          </View>
        </View>

        <View style={s.sumRow}>
          <View style={s.sumCard}>
            <View style={[s.sumIcon, { backgroundColor: AdminColors.blueLight }]}><BookOpen size={18} color={AdminColors.navy} /></View>
            <Text style={s.sumVal}>{availableBooks}</Text><Text style={s.sumLbl}>Books Available</Text>
          </View>
          <View style={s.sumCard}>
            <View style={[s.sumIcon, { backgroundColor: AdminColors.purpleLight }]}><Users size={18} color={AdminColors.purple} /></View>
            <Text style={s.sumVal}>{students.length}</Text><Text style={s.sumLbl}>Active Students</Text>
          </View>
        </View>

        <View style={s.formCard}>
          <Text style={s.formTitle}>Book Issue Details</Text>

          {/* ─── Library Card Search ─────────────────────── */}
          <Text style={s.label}>Library Card / Student *</Text>
          <View style={s.inputBox}>
            <CreditCard size={16} color={AdminColors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="Search by library card, name, or USN..."
              placeholderTextColor={AdminColors.textMuted}
              value={studentQuery}
              onChangeText={(t) => { setStudentQuery(t); setShowStudentResults(true); setSelectedStudent(null); }}
              onFocus={() => setShowStudentResults(true)}
            />
            {selectedStudent && (
              <View style={s.selectedBadge}><Text style={s.selectedBadgeText}>✓</Text></View>
            )}
          </View>

          {showStudentResults && filteredStudents.length > 0 && !selectedStudent && (
            <View style={s.dropdown}>
              {filteredStudents.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={s.dropdownItem}
                  onPress={() => {
                    setSelectedStudent(st);
                    setStudentQuery(`${st.id} — ${st.name || ''}`);
                    setShowStudentResults(false);
                  }}
                >
                  <CreditCard size={14} color={AdminColors.navy} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={s.dropItemTitle}>{st.id}</Text>
                    <Text style={s.dropItemSub}>{st.name || 'No Name'} • {st.usn || ''}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ─── Book Code Search ────────────────────────── */}
          <Text style={[s.label, { marginTop: 8 }]}>Book Code *</Text>
          <View style={s.inputBox}>
            <Hash size={16} color={AdminColors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="Search by book code or title..."
              placeholderTextColor={AdminColors.textMuted}
              value={bookQuery}
              onChangeText={(t) => { setBookQuery(t); setShowBookResults(true); setSelectedBook(null); }}
              onFocus={() => setShowBookResults(true)}
            />
            {selectedBook && (
              <View style={s.selectedBadge}><Text style={s.selectedBadgeText}>✓</Text></View>
            )}
          </View>

          {showBookResults && filteredBooks.length > 0 && !selectedBook && (
            <View style={s.dropdown}>
              {filteredBooks.map((bk) => (
                <TouchableOpacity
                  key={bk.bookCode}
                  style={s.dropdownItem}
                  onPress={() => {
                    setSelectedBook(bk);
                    setBookQuery(`${bk.bookCode} — ${bk.title}`);
                    setShowBookResults(false);
                  }}
                >
                  <BookOpen size={14} color={AdminColors.navy} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={s.dropItemTitle}>{bk.bookCode}</Text>
                    <Text style={s.dropItemSub}>{bk.title} • {bk.availableCopies} copies left</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ─── Selected Summary ────────────────────────── */}
          {(selectedStudent || selectedBook) && (
            <View style={s.selectedSummary}>
              {selectedStudent && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Student:</Text>
                  <Text style={s.summaryValue}>{selectedStudent.name || selectedStudent.id}</Text>
                </View>
              )}
              {selectedBook && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Book:</Text>
                  <Text style={s.summaryValue}>{selectedBook.title}</Text>
                </View>
              )}
            </View>
          )}

          {/* ─── Dates ───────────────────────────────────── */}
          <View style={s.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Issue Date *</Text>
              <View style={s.dateBox}><Calendar size={16} color={AdminColors.textMuted} /><Text style={s.dateText}>{issueDate}</Text></View>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.label}>Due Date</Text>
              <View style={s.dateBox}><Calendar size={16} color={AdminColors.textMuted} /><Text style={s.dateText}>{dueDate}</Text></View>
              <Text style={s.dateHint}>{BORROW_DURATION_DAYS} days from issue date</Text>
            </View>
          </View>

          {/* ─── Buttons ─────────────────────────────────── */}
          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.issueBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleIssue}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <><CheckCircle size={18} color="#fff" /><Text style={s.issueBtnText}>Issue Book</Text></>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.clearBtn} onPress={() => { setSelectedStudent(null); setSelectedBook(null); setStudentQuery(''); setBookQuery(''); }}>
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
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: AdminColors.border, borderRadius: 10, paddingHorizontal: 14, height: 46, marginBottom: 4 },
  input: { flex: 1, fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8, paddingVertical: 0 },
  selectedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: AdminColors.green, justifyContent: 'center', alignItems: 'center' },
  selectedBadgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Dropdown autocomplete
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: AdminColors.border, borderRadius: 10, marginBottom: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AdminColors.border },
  dropItemTitle: { fontSize: 14, fontWeight: '700', color: AdminColors.navy },
  dropItemSub: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 1 },

  // Selected summary
  selectedSummary: { backgroundColor: AdminColors.blueLight, borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  summaryLabel: { fontSize: 13, fontWeight: '700', color: AdminColors.navy, width: 65 },
  summaryValue: { fontSize: 13, color: AdminColors.textPrimary, flex: 1 },

  dateRow: { flexDirection: 'row', marginTop: 12 },
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
