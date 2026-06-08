import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useBooks } from '../context/BooksContext';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import BookCard from '../components/BookCard';
import { Typography, Spacing } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';

const SearchScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { searchResults, searchBooksAction, isLoading, books, loadBooks } = useBooks();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeDept, setActiveDept] = useState('all_dept');
  const [initialBooks, setInitialBooks] = useState([]);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Load initial top 20 books when screen mounts
  useEffect(() => {
    const loadInitial = async () => {
      try {
        await loadBooks();
      } catch (e) {
        console.error('Error loading initial books:', e);
      }
    };
    loadInitial();
  }, []);

  // When books are loaded, set initial books (top 20)
  useEffect(() => {
    if (books && books.length > 0 && !initialLoaded) {
      setInitialBooks(books.slice(0, 20));
      setInitialLoaded(true);
    }
  }, [books, initialLoaded]);

  const hasQuery = query.trim().length > 0;

  const handleSearch = useCallback((text) => {
    setQuery(text);
    if (text.trim().length > 0) {
      searchBooksAction(text, activeFilter === 'all' ? undefined : activeFilter);
    }
  }, [activeFilter, searchBooksAction]);

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
    if (query.trim().length > 0) {
      searchBooksAction(query, filter === 'all' ? undefined : filter);
    }
  }, [query, searchBooksAction]);

  const handleDeptChange = useCallback((dept) => {
    setActiveDept(dept);
  }, []);

  const navigateToBook = (book) => {
    navigation.navigate('BookDetails', { bookId: book.id, book });
  };

  // Determine what to show:
  // - If there's a search query, show filtered search results
  // - If no query, show initial top 20 books (filtered by department if selected)
  const getDisplayBooks = () => {
    let results = hasQuery ? searchResults : initialBooks;

    // Apply department filter
    if (activeDept !== 'all_dept') {
      results = results.filter(b => b.department === activeDept);
    }

    return results;
  };

  const displayBooks = getDisplayBooks();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[Typography.h2, { color: colors.text, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }]}>
          Search Books
        </Text>
        <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md }}>
          <SearchBar
            value={query}
            onChangeText={handleSearch}
            placeholder="Search by title, author, genre..."
          />
        </View>
        <FilterPanel
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          activeDept={activeDept}
          onDeptChange={handleDeptChange}
        />
      </View>

      {/* Results */}
      <FlatList
        data={displayBooks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <BookCard book={item} onPress={() => navigateToBook(item)} horizontal />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: Spacing.xxxl }}
        ListHeaderComponent={
          !hasQuery && displayBooks.length > 0 ? (
            <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
              <Text style={[Typography.bodySmBold, { color: colors.textMuted }]}>
                {activeDept !== 'all_dept' ? 'Top Books in Department' : 'Top Books'}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.lg }]}>
                Loading books...
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.lg }]}>
                No books found
              </Text>
              <Text style={[Typography.bodySm, { color: colors.textMuted, marginTop: Spacing.sm }]}>
                Try different keywords or filters
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});

export default SearchScreen;
