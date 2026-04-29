import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const FILTERS = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'title', label: 'Title', icon: 'text-outline' },
  { key: 'author', label: 'Author', icon: 'person-outline' },
  { key: 'genre', label: 'Genre', icon: 'bookmark-outline' },
  { key: 'bookCode', label: 'Book Code', icon: 'barcode-outline' },
];

const FilterPanel = ({ activeFilter, onFilterChange }) => {
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container} contentContainerStyle={styles.content}>
      {FILTERS.map(filter => {
        const isActive = activeFilter === filter.key;
        return (
          <TouchableOpacity
            key={filter.key}
            onPress={() => onFilterChange(filter.key)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? colors.primary : colors.surface,
                borderColor: isActive ? colors.primary : colors.border,
              }
            ]}
          >
            <Ionicons
              name={filter.icon}
              size={14}
              color={isActive ? '#fff' : colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[
              Typography.captionBold,
              { color: isActive ? '#fff' : colors.textSecondary }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
});

export default FilterPanel;
