import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BooksContext';
import BookCard from '../components/BookCard';
import { Typography, BorderRadius, Spacing } from '../theme/typography';
import { MAX_BORROWED_BOOKS } from '../utils/constants';

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { recommended, recentlyAdded, popular, loadHomeData, activeBorrows, loadActiveBorrows, isLoading } = useBooks();

  useEffect(() => {
    loadHomeData();
    if (user?.id) loadActiveBorrows(user.id);
  }, []);

  const onRefresh = useCallback(() => {
    loadHomeData();
    if (user?.id) loadActiveBorrows(user.id);
  }, [user]);

  const navigateToBook = (book) => {
    navigation.navigate('BookDetails', { bookId: book.id, book });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const renderSection = (title, data, icon) => {
    if (!data || data.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {icon ? <Ionicons name={icon} size={20} color={colors.primary} style={{ marginRight: Spacing.sm }} /> : null}
          <Text style={[Typography.h3, { color: colors.text }]}>{title}</Text>
        </View>
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookCard book={item} onPress={() => navigateToBook(item)} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.sectionBg || colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: colors.headerGradientStart }]}>
          <View style={styles.headerContent}>
            <Text style={[Typography.h1Large, { color: '#fff' }]}>{getGreeting()}</Text>
            <Text style={[Typography.h1Large, { color: '#fff' }]}>{user?.name || 'Student'}</Text>
            
            {/* Quick Search */}
            <TouchableOpacity 
              style={[styles.searchContainer, { backgroundColor: colors.searchBarBg || 'rgba(255,255,255,0.15)' }]}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.9}
            >
              <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" />
              <Text style={[Typography.body, { color: 'rgba(255,255,255,0.7)', marginLeft: Spacing.sm }]}>
                Quick Search...
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Ionicons name="book" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.quickStatValue}>{activeBorrows.length}</Text>
              <Text style={styles.quickStatLabel}>Borrowed</Text>
            </View>
            <View style={[styles.quickStatDivider]} />
            <View style={styles.quickStatItem}>
              <Ionicons name="layers" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.quickStatValue}>{MAX_BORROWED_BOOKS - activeBorrows.length}</Text>
              <Text style={styles.quickStatLabel}>Slots Left</Text>
            </View>
            <View style={[styles.quickStatDivider]} />
            <View style={styles.quickStatItem}>
              <Ionicons name="cash" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.quickStatValue}>₹{user?.fines || 0}</Text>
              <Text style={styles.quickStatLabel}>Fines</Text>
            </View>
          </View>
        </View>

        {/* Spacing */}
        <View style={{ height: Spacing.xl }} />

        {/* Book Sections — only renders if data exists */}
        {renderSection('Recommended for You', recommended, 'sparkles')}
        {renderSection('Recently Added', recentlyAdded, 'time-outline')}
        {renderSection('Popular Books', popular, 'trending-up-outline')}

        {/* Empty state if no books at all */}
        {(!recommended || recommended.length === 0) && 
         (!recentlyAdded || recentlyAdded.length === 0) && 
         (!popular || popular.length === 0) && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color={colors.border} />
            <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.lg, textAlign: 'center' }]}>
              No books available yet
            </Text>
            <Text style={[Typography.bodySm, { color: colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
              Pull down to refresh
            </Text>
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 60,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerContent: {
    paddingHorizontal: Spacing.xxl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    marginTop: Spacing.xl,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xxxl,
  },
});

export default HomeScreen;
