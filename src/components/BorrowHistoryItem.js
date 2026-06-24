import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const BorrowHistoryItem = ({ record }) => {
  const { colors } = useTheme();
  const book = record.book;

  const getStatusStyle = () => {
    const status = record.status?.toUpperCase?.() || '';
    switch (status) {
      case 'BORROWED':
        return { bg: colors.successLight, color: colors.success, label: 'Active' };
      case 'OVERDUE':
        return { bg: colors.errorLight, color: colors.error, label: 'Overdue' };
      case 'RETURNED':
        return { bg: colors.infoLight, color: colors.info, label: 'Returned' };
      case 'PENDING':
        return { bg: colors.warningLight, color: colors.warning, label: 'Pending' };
      case 'REJECTED':
        return { bg: colors.errorLight, color: colors.error, label: 'Rejected' };
      default:
        return { bg: colors.surface, color: colors.textMuted, label: record.status };
    }
  };

  const status = getStatusStyle();

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.bodySmBold, { color: colors.text }]} numberOfLines={1}>
            {book?.title || 'Unknown Book'}
          </Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {book?.author || 'Unknown Author'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[Typography.captionBold, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={[Typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
            Borrowed: {formatDate(record.borrowDate)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={[Typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
            Due: {formatDate(record.dueDate)}
          </Text>
        </View>
        {record.returnDate && (
          <View style={styles.detailItem}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
            <Text style={[Typography.caption, { color: colors.success, marginLeft: 4 }]}>
              Returned: {formatDate(record.returnDate)}
            </Text>
          </View>
        )}
      </View>

      {record.fine > 0 && (
        <View style={[styles.fineRow, { backgroundColor: colors.warningLight }]}>
          <Ionicons name="alert-circle" size={14} color={colors.warning} />
          <Text style={[Typography.captionBold, { color: colors.warning, marginLeft: 4 }]}>
            Fine: ₹{record.fine}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
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
  details: {
    marginTop: Spacing.md,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});

export default BorrowHistoryItem;
