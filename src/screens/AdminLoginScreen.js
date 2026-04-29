import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const AdminLoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { adminLogin, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      clearError();
      await adminLogin(email.trim(), password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.shieldIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
          </View>
          <Text style={[Typography.h1, { color: colors.text, marginTop: Spacing.lg }]}>Admin Login</Text>
          <Text style={[Typography.bodySm, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
            Restricted to library administrators
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Admin email"
              placeholderTextColor={colors.textMuted}
              style={[Typography.body, styles.input, { color: colors.text }]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              style={[Typography.body, styles.input, { color: colors.text }]}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[Typography.button, { color: '#fff' }]}>Sign In as Admin</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.demoHint, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
          <Ionicons name="information-circle" size={16} color={colors.info} />
          <Text style={[Typography.caption, { color: colors.info, marginLeft: 6, flex: 1 }]}>
            Demo: admin@bmsce.ac.in / admin123
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 60,
  },
  backBtn: { padding: 4, alignSelf: 'flex-start', marginBottom: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xxxl },
  shieldIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: { gap: Spacing.lg },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: { flex: 1, marginLeft: Spacing.sm, paddingVertical: 0 },
  loginButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.xxl,
    alignSelf: 'center',
  },
});

export default AdminLoginScreen;
