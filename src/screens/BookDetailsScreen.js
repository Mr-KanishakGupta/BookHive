import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BooksContext';
import IssueRequestButton from '../components/IssueRequestButton';
import AdvanceBookingButton from '../components/AdvanceBookingButton';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const BookDetailsScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { requestIssue, advanceReserve } = useBooks();
  const { book: passedBook } = route.params;
  const [book, setBook] = useState(passedBook);
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
        <View style={[styles.coverSection, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: book.coverUrl }} style={styles.coverImage} />
        </View>

        {/* Book Info */}
        <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
          <Text style={[Typography.h2, { color: colors.text, textAlign: 'center' }]}>{book.title}</Text>
          <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
            by {book.author}
          </Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, {
            backgroundColor: isAvailable ? colors.successLight : colors.errorLight,
            alignSelf: 'center',
            marginTop: Spacing.lg,
          }]}>
            <View style={[styles.statusDot, {
              backgroundColor: isAvailable ? colors.success : colors.error,
            }]} />
            <Text style={[Typography.bodySmBold, {
              color: isAvailable ? colors.success : colors.error,
            }]}>
              {isAvailable ? `${book.availableCopies} of ${book.totalCopies} Available` : 'Not Available'}
            </Text>
          </View>

          {/* Details Grid */}
          <View style={[styles.detailsGrid, { marginTop: Spacing.xxl }]}>
            {[
              { icon: 'bookmark-outline', label: 'Genre', value: book.genre },
              { icon: 'calendar-outline', label: 'Year', value: String(book.year) },
              { icon: 'barcode-outline', label: 'Book Code', value: book.bookCode },
              { icon: 'pricetag-outline', label: 'Cost', value: `₹${book.cost}` },
              { icon: 'copy-outline', label: 'Total Copies', value: String(book.totalCopies) },
              { icon: 'document-text-outline', label: 'ISBN', value: book.isbn },
            ].map((detail, index) => (
              <View
                key={detail.label}
                style={[styles.detailItem, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
              >
                <Ionicons name={detail.icon} size={18} color={colors.primary} />
                <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 4 }]}>{detail.label}</Text>
                <Text style={[Typography.bodySmBold, { color: colors.text, marginTop: 2 }]} numberOfLines={1}>
                  {detail.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={[styles.descriptionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[Typography.h4, { color: colors.text, marginBottom: Spacing.sm }]}>Description</Text>
            <Text style={[Typography.bodySm, { color: colors.textSecondary, lineHeight: 22 }]}>
              {book.description}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isAvailable ? (
              <IssueRequestButton
                onPress={handleIssueRequest}
                loading={issueLoading}
                disabled={user?.isBlacklisted}
              />
            ) : (
              <AdvanceBookingButton
                onPress={handleAdvanceBooking}
                loading={reserveLoading}
                disabled={user?.isBlacklisted}
                alreadyReserved={isAlreadyReserved}
              />
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
    paddingTop: 60,
    paddingBottom: Spacing.xxxl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: 160,
    height: 230,
    borderRadius: BorderRadius.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  infoSection: {
    padding: Spacing.xxl,
    marginTop: -Spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  detailItem: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  descriptionCard: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  actions: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  blacklistWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});

export default BookDetailsScreen;
