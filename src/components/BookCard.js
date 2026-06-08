import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const BookCoverImage = ({ uri, style }) => {
  const { colors } = useTheme();
  if (uri) {
    return <Image source={{ uri }} style={style} />;
  }
  return (
    <View style={[style, { backgroundColor: colors.border || '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>  
      <Ionicons name="book-outline" size={32} color={colors.textMuted || '#999'} />
    </View>
  );
};

const BookCard = ({ book, onPress, style, horizontal = false, isCurated = false }) => {
  const { colors } = useTheme();
  const coverUri = book.frontImage || book.coverUrl || null;

  if (horizontal) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.horizontalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, style]}
      >
        <BookCoverImage uri={coverUri} style={styles.horizontalCover} />
        <View style={styles.horizontalInfo}>
          <Text style={[Typography.bodySmBold, { color: colors.text }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
            {book.author}
          </Text>
          <View style={[styles.badge, {
            backgroundColor: book.availableCopies > 0 ? colors.successLight : colors.errorLight,
            marginTop: 6,
          }]}>
            <Text style={[Typography.caption, {
              color: book.availableCopies > 0 ? colors.success : colors.error,
              fontWeight: '600',
            }]}>
              {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Unavailable'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, shadowColor: colors.shadow }, style]}
    >
      <BookCoverImage uri={coverUri} style={styles.cover} />
      <View style={styles.info}>
        <Text style={[Typography.bodySmBold, { color: colors.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        
        {isCurated ? (
          <View style={styles.curatedInfo}>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={1}>
              Rating: {book.rating || '4.5'}/5
            </Text>
            {book.recommended && (
              <Text style={[Typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                Recommended
              </Text>
            )}
          </View>
        ) : (
          <>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
              {book.author}
            </Text>
            <View style={[styles.badge, {
              backgroundColor: book.availableCopies > 0 ? colors.successLight : colors.errorLight,
              marginTop: 6,
              alignSelf: 'flex-start',
            }]}>
              <View style={[styles.dot, {
                backgroundColor: book.availableCopies > 0 ? colors.success : colors.error,
              }]} />
              <Text style={[Typography.caption, {
                color: book.availableCopies > 0 ? colors.success : colors.error,
                fontWeight: '600',
              }]}>
                {book.availableCopies > 0 ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 155,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: Spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cover: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
  },
  info: {
    padding: Spacing.md,
  },
  curatedInfo: {
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  horizontalCover: {
    width: 80,
    height: 110,
    backgroundColor: '#e0e0e0',
  },
  horizontalInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
});

export default BookCard;

