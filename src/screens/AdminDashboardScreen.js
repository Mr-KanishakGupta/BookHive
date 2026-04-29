import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';
import { STUDENTS, BOOKS, BORROW_RECORDS, ISSUE_REQUESTS, ADVANCE_RESERVATIONS } from '../services/mockData';

const AdminDashboardScreen = () => {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const [expandedSection, setExpandedSection] = useState(null);

  const pendingRequests = ISSUE_REQUESTS.filter(ir => ir.status === 'pending').map(ir => ({
    ...ir,
    book: BOOKS.find(b => b.id === ir.bookId),
    student: STUDENTS.find(s => s.id === ir.studentId),
  }));

  const reservations = ADVANCE_RESERVATIONS.map(ar => ({
    ...ar,
    book: BOOKS.find(b => b.id === ar.bookId),
    student: STUDENTS.find(s => s.id === ar.studentId),
  }));

  const blacklisted = STUDENTS.filter(s => s.isBlacklisted);

  const today = new Date().toISOString().split('T')[0];
  const dueToday = BORROW_RECORDS.filter(br =>
    br.status === 'active' && br.dueDate === today
  ).map(br => ({
    ...br,
    book: BOOKS.find(b => b.id === br.bookId),
    student: STUDENTS.find(s => s.id === br.studentId),
  }));

  const overdue = BORROW_RECORDS.filter(br => br.status === 'overdue').map(br => ({
    ...br,
    book: BOOKS.find(b => b.id === br.bookId),
    student: STUDENTS.find(s => s.id === br.studentId),
  }));

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleApprove = (item) => {
    Alert.alert('Approved', `Issue request for "${item.book?.title}" by ${item.student?.name} has been approved.`);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const renderSummaryCard = (icon, label, count, bg, color) => (
    <View style={[styles.summaryCard, { backgroundColor: bg, borderColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[Typography.h3, { color: color, marginTop: 6 }]}>{count}</Text>
      <Text style={[Typography.caption, { color, marginTop: 2 }]}>{label}</Text>
    </View>
  );

  const renderSection = (title, icon, sectionKey, content) => (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <TouchableOpacity
        onPress={() => toggleSection(sectionKey)}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon} size={20} color={colors.primary} />
          <Text style={[Typography.bodySmBold, { color: colors.text, marginLeft: Spacing.sm }]}>{title}</Text>
        </View>
        <Ionicons
          name={expandedSection === sectionKey ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {expandedSection === sectionKey && (
        <View style={styles.sectionContent}>
          {content}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#1a1a1a' ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.h2, { color: colors.text }]}>Admin Dashboard</Text>
            <Text style={[Typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
              BMSCE Library Management
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { borderColor: colors.error }]}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {renderSummaryCard('document-text', 'Pending', pendingRequests.length, colors.warningLight, colors.warning)}
          {renderSummaryCard('bookmark', 'Reserved', reservations.length, colors.infoLight, colors.info)}
          {renderSummaryCard('ban', 'Blacklisted', blacklisted.length, colors.errorLight, colors.error)}
          {renderSummaryCard('alert-circle', 'Overdue', overdue.length, colors.errorLight, colors.error)}
        </View>

        {/* Pending Issue Requests */}
        {renderSection('Pending Issue Requests', 'document-text-outline', 'pending', (
          pendingRequests.length === 0 ? (
            <Text style={[Typography.bodySm, { color: colors.textMuted }]}>No pending requests</Text>
          ) : (
            pendingRequests.map(req => (
              <View key={req.id} style={[styles.listItem, { borderColor: colors.divider }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySmBold, { color: colors.text }]}>{req.book?.title}</Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    Requested by: {req.student?.name} ({req.student?.usn})
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textMuted }]}>
                    Date: {req.requestDate}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleApprove(req)}
                  style={[styles.approveBtn, { backgroundColor: colors.success }]}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))
          )
        ))}

        {/* Advance Reservations */}
        {renderSection('Advance Reservations', 'bookmark-outline', 'reservations', (
          reservations.length === 0 ? (
            <Text style={[Typography.bodySm, { color: colors.textMuted }]}>No advance reservations</Text>
          ) : (
            reservations.map(res => (
              <View key={res.id} style={[styles.listItem, { borderColor: colors.divider }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySmBold, { color: colors.text }]}>{res.book?.title}</Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    Reserved by: {res.student?.name}
                  </Text>
                  <View style={[styles.statusChip, { backgroundColor: colors.infoLight }]}>
                    <Text style={[Typography.captionBold, { color: colors.info }]}>{res.status}</Text>
                  </View>
                </View>
              </View>
            ))
          )
        ))}

        {/* Blacklisted Accounts */}
        {renderSection('Blacklisted Accounts', 'ban-outline', 'blacklisted', (
          blacklisted.length === 0 ? (
            <Text style={[Typography.bodySm, { color: colors.textMuted }]}>No blacklisted accounts</Text>
          ) : (
            blacklisted.map(student => (
              <View key={student.id} style={[styles.listItem, { borderColor: colors.divider }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySmBold, { color: colors.text }]}>{student.name}</Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    {student.usn} · Card: {student.libraryCardNumber}
                  </Text>
                  <Text style={[Typography.captionBold, { color: colors.error, marginTop: 4 }]}>
                    Fine: ₹{student.fines}
                  </Text>
                </View>
              </View>
            ))
          )
        ))}

        {/* Books Due Today */}
        {renderSection('Books Due Today', 'today-outline', 'dueToday', (
          dueToday.length === 0 ? (
            <Text style={[Typography.bodySm, { color: colors.textMuted }]}>No books due today</Text>
          ) : (
            dueToday.map(record => (
              <View key={record.id} style={[styles.listItem, { borderColor: colors.divider }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySmBold, { color: colors.text }]}>{record.book?.title}</Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    Borrowed by: {record.student?.name}
                  </Text>
                </View>
              </View>
            ))
          )
        ))}

        {/* Overdue Books */}
        {renderSection('Overdue Books', 'alert-circle-outline', 'overdue', (
          overdue.length === 0 ? (
            <Text style={[Typography.bodySm, { color: colors.textMuted }]}>No overdue books</Text>
          ) : (
            overdue.map(record => (
              <View key={record.id} style={[styles.listItem, { borderColor: colors.divider }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySmBold, { color: colors.text }]}>{record.book?.title}</Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    Student: {record.student?.name}
                  </Text>
                  <Text style={[Typography.captionBold, { color: colors.error, marginTop: 2 }]}>
                    Due: {record.dueDate} · Fine: ₹{record.fine}
                  </Text>
                </View>
              </View>
            ))
          )
        ))}

        {/* All Students */}
        {renderSection('Student Borrow History', 'people-outline', 'students', (
          STUDENTS.map(student => {
            const borrows = BORROW_RECORDS.filter(br => br.studentId === student.id);
            return (
              <View key={student.id} style={[styles.listItem, { borderColor: colors.divider }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySmBold, { color: colors.text }]}>{student.name}</Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    {student.usn} · {student.email}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                    Total borrows: {borrows.length} · Active: {borrows.filter(b => b.status === 'active' || b.status === 'overdue').length} · 
                    Fines: ₹{student.fines}
                  </Text>
                  {student.isBlacklisted && (
                    <View style={[styles.statusChip, { backgroundColor: colors.errorLight, marginTop: 4 }]}>
                      <Text style={[Typography.captionBold, { color: colors.error }]}>BLACKLISTED</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        ))}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    marginTop: 4,
  },
});

export default AdminDashboardScreen;
