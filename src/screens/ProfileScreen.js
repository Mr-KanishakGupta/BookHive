import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const ProfileScreen = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const profileItems = [
    { icon: 'person-outline', label: 'Name', value: user?.name },
    { icon: 'school-outline', label: 'USN', value: user?.usn },
    { icon: 'mail-outline', label: 'Email', value: user?.email },
    { icon: 'card-outline', label: 'Library Card', value: user?.libraryCardNumber },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <Text style={[Typography.h2, { color: colors.text, paddingHorizontal: Spacing.lg }]}>Profile</Text>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'S'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'Student'}</Text>
          <Text style={styles.profileUsn}>{user?.usn || ''}</Text>

          {user?.isBlacklisted && (
            <View style={styles.blacklistBadge}>
              <Ionicons name="warning" size={14} color="#d32f2f" />
              <Text style={styles.blacklistText}>Account Blacklisted</Text>
            </View>
          )}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={[Typography.h3, { color: colors.text, marginTop: Spacing.sm }]}>
              {user?.borrowedBooks?.length || 0}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>Borrowed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="cash" size={24} color={colors.warning} />
            <Text style={[Typography.h3, { color: colors.text, marginTop: Spacing.sm }]}>
              ₹{user?.fines || 0}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>Fines</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="layers" size={24} color={colors.success} />
            <Text style={[Typography.h3, { color: colors.text, marginTop: Spacing.sm }]}>
              {5 - (user?.borrowedBooks?.length || 0)}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>Available Slots</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[Typography.bodySmBold, { color: colors.textMuted, marginBottom: Spacing.md }]}>
            STUDENT INFORMATION
          </Text>
          {profileItems.map((item, index) => (
            <View key={item.label}>
              <View style={styles.infoRow}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                  <Text style={[Typography.caption, { color: colors.textMuted }]}>{item.label}</Text>
                  <Text style={[Typography.bodySm, { color: colors.text, marginTop: 2 }]}>{item.value || '—'}</Text>
                </View>
              </View>
              {index < profileItems.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              )}
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[Typography.bodySmBold, { color: colors.textMuted, marginBottom: Spacing.md }]}>
            SETTINGS
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} />
              <Text style={[Typography.bodySm, { color: colors.text, marginLeft: Spacing.md }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDark ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[Typography.bodySmBold, { color: colors.textMuted, marginBottom: Spacing.md }]}>
            QUICK ACTIONS
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.actionRow}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={[Typography.bodySm, { color: colors.text, marginLeft: Spacing.md }]}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity
            onPress={() => navigation.navigate('BorrowHistory')}
            style={styles.actionRow}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[Typography.bodySm, { color: colors.text, marginLeft: Spacing.md }]}>Borrow History</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity onPress={() => navigation.navigate('QRCode')} style={styles.actionRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
              <Text style={[Typography.bodySm, { color: colors.text, marginLeft: Spacing.md }]}>QR Scanner</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: colors.errorLight, borderColor: colors.error }]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[Typography.bodySmBold, { color: colors.error, marginLeft: Spacing.sm }]}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },
  profileCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#003366',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: Spacing.md,
  },
  profileUsn: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  blacklistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    marginTop: Spacing.md,
  },
  blacklistText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d32f2f',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});

export default ProfileScreen;
