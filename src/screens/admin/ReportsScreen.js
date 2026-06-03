import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { Menu, BookOpen, Users, DollarSign, TrendingUp, Download, FileText, BarChart3 } from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
const BOOKS = [];
const STUDENTS = [];
const FINES = [];
const DEPARTMENT_STATS = [];
const MOST_BORROWED = [];
const BORROW_RECORDS = [];

const ReportsScreen = ({ navigation }) => {
  const totalBooks = 188;
  const issuedBooks = 121;
  const activeStudents = STUDENTS.length;
  const totalFines = FINES.reduce((s, f) => s + f.amount, 0);

  const summaryCards = [
    { icon: BookOpen, v: totalBooks, l: 'Total Books', sub: '+12 this month', ic: AdminColors.navy, bg: AdminColors.blueLight },
    { icon: BarChart3, v: issuedBooks, l: 'Books Issued', sub: '64% utilization', ic: AdminColors.green, bg: AdminColors.greenLight },
    { icon: Users, v: activeStudents, l: 'Active Students', sub: '+3 this month', ic: AdminColors.purple, bg: AdminColors.purpleLight },
    { icon: DollarSign, v: `₹${totalFines}`, l: 'Total Fines', sub: 'Collected this semester', ic: AdminColors.red, bg: AdminColors.redLight },
  ];

  const monthlyStats = [
    { label: 'Books Issued', value: '47', change: '+12%', up: true },
    { label: 'Books Returned', value: '38', change: '+8%', up: true },
    { label: 'New Students', value: '3', change: '+15%', up: true },
    { label: 'Fines Collected', value: '₹680', change: '-5%', up: false },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}>
            <Menu size={24} color={AdminColors.navy} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.title}>Library Reports</Text>
            <Text style={s.sub}>Analytics and insights</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={s.grid}>
          {summaryCards.map((c, i) => (
            <View key={i} style={s.sumCard}>
              <View style={[s.sumIcon, { backgroundColor: c.bg }]}>
                <c.icon size={18} color={c.ic} />
              </View>
              <Text style={s.sumLabel}>{c.l}</Text>
              <Text style={s.sumVal}>{c.v}</Text>
              <Text style={s.sumSub}>{c.sub}</Text>
            </View>
          ))}
        </View>

        {/* Department Statistics */}
        <View style={s.section}>
          <Text style={s.secTitle}>Department Statistics</Text>
          <Text style={s.secSub}>Books issued by department</Text>
          {DEPARTMENT_STATS.map((dept, i) => {
            const pct = Math.round((dept.issued / dept.total) * 100);
            return (
              <View key={i} style={s.deptRow}>
                <View style={s.deptInfo}>
                  <Text style={s.deptName}>{dept.name}</Text>
                  <Text style={s.deptCount}>{dept.issued}/{dept.total}</Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${pct}%`, backgroundColor: pct > 70 ? AdminColors.green : pct > 40 ? AdminColors.orange : AdminColors.navy }]} />
                </View>
                <Text style={s.pctText}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* Most Borrowed Books */}
        <View style={s.section}>
          <Text style={s.secTitle}>Most Borrowed Books</Text>
          {MOST_BORROWED.map((book, i) => (
            <View key={book.bookId} style={[s.bookRow, i < MOST_BORROWED.length - 1 && s.bookBorder]}>
              <View style={[s.rank, { backgroundColor: i === 0 ? AdminColors.navy : i === 1 ? AdminColors.green : AdminColors.blue }]}>
                <Text style={s.rankText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.bookTitle}>{book.title}</Text>
                <Text style={s.bookAuthor}>{book.author}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.bookCount}>{book.times}</Text>
                <Text style={s.bookLabel}>times</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Monthly Summary */}
        <View style={s.section}>
          <Text style={s.secTitle}>Monthly Summary</Text>
          <View style={s.monthGrid}>
            {monthlyStats.map((stat, i) => (
              <View key={i} style={s.monthCard}>
                <Text style={s.monthLabel}>{stat.label}</Text>
                <Text style={s.monthVal}>{stat.value}</Text>
                <View style={s.changeRow}>
                  <TrendingUp size={12} color={stat.up ? AdminColors.green : AdminColors.red} />
                  <Text style={[s.changeText, { color: stat.up ? AdminColors.green : AdminColors.red }]}>{stat.change}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Export */}
        <View style={s.section}>
          <Text style={s.secTitle}>Export Reports</Text>
          <Text style={s.secSub}>Download detailed reports in PDF format</Text>
          {[{ label: 'Books Report', sub: 'Complete inventory and circulation data', icon: BookOpen },
            { label: 'Students Report', sub: 'Student activity and borrowing history', icon: Users },
            { label: 'Financial Report', sub: 'Fine collection and payment summary', icon: DollarSign },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={s.exportBtn} onPress={() => Alert.alert('Export', `${item.label} PDF generated`)} activeOpacity={0.7}>
              <View style={s.exportLeft}>
                <View style={[s.exportIcon, { backgroundColor: AdminColors.blueLight }]}>
                  <item.icon size={16} color={AdminColors.navy} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={s.exportLabel}>{item.label}</Text>
                  <Text style={s.exportSub}>{item.sub}</Text>
                </View>
              </View>
              <Download size={18} color={AdminColors.navy} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: AdminColors.bgGrey },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', color: AdminColors.textPrimary },
  sub: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  sumCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 1 },
  sumIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  sumLabel: { fontSize: 11, color: AdminColors.textSecondary },
  sumVal: { fontSize: 24, fontWeight: '700', color: AdminColors.textPrimary, marginTop: 2 },
  sumSub: { fontSize: 10, color: AdminColors.textMuted, marginTop: 2 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 18, elevation: 1 },
  secTitle: { fontSize: 17, fontWeight: '700', color: AdminColors.textPrimary },
  secSub: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 2, marginBottom: 12 },
  deptRow: { marginTop: 12 },
  deptInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  deptName: { fontSize: 13, fontWeight: '500', color: AdminColors.textPrimary },
  deptCount: { fontSize: 12, color: AdminColors.textSecondary },
  barBg: { height: 8, backgroundColor: AdminColors.bgGrey, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  pctText: { fontSize: 11, color: AdminColors.textMuted, marginTop: 2, textAlign: 'right' },
  bookRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  bookBorder: { borderBottomWidth: 1, borderBottomColor: AdminColors.border },
  rank: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  bookTitle: { fontSize: 14, fontWeight: '600', color: AdminColors.textPrimary },
  bookAuthor: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 1 },
  bookCount: { fontSize: 18, fontWeight: '700', color: AdminColors.navy },
  bookLabel: { fontSize: 10, color: AdminColors.textSecondary },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  monthCard: { width: '47%', backgroundColor: AdminColors.bgGrey, borderRadius: 10, padding: 14 },
  monthLabel: { fontSize: 12, color: AdminColors.textSecondary },
  monthVal: { fontSize: 22, fontWeight: '700', color: AdminColors.textPrimary, marginTop: 4 },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  changeText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: AdminColors.border },
  exportLeft: { flexDirection: 'row', alignItems: 'center' },
  exportIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  exportLabel: { fontSize: 14, fontWeight: '600', color: AdminColors.textPrimary },
  exportSub: { fontSize: 11, color: AdminColors.textSecondary, marginTop: 1 },
});

export default ReportsScreen;
