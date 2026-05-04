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

const DEPARTMENTS = [
  { key: 'all_dept', label: 'All Depts' },
  { key: 'Computer Science', label: 'CSE' },
  { key: 'Electronics & Communication', label: 'ECE' },
  { key: 'Mechanical Engineering', label: 'MECH' },
  { key: 'Civil Engineering', label: 'CIVIL' },
  { key: 'Information Science', label: 'ISE' },
  { key: 'Electrical Engineering', label: 'EEE' },
];

const FilterPanel = ({ activeFilter, onFilterChange, activeDept, onDeptChange }) => {
  const { colors } = useTheme();

  return (
    <View>
      {/* Search Type Filters */}
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

      {/* Department Filters */}
      {onDeptChange && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptContainer} contentContainerStyle={styles.content}>
          <Ionicons name="business-outline" size={14} color={colors.textMuted} style={{ marginRight: 6, alignSelf: 'center' }} />
          {DEPARTMENTS.map(dept => {
            const isActive = activeDept === dept.key;
            return (
              <TouchableOpacity
                key={dept.key}
                onPress={() => onDeptChange(dept.key)}
                activeOpacity={0.7}
                style={[
                  styles.deptChip,
                  {
                    backgroundColor: isActive ? colors.primary + '15' : 'transparent',
                    borderColor: isActive ? colors.primary : colors.border,
                  }
                ]}
              >
                <Text style={[
                  Typography.captionBold,
                  { color: isActive ? colors.primary : colors.textSecondary }
                ]}>
                  {dept.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  deptContainer: {
    marginBottom: Spacing.sm,
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
  deptChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
});

export default FilterPanel;
