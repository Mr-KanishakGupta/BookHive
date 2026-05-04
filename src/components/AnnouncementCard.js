import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const AnnouncementCard = ({ announcement }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.announcementBg }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.announcementIconBg }]}>
        <Ionicons name={announcement.icon} size={22} color={colors.primary} />
      </View>
      <Text style={[Typography.announcementTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
        {announcement.title}
      </Text>
      <Text style={[Typography.announcementTime, { color: colors.textSecondary }]}>
        {announcement.time}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
});

export default AnnouncementCard;
