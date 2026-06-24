import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { login, isLoading, clearError } = useAuth();
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'card'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      clearError();
      await login(identifier.trim(), password);
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="library" size={36} color={colors.primary} />
          </View>
          <Text style={[Typography.h1, { color: colors.text, marginTop: Spacing.lg }]}>Welcome Back</Text>
          <Text style={[Typography.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
            Sign in to your BookHive account
          </Text>
        </View>

        {/* Login Mode Toggle */}
        <View style={[styles.modeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => { setLoginMode('email'); setIdentifier(''); }}
            style={[
              styles.modeButton,
              loginMode === 'email' && { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={16}
              color={loginMode === 'email' ? '#fff' : colors.textSecondary}
            />
            <Text style={[
              Typography.bodySmBold,
              { color: loginMode === 'email' ? '#fff' : colors.textSecondary, marginLeft: 6 },
            ]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setLoginMode('card'); setIdentifier(''); }}
            style={[
              styles.modeButton,
              loginMode === 'card' && { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons
              name="card-outline"
              size={16}
              color={loginMode === 'card' ? '#fff' : colors.textSecondary}
            />
            <Text style={[
              Typography.bodySmBold,
              { color: loginMode === 'card' ? '#fff' : colors.textSecondary, marginLeft: 6 },
            ]}>Library Card</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6 }]}>
              {loginMode === 'email' ? 'Email Address' : 'Library Card Number'}
            </Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons
                name={loginMode === 'email' ? 'mail-outline' : 'card-outline'}
                size={20}
                color={colors.textMuted}
              />
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={loginMode === 'email' ? 'Enter your email' : 'Enter library card number'}
                placeholderTextColor={colors.textMuted}
                style={[Typography.body, styles.input, { color: colors.text }]}
                keyboardType={loginMode === 'email' ? 'email-address' : 'default'}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6 }]}>Password</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                style={[Typography.body, styles.input, { color: colors.text }]}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
          >
            <Text style={[Typography.bodySm, { color: colors.primary, fontWeight: '600' }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[Typography.button, { color: '#fff' }]}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.footerLink}>
            <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
              New student?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Create Account</Text>
            </Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')} style={styles.adminLink}>
            <Ionicons name="shield-outline" size={16} color={colors.textMuted} />
            <Text style={[Typography.bodySm, { color: colors.textMuted, marginLeft: 6 }]}>
              Admin Login
            </Text>
          </TouchableOpacity>
        </View>


      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 80,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: Spacing.xxl,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  form: {
    gap: Spacing.lg,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
  },
  inputGroup: {},
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    paddingVertical: 0,
  },
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
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
  },
  footerLink: {
    paddingVertical: Spacing.sm,
  },
  divider: {
    width: 60,
    height: 1,
    marginVertical: Spacing.lg,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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

export default LoginScreen;
