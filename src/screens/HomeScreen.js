import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, StatusBar, TextInput, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BooksContext';
import BookCard from '../components/BookCard';
import ActiveBorrowCard from '../components/ActiveBorrowCard';
import AnnouncementCard from '../components/AnnouncementCard';
import { Typography, BorderRadius, Spacing } from '../theme/typography';
import { ANNOUNCEMENTS, CURATED_BOOKS } from '../services/mockData';

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { recommended, recentlyAdded, popular, loadHomeData, isLoading } = useBooks();

  useEffect(() => {
    loadHomeData();
  }, []);

  const onRefresh = useCallback(() => {
    loadHomeData();
  }, []);

  const navigateToBook = (book) => {
    navigation.navigate('BookDetails', { bookId: book.id, book });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  // We are assuming the first borrowed book is the 'Active Borrow' to show on home screen
  // If the user has borrowed books, we find the book details
  const activeBorrowDetails = user?.borrowedBooks?.length > 0 
    ? [...recommended, ...recentlyAdded, ...popular, ...CURATED_BOOKS].find(b => b.id === user.borrowedBooks[0])
    : null;

  const renderSection = (title, data, icon, isCurated = false) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[Typography.h3, { color: colors.text }]}>{title}</Text>
      </View>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookCard book={item} onPress={() => navigateToBook(item)} isCurated={isCurated} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.sectionBg }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with Gradient/Background */}
        <View style={[styles.headerSection, { backgroundColor: colors.headerGradientStart }]}>
          <View style={styles.headerContent}>
            <Text style={[Typography.h1Large, { color: '#fff' }]}>{getGreeting()}</Text>
            <Text style={[Typography.h1Large, { color: '#fff' }]}>{user?.name || 'Student'}</Text>
            
            {/* Quick Search */}
            <TouchableOpacity 
              style={[styles.searchContainer, { backgroundColor: colors.searchBarBg }]}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.9}
            >
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
              <Text style={[Typography.body, { color: colors.textSecondary, marginLeft: Spacing.sm }]}>
                Quick Search...
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Active Borrow overlaying the header slightly */}
          <View style={styles.activeBorrowWrapper}>
            {activeBorrowDetails ? (
              <ActiveBorrowCard 
                book={activeBorrowDetails} 
                dueDate="Oct 24, 2024" 
                daysRemaining={4} 
                onRenew={() => alert('Renew requested')}
              />
            ) : null}
          </View>
        </View>

        {/* Padding adjustment based on whether we have an active borrow */}
        <View style={{ height: activeBorrowDetails ? Spacing.xl : Spacing.xxl }} />

        {/* Curated Section */}
        {renderSection('Curated for Your Major', CURATED_BOOKS, '', true)}

        {/* Announcements Section */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
          <Text style={[Typography.h3, { color: colors.text, marginBottom: Spacing.md }]}>Library Announcements</Text>
          {ANNOUNCEMENTS.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </View>

        {/* Standard Sections */}
        {renderSection('Recently Added', recentlyAdded, '')}
        {renderSection('Popular Books', popular, '')}

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
    paddingBottom: 40,
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
    marginBottom: Spacing.md,
  },
  activeBorrowWrapper: {
    marginBottom: -80, // Negative margin to overlap the section below
    zIndex: 10,
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
});

export default HomeScreen;
