import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const AdvanceBookingButton = ({ onPress, loading = false, disabled = false, alreadyReserved = false }) => {
  const { colors } = useTheme();

  if (alreadyReserved) {
    return (
      <TouchableOpacity
        disabled
        style={[styles.button, { backgroundColor: colors.warningLight, borderColor: colors.warning, borderWidth: 1 }]}
      >
        <Ionicons name="alert-circle" size={18} color={colors.warning} style={{ marginRight: 8 }} />
        <Text style={[Typography.button, { color: colors.warning }]}>Already Reserved</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: 'transparent',
          borderColor: disabled ? colors.textMuted : colors.primary,
          borderWidth: 2,
          opacity: loading ? 0.7 : 1,
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <Ionicons name="bookmark-outline" size={18} color={disabled ? colors.textMuted : colors.primary} style={{ marginRight: 8 }} />
          <Text style={[Typography.button, { color: disabled ? colors.textMuted : colors.primary }]}>Advance Booking</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
});

export default AdvanceBookingButton;
