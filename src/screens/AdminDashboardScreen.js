import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator
} from 'react-native';
import {
  Menu, BookOpen, Clock, Users,
  ClipboardList
} from 'lucide-react-native';
import { AdminColors } from '../theme/colors';
import { Typography, Spacing, BorderRadius } from '../theme/typography';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getPendingRequests, approveBorrow, rejectBorrow } from '../services/borrowService';

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeBorrows: 0,
    pendingRequests: 0,
    overdueFines: 0,
  });
  const [pendingTasks, setPendingTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1. Stats
      const booksSnap = await getCountFromServer(collection(db, 'books'));
      
      const borrowQ = query(collection(db, 'borrow_records'), where('status', 'in', ['BORROWED', 'OVERDUE']));
      const borrowsSnap = await getCountFromServer(borrowQ);
      
      const reqsQ = query(collection(db, 'borrow_records'), where('status', '==', 'PENDING'));
      const reqsSnap = await getCountFromServer(reqsQ);
      
      const duesSnap = await getDocs(query(collection(db, 'due_books'), where('fine', '>', 0)));
      let totalFines = 0;
      duesSnap.forEach(doc => totalFines += doc.data().fine);

      setStats({
        totalBooks: booksSnap.data().count,
        activeBorrows: borrowsSnap.data().count,
        pendingRequests: reqsSnap.data().count,
        overdueFines: totalFines
      });

      // 2. Pending Requests List (limit to a few)
      const requests = await getPendingRequests();
      setPendingTasks(requests.slice(0, 3));

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleApprove = async (id) => {
    await approveBorrow(id, 'admin'); // Pass actual admin ID if needed
    fetchDashboardData();
  };

  const handleReject = async (id) => {
    await rejectBorrow(id);
    fetchDashboardData();
  };

  const statsCards = [
    { label: 'Total Books', value: stats.totalBooks.toLocaleString(), icon: BookOpen },
    { label: 'Active Borrows', value: stats.activeBorrows, icon: Users },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: ClipboardList },
    { label: 'Overdue Fines', value: `₹${stats.overdueFines}`, icon: Clock },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AdminColors.adminAccentBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.background, { backgroundColor: AdminColors.adminBg }]} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Menu size={24} color={AdminColors.adminText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Portal</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats Cards</Text>
          <View style={styles.statsGrid}>
            {statsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <View key={index} style={styles.glassCard}>
                  <Text style={styles.statLabel}>{card.label}:</Text>
                  <View style={styles.statValueRow}>
                    <Text style={styles.statValue}>{card.value}</Text>
                    <Icon size={24} color={AdminColors.adminAccentBlue} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Tasks</Text>
          {pendingTasks.length === 0 ? (
            <Text style={{ color: AdminColors.adminTextSecondary }}>No pending requests.</Text>
          ) : pendingTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <Text style={styles.taskText}>
                {task.student?.name || task.studentId} requested{'\n'}"{task.book?.title || 'Unknown Book'}"
              </Text>
              <View style={styles.taskActions}>
                <TouchableOpacity onPress={() => handleApprove(task.id)} style={[styles.actionBtn, styles.approveBtn]} activeOpacity={0.8}>
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleReject(task.id)} style={[styles.actionBtn, styles.rejectBtn]} activeOpacity={0.8}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AdminColors.adminBg,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AdminColors.adminText,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AdminColors.adminText,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  glassCard: {
    width: '47%',
    backgroundColor: AdminColors.adminCardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: AdminColors.adminCardBorder,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statLabel: {
    fontSize: 13,
    color: AdminColors.adminTextSecondary,
    marginBottom: Spacing.xs,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: AdminColors.adminText,
  },
  taskCard: {
    backgroundColor: AdminColors.adminCardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: AdminColors.adminCardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  taskText: {
    fontSize: 16,
    color: AdminColors.adminText,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  taskActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: AdminColors.adminButtonFill,
  },
  rejectBtn: {
    backgroundColor: AdminColors.adminButtonFill,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: AdminColors.adminText,
  },
});

export default AdminDashboardScreen;
