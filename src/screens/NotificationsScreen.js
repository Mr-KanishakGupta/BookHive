import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationCard from '../components/NotificationCard';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const NotificationsScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead, isLoading } = useNotifications();

  useEffect(() => {
    if (user?.id) loadNotifications(user.id);
  }, [user]);

  const onRefresh = useCallback(() => {
    if (user?.id) loadNotifications(user.id);
  }, [user]);

  const handleMarkRead = (notifId) => {
    markAsRead(notifId, user?.id);
  };

  const handleMarkAllRead = () => {
    if (user?.id) markAllAsRead(user.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[Typography.h2, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={[Typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}
            style={[styles.markAllBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="checkmark-done" size={16} color={colors.primary} />
            <Text style={[Typography.captionBold, { color: colors.primary, marginLeft: 4 }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => handleMarkRead(item.id)}
          />
        )}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.lg }]}>
              No notifications yet
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
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});

export default NotificationsScreen;
