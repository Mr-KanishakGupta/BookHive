import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BooksContext';
import ExtendBorrowButton from '../components/ExtendBorrowButton';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const MyBooksScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { activeBorrows, fines, loadActiveBorrows, loadFines, extendBorrow, isLoading } = useBooks();
  const [extendingId, setExtendingId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadActiveBorrows(user.id);
      loadFines(user.id);
    }
  }, [user]);

  const onRefresh = useCallback(() => {
    if (user?.id) {
      loadActiveBorrows(user.id);
      loadFines(user.id);
    }
  }, [user]);

  const handleExtend = async (record) => {
    setExtendingId(record.id);
    try {
      const result = await extendBorrow(record.id);
      Alert.alert('Success', result.message);
      loadActiveBorrows(user.id);
    } catch (e) {
      Alert.alert('Cannot Extend', e.message);
    } finally {
      setExtendingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getDaysUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const renderBorrowItem = ({ item }) => {
    const daysLeft = getDaysUntilDue(item.dueDate);
    const isOverdue = daysLeft < 0;
    const isDueSoon = daysLeft <= 2 && daysLeft >= 0;

    return (
      <View style={[styles.card, {
        backgroundColor: colors.card,
        borderColor: isOverdue ? colors.error : isDueSoon ? colors.warning : colors.cardBorder,
        borderLeftWidth: 3,
        borderLeftColor: isOverdue ? colors.error : isDueSoon ? colors.warning : colors.primary,
      }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.bodySmBold, { color: colors.text }]} numberOfLines={1}>
              {item.book?.title || 'Unknown'}
            </Text>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {item.book?.author}
            </Text>
          </View>
          {isOverdue && (
            <View style={[styles.badge, { backgroundColor: colors.errorLight }]}>
              <Text style={[Typography.captionBold, { color: colors.error }]}>OVERDUE</Text>
            </View>
          )}
          {isDueSoon && !isOverdue && (
            <View style={[styles.badge, { backgroundColor: colors.warningLight }]}>
              <Text style={[Typography.captionBold, { color: colors.warning }]}>DUE SOON</Text>
            </View>
          )}
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={[Typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
              Borrowed: {formatDate(item.borrowDate)}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="time-outline" size={14} color={isOverdue ? colors.error : colors.textMuted} />
            <Text style={[Typography.caption, {
              color: isOverdue ? colors.error : isDueSoon ? colors.warning : colors.textSecondary,
              marginLeft: 4,
              fontWeight: isOverdue || isDueSoon ? '600' : '400',
            }]}>
              Due: {formatDate(item.dueDate)} {daysLeft >= 0 ? `(${daysLeft}d)` : `(${Math.abs(daysLeft)}d late)`}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {item.fine > 0 && (
            <View style={[styles.fineChip, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="alert-circle" size={12} color={colors.warning} />
              <Text style={[Typography.captionBold, { color: colors.warning, marginLeft: 4 }]}>
                Fine: ₹{item.fine}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <ExtendBorrowButton
            onPress={() => handleExtend(item)}
            loading={extendingId === item.id}
            disabled={isOverdue}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[Typography.h2, { color: colors.text }]}>My Books</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('BorrowHistory')}
          style={[styles.historyButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={[Typography.captionBold, { color: colors.primary, marginLeft: 4 }]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Fine Summary */}
      {fines.totalFine > 0 && (
        <View style={[styles.fineSummary, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
          <Ionicons name="cash-outline" size={20} color={colors.warning} />
          <View style={{ marginLeft: Spacing.md, flex: 1 }}>
            <Text style={[Typography.bodySmBold, { color: colors.warning }]}>Pending Fines</Text>
            <Text style={[Typography.caption, { color: colors.warning }]}>
              Total: ₹{fines.totalFine}
            </Text>
          </View>
        </View>
      )}

      {/* Books List */}
      <FlatList
        data={activeBorrows}
        keyExtractor={(item) => item.id}
        renderItem={renderBorrowItem}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={colors.textMuted} />
            <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.lg }]}>
              No borrowed books
            </Text>
            <Text style={[Typography.bodySm, { color: colors.textMuted, marginTop: Spacing.sm }]}>
              Visit Search to find and borrow books
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  fineSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    marginLeft: Spacing.sm,
  },
  dateRow: {
    marginTop: Spacing.md,
    gap: 6,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  fineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});

export default MyBooksScreen;
