import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const ActiveBorrowCard = ({ book, dueDate, daysRemaining, onRenew }) => {
  const { colors } = useTheme();

  // Progress ring calculations
  const size = 90;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Assuming a 14-day total borrow period for the progress calc
  const progress = Math.max(0, Math.min(1, daysRemaining / 14));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.card, { backgroundColor: colors.activeBorrowBg }]}>
      <View style={styles.headerRow}>
        <Text style={[Typography.bodySmBold, { color: colors.text }]}>Active Borrow</Text>
      </View>
      
      <View style={styles.contentRow}>
        {/* Progress Ring */}
        <View style={styles.ringContainer}>
          <Svg width={size} height={size}>
            {/* Background ring */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.progressRingTrack}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress ring */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.progressRingFill}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          </Svg>
          <View style={styles.ringTextContainer}>
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>Due in</Text>
            <Text style={[Typography.h3, { color: colors.text }]}>{daysRemaining} days</Text>
          </View>
        </View>

        {/* Book Details */}
        <View style={styles.bookInfo}>
          <View style={styles.bookDetailsRow}>
            <Image source={{ uri: book.coverUrl }} style={styles.cover} />
            <View style={styles.bookText}>
              <Text style={[Typography.bodyBold, { color: colors.text }]} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                Author: {book.author}
              </Text>
              <Text style={[Typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                Due: {dueDate}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.renewButton, { backgroundColor: colors.renewButton }]}
            onPress={onRenew}
            activeOpacity={0.8}
          >
            <Text style={[Typography.buttonSm, { color: '#FFFFFF' }]}>Renew</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    marginBottom: Spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  bookDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cover: {
    width: 45,
    height: 65,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E9ECEF',
  },
  bookText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  renewButton: {
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ActiveBorrowCard;
