import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, StatusBar } from 'react-native';
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
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback((text) => {
    setQuery(text);
    if (text.trim().length > 0) {
      searchBooksAction(text, activeFilter === 'all' ? undefined : activeFilter);
      setHasSearched(true);
    } else {
      setHasSearched(false);
    }
  }, [activeFilter, searchBooksAction]);

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
    if (query.trim().length > 0) {
      searchBooksAction(query, filter === 'all' ? undefined : filter);
    }
  }, [query, searchBooksAction]);

  const navigateToBook = (book) => {
    navigation.navigate('BookDetails', { bookId: book.id, book });
  };

  const displayResults = hasSearched ? searchResults : [];

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
        <FilterPanel activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      </View>

      {/* Results */}
      {hasSearched ? (
        <FlatList
          data={displayResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: Spacing.lg }}>
              <BookCard book={item} onPress={() => navigateToBook(item)} horizontal />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: Spacing.xxxl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.lg }]}>
                No books found
              </Text>
              <Text style={[Typography.bodySm, { color: colors.textMuted, marginTop: Spacing.sm }]}>
                Try different keywords or filters
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.prompt}>
          <Ionicons name="book-outline" size={64} color={colors.border} />
          <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.lg, textAlign: 'center' }]}>
            Search our collection of books
          </Text>
          <Text style={[Typography.bodySm, { color: colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
            Find books by title, author, genre, or book code
          </Text>
        </View>
      )}
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
  prompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
});

export default SearchScreen;
