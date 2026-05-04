import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ImageBackground,
} from 'react-native';
import {
  Menu, BookOpen, Clock, Users,
  ClipboardList, CheckCircle, XCircle
} from 'lucide-react-native';
import { AdminColors } from '../theme/colors';
import { Typography, Spacing, BorderRadius } from '../theme/typography';
import { ISSUE_REQUESTS, BOOKS } from '../services/mockData';

const AdminDashboardScreen = ({ navigation }) => {
  const totalBooks = 12500;
  const activeBorrows = 450;
  const pendingRequests = 35;
  const overdueFines = 210;

  const statsCards = [
    { label: 'Total Books', value: totalBooks.toLocaleString(), icon: BookOpen },
    { label: 'Active Borrows', value: activeBorrows, icon: Users },
    { label: 'Pending Requests', value: pendingRequests, icon: ClipboardList },
    { label: 'Overdue Fines', value: `$${overdueFines}`, icon: Clock },
  ];

  // We need names for these requests
  const pendingTasks = ISSUE_REQUESTS.filter(ir => ir.status === 'pending').map((req, index) => {
    const book = BOOKS.find(b => b.id === req.bookId);
    return {
      id: req.id,
      studentName: 'John Doe', // Mock name since we don't look up the student directly in this simple loop
      bookTitle: book ? book.title : 'Unknown Book',
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.background, { backgroundColor: AdminColors.adminBg }]} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Menu size={24} color={AdminColors.adminText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Portal</Text>
          <View style={{ width: 44 }} /> {/* Balance the flex header */}
        </View>

        {/* Stats Section */}
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

        {/* Pending Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Tasks</Text>
          {pendingTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <Text style={styles.taskText}>
                {task.studentName} requested{'\n'}"{task.bookTitle}"
              </Text>
              <View style={styles.taskActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} activeOpacity={0.8}>
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} activeOpacity={0.8}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {/* Add a couple dummy requests to match the screenshot visually */}
          {pendingTasks.length < 3 && (
            <View style={styles.taskCard}>
              <Text style={styles.taskText}>
                John Doe requested{'\n'}"Introduction to Algorithms"
              </Text>
              <View style={styles.taskActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} activeOpacity={0.8}>
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} activeOpacity={0.8}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    // Add subtle shadow to enhance glass effect
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
