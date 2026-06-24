import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BooksContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';
import { getStudentAdvanceBookings } from '../services/bookService';

const BookDetailsScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { requestIssue, advanceReserve } = useBooks();
  const { book: passedBook } = route.params;
  const [book] = useState(passedBook);
  const [issueLoading, setIssueLoading] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [existingBooking, setExistingBooking] = useState(null);
  const [checkingBooking, setCheckingBooking] = useState(true);

  // Check if user already has an advance booking for this book
  useEffect(() => {
    const checkExisting = async () => {
      if (!user?.id) { setCheckingBooking(false); return; }
      try {
        const bookings = await getStudentAdvanceBookings(user.id);
        const found = bookings.find(b => b.bookId === book.id);
        setExistingBooking(found || null);
      } catch (e) { /* ignore */ }
      setCheckingBooking(false);
    };
    checkExisting();
  }, [user?.id, book.id]);

  const handleIssueRequest = async () => {
    setIssueLoading(true);
    try {
      const result = await requestIssue(user.id, book.id);
      Alert.alert('Success', result.message || 'Borrow request submitted successfully!');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIssueLoading(false);
    }
  };

  const handleAdvanceBooking = async () => {
    setReserveLoading(true);
    try {
      const result = await advanceReserve(user.id, book.id);
      Alert.alert('Success', result.message);
      setExistingBooking({ ...result, status: 'WAITING' });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setReserveLoading(false);
    }
  };

  const isAvailable = book.availableCopies > 0;
  const coverUri = book.frontImage || book.coverUrl || null;

  // Build tag chips from actual book data
  const tagChips = [];
  if (book.genre) tagChips.push(book.genre);
  if (book.innerGenre) tagChips.push(book.innerGenre);
  if (book.department) tagChips.push(book.department);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Section */}
        <View style={[styles.coverSection, { backgroundColor: colors.headerGradientStart }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>Book Details</Text>
          <View style={styles.coverShadow}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverImage, { backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="book-outline" size={60} color="rgba(255,255,255,0.5)" />
              </View>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
          {/* Title & Author */}
          <Text style={[Typography.h2, { color: colors.text, textAlign: 'center', marginBottom: Spacing.xs }]}>
            {book.title}
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg }]}>
            by {book.author}
          </Text>

          {/* Tag Chips */}
          {tagChips.length > 0 && (
            <View style={styles.chipRow}>
              {tagChips.map((tag) => (
                <View key={tag} style={[styles.chip, { backgroundColor: colors.chipBg }]}>
                  <Text style={[Typography.chipLabel, { color: colors.chipText }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Stats Row */}
          <Text style={[Typography.h3, { color: colors.text, marginBottom: Spacing.md }]}>Book Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star-outline" size={20} color={colors.primary} />
              <Text style={[Typography.statValue, { color: colors.text, marginLeft: Spacing.xs }]}>{book.rating || '4.8'}/5</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
              <Text style={[Typography.statValue, { color: colors.text, marginLeft: Spacing.xs }]}>{book.pages || '420'} Pages</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="globe-outline" size={20} color={colors.primary} />
              <Text style={[Typography.statValue, { color: colors.text, marginLeft: Spacing.xs }]}>{book.language || 'English'}</Text>
            </View>
          </View>

          {/* Availability Badge */}
          <View style={[styles.statusBadge, {
            borderColor: isAvailable ? colors.success : colors.error,
            backgroundColor: isAvailable ? colors.successLight : colors.errorLight,
          }]}>
            <Text style={[Typography.bodySmBold, { color: isAvailable ? colors.success : colors.error, marginRight: Spacing.xs }]}>
              {isAvailable ? `Available (${book.availableCopies}/${book.totalCopies})` : 'Unavailable'}
            </Text>
            <Ionicons 
              name={isAvailable ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={isAvailable ? colors.success : colors.error} 
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* About Section */}
          <Text style={[Typography.h3, { color: colors.text, marginBottom: Spacing.sm }]}>About the Book</Text>
          <Text style={[Typography.body, { color: colors.text, lineHeight: 24 }]}>
            {book.description || 'No description available for this book.'}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.divider, marginVertical: Spacing.xl }]} />

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isAvailable ? (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={handleIssueRequest}
                disabled={user?.isBlacklisted || issueLoading}
              >
                <Text style={[Typography.button, { color: '#fff' }]}>
                  {issueLoading ? 'Requesting...' : 'Request Borrow'}
                </Text>
              </TouchableOpacity>
            ) : checkingBooking ? (
              <View style={[styles.actionBtn, { backgroundColor: colors.surface, justifyContent: 'center' }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : existingBooking ? (
              <View style={[styles.actionBtn, { backgroundColor: colors.warningLight, borderColor: colors.warning, borderWidth: 1 }]}>
                <Ionicons name="bookmark" size={18} color={colors.warning} style={{ marginRight: 6 }} />
                <Text style={[Typography.button, { color: colors.warning }]}>
                  {existingBooking.status === 'READY' ? '🔔 Ready to Collect!' : `Queue Position: #${existingBooking.position}`}
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: colors.primary }]}
                onPress={handleAdvanceBooking}
                disabled={user?.isBlacklisted || reserveLoading}
              >
                <Ionicons name="bookmark-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[Typography.button, { color: colors.primary }]}>
                  {reserveLoading ? 'Booking...' : 'Advance Booking'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Advance booking info note */}
          {!isAvailable && !existingBooking && !checkingBooking && (
            <View style={[styles.infoNote, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[Typography.caption, { color: colors.primary, marginLeft: 6, flex: 1 }]}>
                This book is currently unavailable. Place an advance booking to join the queue. You'll be notified when it's available and have 24 hours to collect it.
              </Text>
            </View>
          )}

          {existingBooking?.status === 'READY' && (
            <View style={[styles.infoNote, { backgroundColor: colors.successLight }]}>
              <Ionicons name="alert-circle" size={16} color={colors.success} />
              <Text style={[Typography.caption, { color: colors.success, marginLeft: 6, flex: 1 }]}>
                Your advance-booked book is ready! Visit the library to collect it within 24 hours or your booking will expire.
              </Text>
            </View>
          )}

          {user?.isBlacklisted && (
            <View style={[styles.blacklistWarning, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="warning" size={16} color={colors.error} />
              <Text style={[Typography.caption, { color: colors.error, marginLeft: 6, flex: 1 }]}>
                Your account is blacklisted. Please return overdue books.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverSection: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: Spacing.xxl,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xl,
  },
  coverShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: -80,
  },
  coverImage: {
    width: 170,
    height: 250,
    borderRadius: BorderRadius.md,
  },
  infoSection: {
    padding: Spacing.xxl,
    paddingTop: 100,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    marginTop: -20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  actions: {
    gap: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  blacklistWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
});

export default BookDetailsScreen;
