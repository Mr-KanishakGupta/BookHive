import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const EditProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    if (!email.trim() || !email.includes('@')) { Alert.alert('Error', 'Please enter a valid email'); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (updateUser) {
        updateUser({ ...user, name: name.trim(), email: email.trim() });
      }
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[Typography.h3, { color: colors.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Avatar */}
        <View style={[styles.avatarSection, { backgroundColor: colors.primary }]}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {name ? name.split(' ').map(n => n[0]).join('') : 'S'}
            </Text>
          </View>
          <Text style={styles.avatarName}>{name || 'Student'}</Text>
        </View>

        {/* Editable Fields */}
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[Typography.bodySmBold, { color: colors.textMuted, marginBottom: Spacing.lg }]}>
            EDITABLE INFORMATION
          </Text>

          <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6 }]}>Full Name</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="person-outline" size={20} color={colors.textMuted} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
              style={[Typography.body, styles.input, { color: colors.text }]}
            />
          </View>

          <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6, marginTop: Spacing.lg }]}>Email Address</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.textMuted}
              style={[Typography.body, styles.input, { color: colors.text }]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Non-editable Fields */}
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[Typography.bodySmBold, { color: colors.textMuted, marginBottom: Spacing.lg }]}>
            NON-EDITABLE INFORMATION
          </Text>

          {[
            { icon: 'school-outline', label: 'USN', value: user?.usn },
            { icon: 'card-outline', label: 'Library Card', value: user?.libraryCardNumber },
          ].map((item) => (
            <View key={item.label} style={styles.readOnlyRow}>
              <Ionicons name={item.icon} size={20} color={colors.textMuted} />
              <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                <Text style={[Typography.caption, { color: colors.textMuted }]}>{item.label}</Text>
                <Text style={[Typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>{item.value || '—'}</Text>
              </View>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={[Typography.button, { color: '#fff', marginLeft: 8 }]}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: Spacing.xxxl },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  backBtn: { padding: 4 },
  avatarSection: {
    marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.xxl,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700' },
  avatarName: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: Spacing.md },
  formCard: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, padding: Spacing.lg,
    borderRadius: BorderRadius.md, borderWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  input: { flex: 1, marginLeft: Spacing.sm, paddingVertical: 0 },
  readOnlyRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: Spacing.lg, paddingVertical: Spacing.lg, borderRadius: BorderRadius.md,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
});

export default EditProfileScreen;
