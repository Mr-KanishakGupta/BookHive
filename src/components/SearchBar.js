import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const SearchBar = ({ value, onChangeText, placeholder = 'Search books...', onFocus, onBlur, autoFocus = false }) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.02 : 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        borderColor: focused ? colors.primary : colors.border,
        borderWidth: focused ? 2 : 1,
        transform: [{ scale: scaleAnim }],
        shadowColor: colors.shadow,
      }
    ]}>
      <Ionicons name="search" size={20} color={focused ? colors.primary : colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[Typography.body, styles.input, { color: colors.text }]}
        onFocus={() => { setFocused(true); onFocus?.(); }}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
    paddingVertical: 0,
  },
});

export default SearchBar;
