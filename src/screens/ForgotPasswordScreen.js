import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const ForgotPasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your email or library card number');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
    }, 1500);
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
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="key-outline" size={36} color={colors.primary} />
          </View>
          <Text style={[Typography.h1, { color: colors.text, marginTop: Spacing.lg }]}>Forgot Password</Text>
          <Text style={[Typography.bodySm, { color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }]}>
            Enter your email address or library card number and we'll send you a password reset link.
          </Text>
        </View>

        {sent ? (
          <View style={[styles.successCard, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={[Typography.h3, { color: colors.success, marginTop: Spacing.lg }]}>Reset Link Sent!</Text>
            <Text style={[Typography.bodySm, { color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }]}>
              We've sent a password reset link to your registered email. Please check your inbox.
            </Text>
            <TouchableOpacity
              style={[styles.backToLogin, { backgroundColor: colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[Typography.button, { color: '#fff' }]}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6 }]}>
                Email or Library Card Number
              </Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="e.g., email@bmsce.ac.in or BMSCE2024001"
                  placeholderTextColor={colors.textMuted}
                  style={[Typography.body, styles.input, { color: colors.text }]}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleReset}
              disabled={isLoading}
              style={[styles.resetButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[Typography.button, { color: '#fff' }]}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: 60 },
  backBtn: { padding: 4, alignSelf: 'flex-start', marginBottom: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xxxl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  form: { gap: Spacing.lg },
  inputGroup: {},
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  input: { flex: 1, marginLeft: Spacing.sm, paddingVertical: 0 },
  resetButton: {
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center',
    marginTop: Spacing.sm, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  successCard: {
    alignItems: 'center', padding: Spacing.xxl, borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  backToLogin: {
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl, borderRadius: BorderRadius.md,
    marginTop: Spacing.xxl,
  },
});

export default ForgotPasswordScreen;
