import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const SignupScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { signup, fetchStudentByCard, isLoading, clearError } = useAuth();
  const [step, setStep] = useState(1); // 1: enter card, 2: confirm info + set password
  const [cardNumber, setCardNumber] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleFetchInfo = async () => {
    if (!cardNumber.trim()) {
      Alert.alert('Error', 'Please enter your Library Card Number');
      return;
    }
    try {
      clearError();
      const info = await fetchStudentByCard(cardNumber.trim());
      setStudentInfo(info);
      setStep(2);
    } catch (e) {
      Alert.alert('Not Found', e.message);
    }
  };

  const handleSignup = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please set a password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      clearError();
      await signup(cardNumber.trim(), password);
    } catch (e) {
      Alert.alert('Signup Failed', e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[Typography.h1, { color: colors.text }]}>Create Account</Text>
          <Text style={[Typography.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
            {step === 1 ? 'Enter your Library Card Number to get started' : 'Confirm your details and set a password'}
          </Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.stepLine, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
          <View style={[styles.stepDot, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
        </View>

        {step === 1 ? (
          /* Step 1: Library Card */
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6 }]}>Library Card Number</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="card-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="e.g., BMSCE2024001"
                  placeholderTextColor={colors.textMuted}
                  style={[Typography.body, styles.input, { color: colors.text }]}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <TouchableOpacity onPress={handleFetchInfo} disabled={isLoading}
              style={[styles.button, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[Typography.button, { color: '#fff' }]}>Verify Card</Text>
              )}
            </TouchableOpacity>

            <View style={[styles.infoBox, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
              <Ionicons name="information-circle" size={16} color={colors.accent} />
              <Text style={[Typography.caption, { color: colors.textSecondary, marginLeft: 6, flex: 1 }]}>
                Demo cards: BMSCE2024001, BMSCE2024002, BMSCE2024003, BMSCE2024004
              </Text>
            </View>
          </View>
        ) : (
          /* Step 2: Confirm Info + Set Password */
          <View style={styles.form}>
            {/* Auto-fetched info card */}
            <View style={[styles.infoCard, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[Typography.bodySmBold, { color: colors.success, marginLeft: 6 }]}>Verified Student</Text>
              </View>
              {[
                { label: 'Name', value: studentInfo?.name },
                { label: 'Email', value: studentInfo?.email },
                { label: 'USN', value: studentInfo?.usn },
                { label: 'Library Card', value: studentInfo?.libraryCardNumber },
              ].map(item => (
                <View key={item.label} style={styles.infoRow}>
                  <Text style={[Typography.caption, { color: colors.textMuted, width: 90 }]}>{item.label}</Text>
                  <Text style={[Typography.bodySm, { color: colors.text, flex: 1 }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Password fields */}
            <View style={styles.inputGroup}>
              <Text style={[Typography.bodySmBold, { color: colors.text, marginBottom: 6 }]}>Set Password</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
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
              <TouchableOpacity onPress={() => setStep(1)}
                style={[styles.backStepButton, { borderColor: colors.border }]}>
                <Text style={[Typography.buttonSm, { color: colors.textSecondary }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignup} disabled={isLoading}
                style={[styles.button, { backgroundColor: colors.primary, flex: 1, marginLeft: Spacing.md }]} activeOpacity={0.8}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[Typography.button, { color: '#fff' }]}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Login link */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={[Typography.bodySm, { color: colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 60,
    paddingBottom: Spacing.xxxl,
  },
  backButton: {
    marginBottom: Spacing.xl,
    padding: 4,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 60,
    height: 2,
    marginHorizontal: Spacing.sm,
  },
  form: {
    gap: Spacing.lg,
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
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  infoCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backStepButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    paddingVertical: Spacing.sm,
  },
});

export default SignupScreen;
