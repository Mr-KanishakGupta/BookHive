import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BooksContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const BookDetailsScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { requestIssue, advanceReserve } = useBooks();
  const { book: passedBook } = route.params;
  const [book] = useState(passedBook);
  const [issueLoading, setIssueLoading] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);

  const handleIssueRequest = async () => {
    setIssueLoading(true);
    try {
      const result = await requestIssue(user.id, book.id);
      Alert.alert('Success', result.message);
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
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setReserveLoading(false);
    }
  };

  const isAvailable = book.availableCopies > 0;
  const isAlreadyReserved = !!book.reservedBy;

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
            <Image source={{ uri: book.coverUrl }} style={styles.coverImage} />
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
          {/* Tag Chips */}
          <View style={styles.chipRow}>
            {['Physics', book.innerGenre].map((tag) => (
              <View key={tag} style={[styles.chip, { backgroundColor: colors.chipBg }]}>
                <Text style={[Typography.chipLabel, { color: colors.chipText }]}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: colors.chipBg }]}>
              <Text style={[Typography.chipLabel, { color: colors.chipText }]}>Faculty of Science</Text>
            </View>
          </View>

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
              {isAvailable ? 'Available' : 'Unavailable'}
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
            {book.description}
          </Text>
          
          <TouchableOpacity style={[styles.readMoreButton, { backgroundColor: colors.primary }]}>
            <Text style={[Typography.buttonSm, { color: '#fff' }]}>Read More</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider, marginVertical: Spacing.xl }]} />

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleIssueRequest}
              disabled={user?.isBlacklisted || issueLoading}
            >
              <Text style={[Typography.button, { color: '#fff' }]}>
                {issueLoading ? 'Requesting...' : 'Request Borrow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: colors.primary }]}
              onPress={handleAdvanceBooking}
              disabled={user?.isBlacklisted || reserveLoading || isAlreadyReserved}
            >
              <Text style={[Typography.button, { color: colors.primary }]}>
                {reserveLoading ? 'Booking...' : 'Advance Booking'}
              </Text>
            </TouchableOpacity>
          </View>

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
  readMoreButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    marginTop: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
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
