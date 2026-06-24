import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const API_URL = "https://bookhive-31uu.onrender.com/api";

const ForgotPasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [step, setStep] = useState(1); // 1: enter identifier, 2: enter OTP, 3: new password, 4: success
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [libraryCardId, setLibraryCardId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your email or library card number');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to send OTP');
      
      setLibraryCardId(result.libraryCardId);
      setStep(2);
      Alert.alert('Success', result.message);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libraryCardId,
          otp: otp.trim(),
          newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to reset password');
      
      setStep(4);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = ['Email / Card', 'Verify OTP', 'New Password'];

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
            {step === 1 && 'Enter your email or library card number'}
            {step === 2 && 'Enter the OTP sent to your college email'}
            {step === 3 && 'Set your new password'}
            {step === 4 && ''}
          </Text>
        </View>

        {/* Step Indicator */}
        {step < 4 && (
          <View style={styles.stepIndicator}>
            {stepLabels.map((label, idx) => (
              <React.Fragment key={label}>
                {idx > 0 && <View style={[styles.stepLine, { backgroundColor: step > idx ? colors.primary : colors.border }]} />}
                <View style={[styles.stepDot, { backgroundColor: step > idx ? colors.primary : colors.border }]} />
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Step 1: Enter Identifier */}
        {step === 1 && (
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
              onPress={handleSendOTP}
              disabled={isLoading}
              style={[styles.button, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[Typography.button, { color: '#fff' }]}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6 }]}>One-Time Password</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="keypad-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="6-digit OTP"
                  placeholderTextColor={colors.textMuted}
                  style={[Typography.body, styles.input, { color: colors.text }]}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => setStep(1)}
                style={[styles.backStepButton, { borderColor: colors.border }]}>
                <Text style={[Typography.buttonSm, { color: colors.textSecondary }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleVerifyOTP}
                style={[styles.button, { backgroundColor: colors.primary, flex: 1, marginLeft: Spacing.md }]} activeOpacity={0.8}>
                <Text style={[Typography.button, { color: '#fff' }]}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6 }]}>New Password</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor={colors.textMuted}
                  style={[Typography.body, styles.input, { color: colors.text }]}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6 }]}>Confirm Password</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textMuted}
                  style={[Typography.body, styles.input, { color: colors.text }]}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => setStep(2)}
                style={[styles.backStepButton, { borderColor: colors.border }]}>
                <Text style={[Typography.buttonSm, { color: colors.textSecondary }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResetPassword} disabled={isLoading}
                style={[styles.button, { backgroundColor: colors.primary, flex: 1, marginLeft: Spacing.md }]} activeOpacity={0.8}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[Typography.button, { color: '#fff' }]}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <View style={[styles.successCard, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={[Typography.h3, { color: colors.success, marginTop: Spacing.lg }]}>Password Reset!</Text>
            <Text style={[Typography.bodySm, { color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }]}>
              Your password has been reset successfully. You can now login with your new password.
            </Text>
            <TouchableOpacity
              style={[styles.backToLogin, { backgroundColor: colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[Typography.button, { color: '#fff' }]}>Back to Login</Text>
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
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxxl },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLine: { width: 30, height: 2, marginHorizontal: Spacing.sm },
  form: { gap: Spacing.lg },
  inputGroup: {},
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  input: { flex: 1, marginLeft: Spacing.sm, paddingVertical: 0 },
  button: {
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center',
    marginTop: Spacing.sm, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
  backStepButton: {
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.md, borderWidth: 1,
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
