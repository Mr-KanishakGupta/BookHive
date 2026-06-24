import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Switch, Alert,
} from 'react-native';
import {
  ChevronLeft, Moon, Sun, Bell, Shield, Info,
  Database, Palette, Globe,
} from 'lucide-react-native';
import { AdminColors, AdminColorsDark } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { BORROW_DURATION_DAYS, MAX_EXTENSIONS, FINE_PER_DAY_INITIAL } from '../../utils/constants';

const AdminSettingsScreen = ({ navigation }) => {
  const { isDark, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const C = isDark ? AdminColorsDark : AdminColors;

  const SettingRow = ({ icon: Icon, iconColor, title, subtitle, right }) => (
    <View style={[s.settingRow]}>
      <View style={[s.settingIcon, { backgroundColor: (iconColor || C.navy) + '18' }]}>
        <Icon size={20} color={iconColor || C.navy} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[s.settingTitle, { color: C.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[s.settingSub, { color: C.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: C.bgGrey }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bgGrey} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: C.white }]}>
          <ChevronLeft size={24} color={C.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.headerTitle, { color: C.textPrimary }]}>Settings</Text>
          <Text style={[s.headerSub, { color: C.textSecondary }]}>Manage admin preferences</Text>
        </View>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ─── Appearance ────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: C.navy }]}>Appearance</Text>
        <View style={[s.card, { backgroundColor: C.white }]}>
          <SettingRow
            icon={isDark ? Moon : Sun}
            iconColor={isDark ? '#7C3AED' : '#F59E0B'}
            title="Dark Mode"
            subtitle={isDark ? 'Dark theme is active' : 'Light theme is active'}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#D1D5DB', true: C.navy }}
                thumbColor={isDark ? '#fff' : '#fff'}
              />
            }
          />
        </View>

        {/* ─── Notifications ────────────────────────── */}
        <Text style={[s.sectionTitle, { color: C.navy }]}>Notifications</Text>
        <View style={[s.card, { backgroundColor: C.white }]}>
          <SettingRow
            icon={Bell}
            iconColor="#3B82F6"
            title="Push Notifications"
            subtitle="Receive alerts for new requests"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: C.navy }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* ─── Library Policies (Read-only info) ──── */}
        <Text style={[s.sectionTitle, { color: C.navy }]}>Library Policies</Text>
        <View style={[s.card, { backgroundColor: C.white }]}>
          <SettingRow
            icon={Database}
            iconColor="#10B981"
            title="Borrow Duration"
            subtitle={`${BORROW_DURATION_DAYS} days per borrow`}
          />
          <View style={[s.divider, { backgroundColor: C.border }]} />
          <SettingRow
            icon={Shield}
            iconColor="#EF4444"
            title="Max Extensions"
            subtitle={`${MAX_EXTENSIONS} extensions allowed per borrow`}
          />
          <View style={[s.divider, { backgroundColor: C.border }]} />
          <SettingRow
            icon={Info}
            iconColor="#F59E0B"
            title="Fine Rate"
            subtitle={`₹${FINE_PER_DAY_INITIAL} per day for the first 5 days`}
          />
        </View>

        {/* ─── About ──────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: C.navy }]}>About</Text>
        <View style={[s.card, { backgroundColor: C.white }]}>
          <SettingRow
            icon={Globe}
            iconColor="#6366F1"
            title="BookHive"
            subtitle="Version 1.0.0 • BMSU Library Management"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  body: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderRadius: 14, padding: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, marginBottom: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 14 },
});

export default AdminSettingsScreen;
