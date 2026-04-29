import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BooksContext';
import BorrowHistoryItem from '../components/BorrowHistoryItem';
import { Typography, Spacing } from '../theme/typography';

const BorrowHistoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { borrowHistory, loadBorrowHistory, isLoading } = useBooks();

  useEffect(() => {
    if (user?.id) loadBorrowHistory(user.id);
  }, [user]);

  const onRefresh = useCallback(() => {
    if (user?.id) loadBorrowHistory(user.id);
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[Typography.h3, { color: colors.text }]}>Borrow History</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={borrowHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BorrowHistoryItem record={item} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={colors.textMuted} />
            <Text style={[Typography.body, { color: colors.textMuted, marginTop: Spacing.lg }]}>
              No borrow history
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: { padding: 4 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});

export default BorrowHistoryScreen;
