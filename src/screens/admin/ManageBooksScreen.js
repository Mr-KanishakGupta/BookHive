import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  TextInput, StyleSheet, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import {
  Menu, Search, Plus, Edit3, Trash2, Filter,
  BookOpen,
} from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { getBooks, deleteBook } from '../../services/bookService';
import { DEPARTMENTS } from '../../utils/constants'; // assuming we have it there, or just define locally

const DEPARTMENTS_LIST = [
  'All Departments',
  'Independent',
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Information Science',
  'Civil Engineering',
  'Electrical Engineering',
];

const ManageBooksScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [showDeptFilter, setShowDeptFilter] = useState(false);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch books');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchBooks);
    return unsubscribe;
  }, [navigation]);

  const handleDelete = async (bookCode) => {
    try {
      await deleteBook(bookCode);
      fetchBooks();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const filteredBooks = useMemo(() => {
    let result = books;
    if (appliedQuery.trim()) {
      const q = appliedQuery.toLowerCase();
      result = result.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.bookCode?.toLowerCase().includes(q)
      );
    }
    if (selectedDept !== 'All Departments') {
      result = result.filter(b => b.department === selectedDept);
    }
    return result;
  }, [appliedQuery, selectedDept, books]);

  const handleSearch = () => {
    setAppliedQuery(searchQuery);
  };

  const getStatusInfo = (book) => {
    if (book.availableCopies === 0) return { text: 'Unavailable', color: AdminColors.red, bg: AdminColors.redLight };
    if (book.availableCopies <= book.totalCopies * 0.3) return { text: 'Limited', color: AdminColors.orange, bg: AdminColors.orangeLight };
    return { text: 'Available', color: AdminColors.green, bg: AdminColors.greenLight };
  };

  const getGenreColor = (genre) => {
    switch (genre) {
      case 'Academic': return { color: AdminColors.blue, bg: AdminColors.blueLight };
      case 'Technical': return { color: AdminColors.orange, bg: AdminColors.orangeLight };
      case 'Reference': return { color: AdminColors.red, bg: AdminColors.redLight };
      case 'Research': return { color: AdminColors.purple, bg: AdminColors.purpleLight };
      default: return { color: AdminColors.navy, bg: AdminColors.blueLight };
    }
  };

  const renderBook = ({ item }) => {
    const status = getStatusInfo(item);
    const genreStyle = getGenreColor(item.genre);

    return (
      <View style={styles.bookRow}>
        <Image source={{ uri: item.frontImage || 'https://via.placeholder.com/150' }} style={styles.bookCover} />
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.bookAuthor}>{item.author}</Text>
          <View style={styles.bookMeta}>
            <View style={[styles.tag, { backgroundColor: genreStyle.bg }]}>
              <Text style={[styles.tagText, { color: genreStyle.color }]}>{item.genre || 'General'}</Text>
            </View>
            <Text style={styles.deptText}>{item.department}</Text>
          </View>
        </View>
        <View style={styles.bookRight}>
          <View style={[styles.statusTag, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
          <Text style={styles.copiesText}>{item.availableCopies}/{item.totalCopies}</Text>
          <Text style={styles.isbnText}>{item.bookCode}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('EditBook', { bookCode: item.bookCode })}>
            <Edit3 size={16} color={AdminColors.blue} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.bookCode)}>
            <Trash2 size={16} color={AdminColors.red} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AdminColors.bgGrey} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
          <Menu size={24} color={AdminColors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.headerTitle}>Manage Books</Text>
          <Text style={styles.headerSub}>Add, edit, or remove books from the library</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddBook')}>
          <Plus size={18} color={AdminColors.white} />
          <Text style={styles.addBtnText}>Add New Book</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={AdminColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, or code..."
            placeholderTextColor={AdminColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowDeptFilter(!showDeptFilter)}
        >
          <Filter size={16} color={AdminColors.textSecondary} />
          <Text style={styles.filterText}>{selectedDept === 'All Departments' ? 'All Depts' : selectedDept.split(' ')[0]}</Text>
        </TouchableOpacity>
      </View>

      {showDeptFilter && (
        <View style={styles.dropdown}>
          {DEPARTMENTS_LIST.map(dept => (
            <TouchableOpacity
              key={dept}
              style={[styles.dropdownItem, selectedDept === dept && styles.dropdownActive]}
              onPress={() => { setSelectedDept(dept); setShowDeptFilter(false); }}
            >
              <Text style={[styles.dropdownText, selectedDept === dept && { color: AdminColors.navy, fontWeight: '600' }]}>{dept}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.countText}>{filteredBooks.length} books found</Text>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AdminColors.navy} />
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.bookCode || item.id}
          renderItem={renderBook}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <BookOpen size={48} color={AdminColors.textMuted} />
              <Text style={styles.emptyText}>No books found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AdminColors.bgGrey },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  menuBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: AdminColors.white,
    justifyContent: 'center', alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: AdminColors.textPrimary },
  headerSub: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AdminColors.navy,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: AdminColors.white, marginLeft: 6 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 8,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: AdminColors.white,
    borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: AdminColors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8, paddingVertical: 0 },
  searchBtn: {
    backgroundColor: AdminColors.navy, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  searchBtnText: { fontSize: 12, fontWeight: '600', color: AdminColors.white },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AdminColors.white,
    paddingHorizontal: 12, height: 46, borderRadius: 12, borderWidth: 1, borderColor: AdminColors.border,
  },
  filterText: { fontSize: 12, color: AdminColors.textSecondary, marginLeft: 6 },
  dropdown: {
    position: 'absolute', top: 170, right: 16, zIndex: 999,
    backgroundColor: AdminColors.white, borderRadius: 12, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
    width: 220, paddingVertical: 8,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 10 },
  dropdownActive: { backgroundColor: AdminColors.blueLight },
  dropdownText: { fontSize: 14, color: AdminColors.textPrimary },
  countText: { fontSize: 13, color: AdminColors.textSecondary, paddingHorizontal: 20, marginBottom: 8 },
  bookRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AdminColors.white,
    borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  bookCover: { width: 44, height: 60, borderRadius: 6, backgroundColor: '#eee' },
  bookInfo: { flex: 1, marginLeft: 12 },
  bookTitle: { fontSize: 14, fontWeight: '600', color: AdminColors.textPrimary },
  bookAuthor: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 1 },
  bookMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '600' },
  deptText: { fontSize: 10, color: AdminColors.textSecondary },
  bookRight: { alignItems: 'flex-end', marginRight: 8 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 2 },
  statusText: { fontSize: 10, fontWeight: '600' },
  copiesText: { fontSize: 11, color: AdminColors.textSecondary, marginTop: 2 },
  isbnText: { fontSize: 9, color: AdminColors.textMuted, marginTop: 1 },
  actions: { gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: AdminColors.bgGrey,
    justifyContent: 'center', alignItems: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: AdminColors.textMuted, marginTop: 12 },
});

export default ManageBooksScreen;
