import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing } from '../theme/typography';

const RoomsScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Ionicons name="grid-outline" size={64} color={colors.border} />
        <Text style={[Typography.h3, { color: colors.text, marginTop: Spacing.lg }]}>
          Study Rooms
        </Text>
        <Text style={[Typography.bodySm, { color: colors.textMuted, marginTop: Spacing.sm, textAlign: 'center', paddingHorizontal: Spacing.xxl }]}>
          Book a study room or discussion space for your group. Feature coming soon.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RoomsScreen;
