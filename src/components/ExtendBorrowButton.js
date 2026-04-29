import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const ExtendBorrowButton = ({ onPress, loading = false, disabled = false }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.surface : colors.secondaryLight,
          borderColor: disabled ? colors.textMuted : colors.secondary,
          borderWidth: 1,
          opacity: loading ? 0.7 : 1,
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.secondary} />
      ) : (
        <>
          <Ionicons name="refresh-outline" size={16} color={disabled ? colors.textMuted : colors.success} style={{ marginRight: 6 }} />
          <Text style={[Typography.buttonSm, { color: disabled ? colors.textMuted : colors.success }]}>Extend</Text>
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
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
});

export default ExtendBorrowButton;
