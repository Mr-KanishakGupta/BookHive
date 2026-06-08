import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, StatusBar, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BooksContext';
import ExtendBorrowButton from '../components/ExtendBorrowButton';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const TABS = [
  { key: 'active', label: 'Borrowed' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'history', label: 'History' },
];

const FINE_PER_DAY = 10; // ₹10 per day

const MyBooksScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { activeBorrows, borrowHistory, fines, loadActiveBorrows, loadBorrowHistory, loadFines, extendBorrow, isLoading } = useBooks();
  const [extendingId, setExtendingId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (user?.id) {
      loadActiveBorrows(user.id);
      loadBorrowHistory(user.id);
      loadFines(user.id);
    }
  }, [user]);

  const onRefresh = useCallback(() => {
    if (user?.id) {
      loadActiveBorrows(user.id);
      loadBorrowHistory(user.id);
      loadFines(user.id);
    }
  }, [user]);

  const handleExtend = async (record) => {
    setExtendingId(record.id);
    try {
      await extendBorrow(record.id, user.id);
      Alert.alert('Request Sent', 'Extension request submitted. The admin will review it shortly.');
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
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysUntilDue = (dueDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Filter data based on active tab
  const tabData = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return activeBorrows.filter(item => {
          const daysLeft = getDaysUntilDue(item.dueDate);
          return daysLeft >= 0;
        });
      case 'overdue':
        return activeBorrows.filter(item => {
          const daysLeft = getDaysUntilDue(item.dueDate);
          return daysLeft < 0;
        });
      case 'history':
        return borrowHistory.filter(item => item.status === 'returned');
      default:
        return [];
    }
  }, [activeTab, activeBorrows, borrowHistory]);

  // Badge counts
  const activeCount = useMemo(() =>
    activeBorrows.filter(i => getDaysUntilDue(i.dueDate) >= 0).length
  , [activeBorrows]);

  const overdueCount = useMemo(() =>
    activeBorrows.filter(i => getDaysUntilDue(i.dueDate) < 0).length
  , [activeBorrows]);

  const historyCount = useMemo(() =>
    borrowHistory.filter(i => i.status === 'returned').length
  , [borrowHistory]);

  const getTabCount = (key) => {
    switch (key) {
      case 'active': return activeCount;
      case 'overdue': return overdueCount;
      case 'history': return historyCount;
      default: return 0;
    }
  };

  const renderBorrowItem = ({ item }) => {
    const daysLeft = getDaysUntilDue(item.dueDate);
    const isOverdue = daysLeft < 0;
    const isDueSoon = daysLeft <= 2 && daysLeft >= 0;
    const isReturned = item.status === 'returned';
    const overdueDays = Math.abs(daysLeft);

    return (
      <View style={[styles.card, {
        backgroundColor: colors.card,
        borderColor: isOverdue ? colors.error : isDueSoon ? colors.warning : colors.cardBorder,
        borderLeftWidth: 3,
        borderLeftColor: isReturned
          ? colors.success
          : isOverdue ? colors.error : isDueSoon ? colors.warning : colors.primary,
      }]}>
        {/* Card Header — Title + Status Badge */}
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
          {isDueSoon && !isOverdue && !isReturned && (
            <View style={[styles.badge, { backgroundColor: colors.warningLight }]}>
              <Text style={[Typography.captionBold, { color: colors.warning }]}>DUE SOON</Text>
            </View>
          )}
          {isReturned && (
            <View style={[styles.badge, { backgroundColor: colors.successLight }]}>
              <Text style={[Typography.captionBold, { color: colors.success }]}>RETURNED</Text>
            </View>
          )}
        </View>

        {/* Borrowing Information Section */}
        <View style={[styles.borrowInfoSection, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
          <View style={styles.borrowInfoRow}>
            <View style={styles.borrowInfoItem}>
              <View style={styles.infoIconRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                <Text style={[Typography.caption, { color: colors.textMuted, marginLeft: 4 }]}>
                  Borrowed
                </Text>
              </View>
              <Text style={[Typography.captionBold, { color: colors.text, marginTop: 2 }]}>
                {formatDate(item.borrowDate)}
              </Text>
            </View>
            <View style={[styles.borrowInfoDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.borrowInfoItem}>
              <View style={styles.infoIconRow}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={isOverdue ? colors.error : isDueSoon ? colors.warning : colors.primary}
                />
                <Text style={[Typography.caption, { color: colors.textMuted, marginLeft: 4 }]}>
                  Due Date
                </Text>
              </View>
              <Text style={[Typography.captionBold, {
                color: isOverdue ? colors.error : isDueSoon ? colors.warning : colors.text,
                marginTop: 2,
              }]}>
                {formatDate(item.dueDate)}
              </Text>
            </View>
          </View>

          {/* Days remaining / overdue + Fine per day */}
          <View style={[styles.daysRow, { borderTopColor: colors.cardBorder }]}>
            <View style={styles.daysInfo}>
              <Ionicons
                name={isReturned ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'hourglass-outline'}
                size={14}
                color={isReturned ? colors.success : isOverdue ? colors.error : colors.primary}
              />
              <Text style={[Typography.captionBold, {
                color: isReturned ? colors.success : isOverdue ? colors.error : isDueSoon ? colors.warning : colors.text,
                marginLeft: 4,
              }]}>
                {isReturned
                  ? `Returned ${formatDate(item.returnDate)}`
                  : isOverdue
                    ? `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`
                    : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
                }
              </Text>
            </View>
            {!isReturned && (
              <View style={[styles.finePerDay, {
                backgroundColor: isOverdue ? colors.errorLight : colors.primaryLight,
              }]}>
                <Ionicons name="cash-outline" size={11} color={isOverdue ? colors.error : colors.textSecondary} />
                <Text style={[Typography.caption, {
                  color: isOverdue ? colors.error : colors.textSecondary,
                  marginLeft: 3,
                  fontWeight: '600',
                }]}>
                  ₹{FINE_PER_DAY}/day
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Card Footer — Fine + Extend */}
        <View style={styles.cardFooter}>
          {item.fine > 0 && (
            <View style={[styles.fineChip, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="alert-circle" size={12} color={colors.error} />
              <Text style={[Typography.captionBold, { color: colors.error, marginLeft: 4 }]}>
                Fine: ₹{item.fine}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          {!isReturned && activeTab !== 'history' && (
            <ExtendBorrowButton
              onPress={() => handleExtend(item)}
              loading={extendingId === item.id}
              disabled={isOverdue}
            />
          )}
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
          <Text style={[Typography.captionBold, { color: colors.primary, marginLeft: 4 }]}>Full History</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = getTabCount(tab.key);
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
              style={[
                styles.tab,
                isActive && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[
                Typography.captionBold,
                { color: isActive ? '#fff' : colors.textSecondary },
              ]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, {
                  backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : colors.primaryLight,
                }]}>
                  <Text style={[Typography.caption, {
                    color: isActive ? '#fff' : colors.primary,
                    fontWeight: '700',
                    fontSize: 10,
                  }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Fine Summary */}
      {fines.totalFine > 0 && activeTab !== 'history' && (
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
        data={tabData}
        keyExtractor={(item) => item.id}
        renderItem={renderBorrowItem}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={activeTab === 'overdue' ? 'alert-circle-outline' : activeTab === 'history' ? 'time-outline' : 'book-outline'}
              size={48}
              color={colors.textMuted}
            />
            <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.lg }]}>
              {activeTab === 'active' && 'No actively borrowed books'}
              {activeTab === 'overdue' && 'No overdue books — great job!'}
              {activeTab === 'history' && 'No return history yet'}
            </Text>
            <Text style={[Typography.bodySm, { color: colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
              {activeTab === 'active' && 'Visit Search to find and borrow books'}
              {activeTab === 'overdue' && 'All your books are returned on time'}
              {activeTab === 'history' && 'Books you return will appear here'}
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
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
  // Borrowing info section
  borrowInfoSection: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  borrowInfoRow: {
    flexDirection: 'row',
  },
  borrowInfoItem: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  borrowInfoDivider: {
    width: 1,
  },
  infoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  daysInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finePerDay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
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
