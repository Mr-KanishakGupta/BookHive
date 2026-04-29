import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const ICON_MAP = {
  'check-circle': 'checkmark-circle',
  'clock': 'time',
  'alert-circle': 'alert-circle',
  'alert-triangle': 'warning',
  'book-open': 'book',
};

const NotificationCard = ({ notification, onPress }) => {
  const { colors } = useTheme();
  const iconName = ICON_MAP[notification.icon] || 'notifications';

  const getIconColor = () => {
    switch (notification.type) {
      case 'issue_approved': return colors.success;
      case 'reservation_available': return colors.info;
      case 'fine_update': return colors.warning;
      case 'return_reminder': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getIconBg = () => {
    switch (notification.type) {
      case 'issue_approved': return colors.successLight;
      case 'reservation_available': return colors.infoLight;
      case 'fine_update': return colors.warningLight;
      case 'return_reminder': return colors.accentLight;
      default: return colors.surface;
    }
  };

  const formatTime = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60));
    if (diff < 1) return 'Just now';
    if (diff < 24) return `${diff}h ago`;
    const days = Math.floor(diff / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: notification.read ? colors.card : colors.accentLight,
          borderColor: notification.read ? colors.cardBorder : colors.primary,
          borderLeftWidth: notification.read ? 1 : 3,
        }
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: getIconBg() }]}>
        <Ionicons name={iconName} size={20} color={getIconColor()} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[Typography.bodySmBold, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={[Typography.caption, { color: colors.textMuted }]}>
            {formatTime(notification.timestamp)}
          </Text>
        </View>
        <Text style={[Typography.bodySm, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={3}>
          {notification.message}
        </Text>
      </View>
      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
    marginTop: 6,
  },
});

export default NotificationCard;
