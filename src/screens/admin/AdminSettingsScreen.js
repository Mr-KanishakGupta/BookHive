import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Switch, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft, Moon, Sun, Bell, Shield, Info,
  Database, Globe, Save, BookOpen, Clock, CreditCard,
} from 'lucide-react-native';
import { AdminColors, AdminColorsDark } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const SETTINGS_DOC = 'library_settings/config';

const AdminSettingsScreen = ({ navigation }) => {
  const { isDark, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const C = isDark ? AdminColorsDark : AdminColors;

  // Editable policy fields
  const [borrowDuration, setBorrowDuration] = useState('7');
  const [maxExtensions, setMaxExtensions] = useState('2');
  const [finePerDay, setFinePerDay] = useState('5');
  const [maxBooks, setMaxBooks] = useState('5');
  const [blacklistThreshold, setBlacklistThreshold] = useState('7');

  // Load settings from Firestore on mount
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const snap = await getDoc(doc(db, 'library_settings', 'config'));
      if (snap.exists()) {
        const d = snap.data();
        if (d.borrowDurationDays != null) setBorrowDuration(String(d.borrowDurationDays));
        if (d.maxExtensions != null) setMaxExtensions(String(d.maxExtensions));
        if (d.finePerDay != null) setFinePerDay(String(d.finePerDay));
        if (d.maxBorrowedBooks != null) setMaxBooks(String(d.maxBorrowedBooks));
        if (d.blacklistThresholdDays != null) setBlacklistThreshold(String(d.blacklistThresholdDays));
        if (d.notificationsEnabled != null) setNotificationsEnabled(d.notificationsEnabled);
      }
    } catch (e) {
      console.warn('Could not load library settings:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const validateAndSave = async () => {
    const borrowVal = parseInt(borrowDuration);
    const extVal = parseInt(maxExtensions);
    const fineVal = parseInt(finePerDay);
    const booksVal = parseInt(maxBooks);
    const threshVal = parseInt(blacklistThreshold);

    if (isNaN(borrowVal) || borrowVal < 1 || borrowVal > 365) {
      return Alert.alert('Validation Error', 'Borrow Duration must be between 1 and 365 days.');
    }
    if (isNaN(extVal) || extVal < 0 || extVal > 10) {
      return Alert.alert('Validation Error', 'Max Extensions must be between 0 and 10.');
    }
    if (isNaN(fineVal) || fineVal < 0 || fineVal > 1000) {
      return Alert.alert('Validation Error', 'Fine Per Day must be between ₹0 and ₹1000.');
    }
    if (isNaN(booksVal) || booksVal < 1 || booksVal > 20) {
      return Alert.alert('Validation Error', 'Max Books must be between 1 and 20.');
    }
    if (isNaN(threshVal) || threshVal < 1 || threshVal > 60) {
      return Alert.alert('Validation Error', 'Blacklist Threshold must be between 1 and 60 days.');
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'library_settings', 'config'), {
        borrowDurationDays: borrowVal,
        maxExtensions: extVal,
        finePerDay: fineVal,
        maxBorrowedBooks: booksVal,
        blacklistThresholdDays: threshVal,
        notificationsEnabled,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      Alert.alert('Settings Saved', 'Library policy settings have been updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings. Please try again.\n' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

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

  const EditableRow = ({ icon: Icon, iconColor, title, subtitle, value, onChangeText, keyboardType = 'numeric', unit = '' }) => (
    <View style={[s.editRow, { borderColor: C.border }]}>
      <View style={[s.settingIcon, { backgroundColor: (iconColor || C.navy) + '18' }]}>
        <Icon size={20} color={iconColor || C.navy} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[s.settingTitle, { color: C.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[s.settingSub, { color: C.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      <View style={[s.inputWrap, { borderColor: C.border, backgroundColor: C.bgGrey }]}>
        <TextInput
          style={[s.inputField, { color: C.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={5}
        />
        {unit ? <Text style={[s.inputUnit, { color: C.textSecondary }]}>{unit}</Text> : null}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: C.bgGrey, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={[s.settingSub, { color: C.textSecondary, marginTop: 12 }]}>Loading settings…</Text>
      </View>
    );
  }

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
          <Text style={[s.headerSub, { color: C.textSecondary }]}>Manage library policies</Text>
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

        {/* ─── Library Policies (Editable) ──────────── */}
        <Text style={[s.sectionTitle, { color: C.navy }]}>Library Policies</Text>
        <View style={[s.card, { backgroundColor: C.white }]}>
          <EditableRow
            icon={Database}
            iconColor="#10B981"
            title="Borrow Duration"
            subtitle="Days allowed per borrow"
            value={borrowDuration}
            onChangeText={setBorrowDuration}
            unit="days"
          />
          <View style={[s.divider, { backgroundColor: C.border }]} />
          <EditableRow
            icon={Shield}
            iconColor="#EF4444"
            title="Max Extensions"
            subtitle="Extensions allowed per borrow"
            value={maxExtensions}
            onChangeText={setMaxExtensions}
            unit="ext"
          />
          <View style={[s.divider, { backgroundColor: C.border }]} />
          <EditableRow
            icon={Info}
            iconColor="#F59E0B"
            title="Fine Per Day"
            subtitle="Daily fine for overdue books"
            value={finePerDay}
            onChangeText={setFinePerDay}
            unit="₹/day"
          />
          <View style={[s.divider, { backgroundColor: C.border }]} />
          <EditableRow
            icon={BookOpen}
            iconColor="#6366F1"
            title="Max Books Allowed"
            subtitle="Maximum books a student can borrow"
            value={maxBooks}
            onChangeText={setMaxBooks}
            unit="books"
          />
          <View style={[s.divider, { backgroundColor: C.border }]} />
          <EditableRow
            icon={Clock}
            iconColor="#DC3545"
            title="Blacklist Threshold"
            subtitle="Days overdue before blacklisting"
            value={blacklistThreshold}
            onChangeText={setBlacklistThreshold}
            unit="days"
          />
        </View>

        {/* ─── Save Button ──────────────────────────── */}
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: C.navy }, isSaving && { opacity: 0.7 }]}
          onPress={validateAndSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text style={s.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

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
  editRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 14 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, minWidth: 80 },
  inputField: { fontSize: 15, fontWeight: '700', textAlign: 'center', minWidth: 36 },
  inputUnit: { fontSize: 11, marginLeft: 4 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 14, marginTop: 24, marginBottom: 8, gap: 8, elevation: 2 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default AdminSettingsScreen;
