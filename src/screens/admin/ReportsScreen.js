import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Menu, BookOpen, Users, DollarSign, TrendingUp, Download, FileText, BarChart3, AlertCircle } from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const ReportsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState({
    totalBooks: 0,
    issuedBooks: 0,
    activeStudents: 0,
    totalFines: 0,
    totalReturned: 0,
    totalOverdue: 0,
    totalReservations: 0,
    blacklistedStudents: 0,
  });

  const [booksList, setBooksList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [borrowsList, setBorrowsList] = useState([]);
  
  const [departmentStats, setDepartmentStats] = useState([]);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch books
      const booksSnap = await getDocs(collection(db, 'books'));
      const books = booksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBooksList(books);

      // 2. Fetch students
      const studentsSnap = await getDocs(collection(db, 'students'));
      const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentsList(students);

      // 3. Fetch borrow records
      const borrowsSnap = await getDocs(collection(db, 'borrow_records'));
      const borrows = borrowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBorrowsList(borrows);

      // 4. Fetch reservations (advance_bookings)
      const reservationsSnap = await getDocs(collection(db, 'advance_bookings'));
      const reservations = reservationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // --- Calculate Core Statistics ---
      const totalBooks = books.reduce((sum, b) => sum + (Number(b.totalCopies) || 0), 0);
      const issuedBooks = borrows.filter(b => b.status === 'BORROWED' || b.status === 'OVERDUE').length;
      const activeStudents = students.length;
      const totalFines = borrows.filter(b => b.fineStatus === true).reduce((sum, b) => sum + (Number(b.fine) || 0), 0);
      
      const totalReturned = borrows.filter(b => b.status === 'RETURNED').length;
      const totalOverdue = borrows.filter(b => b.status === 'OVERDUE').length;
      const totalReservations = reservations.filter(b => b.status === 'WAITING' || b.status === 'READY').length;
      const blacklistedStudents = students.filter(s => s.isBlacklisted === true).length;

      setStats({
        totalBooks,
        issuedBooks,
        activeStudents,
        totalFines,
        totalReturned,
        totalOverdue,
        totalReservations,
        blacklistedStudents,
      });

      // --- Calculate Department Statistics ---
      const deptMap = {};
      books.forEach(b => {
        const dept = b.department || 'General';
        if (!deptMap[dept]) {
          deptMap[dept] = { name: dept, total: 0, issued: 0 };
        }
        deptMap[dept].total += Number(b.totalCopies) || 0;
      });

      borrows.forEach(br => {
        if (br.status === 'BORROWED' || br.status === 'OVERDUE') {
          const book = books.find(b => b.id === br.bookId);
          const dept = book?.department || 'General';
          if (!deptMap[dept]) {
            deptMap[dept] = { name: dept, total: 0, issued: 0 };
          }
          deptMap[dept].issued += 1;
        }
      });

      const processedDeptStats = Object.values(deptMap)
        .filter(d => d.total > 0)
        .sort((a, b) => b.issued - a.issued);
      setDepartmentStats(processedDeptStats);

      // --- Calculate Most Borrowed Books ---
      const borrowCounts = {};
      borrows.forEach(br => {
        if (br.status !== 'PENDING' && br.status !== 'REJECTED') {
          borrowCounts[br.bookId] = (borrowCounts[br.bookId] || 0) + 1;
        }
      });

      const sortedBorrowedIds = Object.keys(borrowCounts).sort((a, b) => borrowCounts[b] - borrowCounts[a]);
      const topBorrowed = sortedBorrowedIds.slice(0, 5).map(bookId => {
        const book = books.find(b => b.id === bookId);
        return {
          bookId,
          title: book?.title || 'Unknown Title',
          author: book?.author || 'Unknown Author',
          times: borrowCounts[bookId],
        };
      });
      setMostBorrowed(topBorrowed);

      // --- Calculate Monthly Summary ---
      const now = new Date();
      const curMonth = now.getMonth();
      const curYear = now.getFullYear();

      const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
      const prevYear = curMonth === 0 ? curYear - 1 : curYear;

      const parseDate = (val) => {
        if (!val) return null;
        if (val.toDate) return val.toDate();
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      };

      let curIssued = 0, prevIssued = 0;
      let curReturned = 0, prevReturned = 0;
      let curNewStudents = 0, prevNewStudents = 0;
      let curFines = 0, prevFines = 0;

      borrows.forEach(br => {
        const issueDate = parseDate(br.borrowDate || br.createdAt);
        if (issueDate) {
          if (issueDate.getMonth() === curMonth && issueDate.getFullYear() === curYear) {
            curIssued++;
          } else if (issueDate.getMonth() === prevMonth && issueDate.getFullYear() === prevYear) {
            prevIssued++;
          }
        }

        const retDate = parseDate(br.returnDate);
        if (retDate) {
          if (retDate.getMonth() === curMonth && retDate.getFullYear() === curYear) {
            curReturned++;
          } else if (retDate.getMonth() === prevMonth && retDate.getFullYear() === prevYear) {
            prevReturned++;
          }
        }

        if (br.fineStatus === true && br.fine > 0) {
          const paidDate = parseDate(br.returnDate || br.createdAt);
          if (paidDate) {
            if (paidDate.getMonth() === curMonth && paidDate.getFullYear() === curYear) {
              curFines += Number(br.fine) || 0;
            } else if (paidDate.getMonth() === prevMonth && paidDate.getFullYear() === prevYear) {
              prevFines += Number(br.fine) || 0;
            }
          }
        }
      });

      students.forEach(st => {
        const joinDate = parseDate(st.createdAt);
        if (joinDate) {
          if (joinDate.getMonth() === curMonth && joinDate.getFullYear() === curYear) {
            curNewStudents++;
          } else if (joinDate.getMonth() === prevMonth && joinDate.getFullYear() === prevYear) {
            prevNewStudents++;
          }
        }
      });

      const calcPercentageChange = (curr, prev) => {
        if (prev === 0) return curr > 0 ? '+100%' : '0%';
        const diff = ((curr - prev) / prev) * 100;
        const sign = diff >= 0 ? '+' : '';
        return `${sign}${Math.round(diff)}%`;
      };

      setMonthlyStats([
        { label: 'Books Issued', value: String(curIssued), change: calcPercentageChange(curIssued, prevIssued), up: curIssued >= prevIssued },
        { label: 'Books Returned', value: String(curReturned), change: calcPercentageChange(curReturned, prevReturned), up: curReturned >= prevReturned },
        { label: 'New Students', value: String(curNewStudents), change: calcPercentageChange(curNewStudents, prevNewStudents), up: curNewStudents >= prevNewStudents },
        { label: 'Fines Collected', value: `₹${curFines}`, change: calcPercentageChange(curFines, prevFines), up: curFines >= prevFines },
      ]);

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to fetch library reports data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  const summaryCards = [
    { icon: BookOpen, v: stats.totalBooks, l: 'Total Books', sub: 'Copies in inventory', ic: AdminColors.navy, bg: AdminColors.blueLight },
    { icon: BarChart3, v: stats.issuedBooks, l: 'Books Issued', sub: `${stats.totalBooks > 0 ? Math.round((stats.issuedBooks / stats.totalBooks) * 100) : 0}% utilization`, ic: AdminColors.green, bg: AdminColors.greenLight },
    { icon: Users, v: stats.activeStudents, l: 'Active Students', sub: 'Registered members', ic: AdminColors.purple, bg: AdminColors.purpleLight },
    { icon: DollarSign, v: `₹${stats.totalFines}`, l: 'Total Fines', sub: 'Collected fines', ic: AdminColors.red, bg: AdminColors.redLight },
  ];

  const handleExportPDF = async (type) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      let html = '';
      const dateStr = new Date().toLocaleString();

      if (type === 'books') {
        html = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; }
                .header { border-bottom: 2px solid #003366; padding-bottom: 10px; margin-bottom: 20px; }
                .title { font-size: 24px; font-weight: bold; color: #003366; }
                .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                .stats-grid { display: flex; flex-direction: row; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
                .stat-card { flex: 1; padding: 15px; background: #f4f6f9; border-radius: 8px; border: 1px solid #e1e4e8; text-align: center; }
                .stat-val { font-size: 20px; font-weight: bold; color: #003366; margin-top: 5px; }
                .stat-label { font-size: 12px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th { background-color: #003366; color: white; padding: 10px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #e1e4e8; }
                tr:nth-child(even) { background-color: #f8fafc; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="title">BookHive Library — Inventory & Books Report</div>
                <div class="subtitle">Generated on: ${dateStr}</div>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Unique Titles</div>
                  <div class="stat-val">${booksList.length}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Total Copies</div>
                  <div class="stat-val">${stats.totalBooks}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Currently Issued</div>
                  <div class="stat-val">${stats.issuedBooks}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Available Copies</div>
                  <div class="stat-val">${stats.totalBooks - stats.issuedBooks}</div>
                </div>
              </div>

              <h3>Book Circulation List</h3>
              <table>
                <thead>
                  <tr>
                    <th>Book Code</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Department</th>
                    <th>Genre</th>
                    <th>Total Copies</th>
                    <th>Available</th>
                  </tr>
                </thead>
                <tbody>
                  ${booksList.map(b => `
                    <tr>
                      <td><strong>${b.id || ''}</strong></td>
                      <td>${b.title || ''}</td>
                      <td>${b.author || ''}</td>
                      <td>${b.department || ''}</td>
                      <td>${b.genre || ''}</td>
                      <td>${b.totalCopies || 0}</td>
                      <td>${b.availableCopies || 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;
      } else if (type === 'students') {
        html = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; }
                .header { border-bottom: 2px solid #003366; padding-bottom: 10px; margin-bottom: 20px; }
                .title { font-size: 24px; font-weight: bold; color: #003366; }
                .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                .stats-grid { display: flex; flex-direction: row; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
                .stat-card { flex: 1; padding: 15px; background: #f4f6f9; border-radius: 8px; border: 1px solid #e1e4e8; text-align: center; }
                .stat-val { font-size: 20px; font-weight: bold; color: #003366; margin-top: 5px; }
                .stat-label { font-size: 12px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th { background-color: #003366; color: white; padding: 10px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #e1e4e8; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .badge { padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
                .badge-red { background: #fde8e8; color: #9b1c1c; }
                .badge-green { background: #def7ec; color: #03543f; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="title">BookHive Library — Student Activity Report</div>
                <div class="subtitle">Generated on: ${dateStr}</div>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Registered</div>
                  <div class="stat-val">${studentsList.length}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Blacklisted</div>
                  <div class="stat-val" style="color: red;">${stats.blacklistedStudents}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Active Borrowers</div>
                  <div class="stat-val">${stats.issuedBooks}</div>
                </div>
              </div>

              <h3>Student Roster & Fines</h3>
              <table>
                <thead>
                  <tr>
                    <th>Library Card ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>USN</th>
                    <th>Outstanding Fines</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${studentsList.map(s => {
                    const isBlocked = s.isBlacklisted;
                    return `
                      <tr>
                        <td><strong>${s.library_card_id || s.id}</strong></td>
                        <td>${s.name || ''}</td>
                        <td>${s.college_id || ''}</td>
                        <td>${s.usn || 'N/A'}</td>
                        <td>₹${s.fineAmount || 0}</td>
                        <td>
                          <span class="badge ${isBlocked ? 'badge-red' : 'badge-green'}">
                            ${isBlocked ? 'Blacklisted' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;
      } else if (type === 'financial') {
        const transactions = [];
        borrowsList.forEach(b => {
          if (b.fine > 0) {
            const student = studentsList.find(s => s.id === b.studentId || s.library_card_id === b.studentId);
            const book = booksList.find(bk => bk.id === b.bookId);
            transactions.push({
              studentName: student?.name || b.studentId,
              studentCard: b.studentId,
              bookTitle: book?.title || 'Unknown Title',
              status: b.fineStatus ? 'Paid' : 'Unpaid',
              amount: b.fine,
              dueDate: b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'N/A'
            });
          }
        });

        const totalUnpaidFines = transactions.filter(t => t.status === 'Unpaid').reduce((sum, t) => sum + t.amount, 0);

        html = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; }
                .header { border-bottom: 2px solid #003366; padding-bottom: 10px; margin-bottom: 20px; }
                .title { font-size: 24px; font-weight: bold; color: #003366; }
                .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                .stats-grid { display: flex; flex-direction: row; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
                .stat-card { flex: 1; padding: 15px; background: #f4f6f9; border-radius: 8px; border: 1px solid #e1e4e8; text-align: center; }
                .stat-val { font-size: 20px; font-weight: bold; color: #003366; margin-top: 5px; }
                .stat-label { font-size: 12px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th { background-color: #003366; color: white; padding: 10px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #e1e4e8; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .badge { padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
                .badge-red { background: #fde8e8; color: #9b1c1c; }
                .badge-green { background: #def7ec; color: #03543f; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="title">BookHive Library — Financial Report</div>
                <div class="subtitle">Generated on: ${dateStr}</div>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Fines Collected</div>
                  <div class="stat-val" style="color: green;">₹${stats.totalFines}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Outstanding Unpaid Fines</div>
                  <div class="stat-val" style="color: red;">₹${totalUnpaidFines}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Total Logged Dues</div>
                  <div class="stat-val">₹${stats.totalFines + totalUnpaidFines}</div>
                </div>
              </div>

              <h3>Fine Transactions Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Student Card</th>
                    <th>Student Name</th>
                    <th>Book Title</th>
                    <th>Due Date</th>
                    <th>Fine</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.length === 0 ? '<tr><td colspan="6" style="text-align:center;">No fines recorded.</td></tr>' : transactions.map(t => `
                    <tr>
                      <td><strong>${t.studentCard}</strong></td>
                      <td>${t.studentName}</td>
                      <td>${t.bookTitle}</td>
                      <td>${t.dueDate}</td>
                      <td>₹${t.amount}</td>
                      <td>
                        <span class="badge ${t.status === 'Unpaid' ? 'badge-red' : 'badge-green'}">
                          ${t.status}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;
      }

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to export PDF: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: AdminColors.bgGrey, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={AdminColors.navy} />
        <Text style={{ marginTop: 12, color: AdminColors.textSecondary }}>Loading reports...</Text>
      </View>
    );
  }

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

        {/* Detailed Library Report Table/Grid */}
        <View style={s.section}>
          <Text style={s.secTitle}>Detailed Report Summary</Text>
          <Text style={s.secSub}>Key database indicators</Text>
          
          <View style={s.reportRow}>
            <Text style={s.reportLabel}>Total Books (Copies)</Text>
            <Text style={s.reportValue}>{stats.totalBooks}</Text>
          </View>
          <View style={s.reportRow}>
            <Text style={s.reportLabel}>Total Registered Students</Text>
            <Text style={s.reportValue}>{stats.activeStudents}</Text>
          </View>
          <View style={s.reportRow}>
            <Text style={s.reportLabel}>Total Active Borrowings</Text>
            <Text style={s.reportValue}>{stats.issuedBooks}</Text>
          </View>
          <View style={s.reportRow}>
            <Text style={s.reportLabel}>Total Returned Books</Text>
            <Text style={s.reportValue}>{stats.totalReturned}</Text>
          </View>
          <View style={s.reportRow}>
            <Text style={s.reportLabel}>Total Overdue Books</Text>
            <Text style={s.reportValue}>{stats.totalOverdue}</Text>
          </View>
          <View style={s.reportRow}>
            <Text style={s.reportLabel}>Total Reservations</Text>
            <Text style={s.reportValue}>{stats.totalReservations}</Text>
          </View>
          <View style={s.reportRow}>
            <Text style={s.reportLabel}>Total Fines Collected</Text>
            <Text style={[s.reportValue, { color: AdminColors.green }]}>₹{stats.totalFines}</Text>
          </View>
          <View style={s.reportRow}>
            <Text style={s.reportLabel}>Active Blacklisted Students</Text>
            <Text style={[s.reportValue, { color: AdminColors.red }]}>{stats.blacklistedStudents}</Text>
          </View>
        </View>

        {/* Department Statistics */}
        <View style={s.section}>
          <Text style={s.secTitle}>Department Statistics</Text>
          <Text style={s.secSub}>Books issued by department</Text>
          {departmentStats.length === 0 ? (
            <Text style={s.emptyText}>No department statistics available.</Text>
          ) : (
            departmentStats.map((dept, i) => {
              const pct = dept.total > 0 ? Math.round((dept.issued / dept.total) * 100) : 0;
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
            })
          )}
        </View>

        {/* Most Borrowed Books */}
        <View style={s.section}>
          <Text style={s.secTitle}>Most Borrowed Books</Text>
          <Text style={s.secSub}>Top list by borrowing frequency</Text>
          {mostBorrowed.length === 0 ? (
            <Text style={s.emptyText}>No borrow history recorded yet.</Text>
          ) : (
            mostBorrowed.map((book, i) => (
              <View key={book.bookId + '-' + i} style={[s.bookRow, i < mostBorrowed.length - 1 && s.bookBorder]}>
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
            ))
          )}
        </View>

        {/* Monthly Summary */}
        <View style={s.section}>
          <Text style={s.secTitle}>Monthly Summary</Text>
          <Text style={s.secSub}>Current month compared to previous</Text>
          <View style={s.monthGrid}>
            {monthlyStats.map((stat, i) => {
              const isUp = stat.change.startsWith('+');
              return (
                <View key={i} style={s.monthCard}>
                  <Text style={s.monthLabel}>{stat.label}</Text>
                  <Text style={s.monthVal}>{stat.value}</Text>
                  <View style={s.changeRow}>
                    <TrendingUp size={12} color={isUp ? AdminColors.green : AdminColors.red} style={{ transform: [{ rotate: isUp ? '0deg' : '180deg' }] }} />
                    <Text style={[s.changeText, { color: isUp ? AdminColors.green : AdminColors.red }]}>{stat.change}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Export */}
        <View style={s.section}>
          <Text style={s.secTitle}>Export Reports</Text>
          <Text style={s.secSub}>Download detailed reports in PDF format</Text>
          {[
            { label: 'Books Report', sub: 'Complete inventory and circulation data', icon: BookOpen, type: 'books' },
            { label: 'Students Report', sub: 'Student activity and borrowing history', icon: Users, type: 'students' },
            { label: 'Financial Report', sub: 'Fine collection and payment summary', icon: DollarSign, type: 'financial' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={s.exportBtn} onPress={() => handleExportPDF(item.type)} activeOpacity={0.7} disabled={isExporting}>
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
  emptyText: { fontSize: 13, color: AdminColors.textMuted, textAlign: 'center', marginVertical: 10 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AdminColors.border },
  reportLabel: { fontSize: 13, fontWeight: '500', color: AdminColors.textPrimary },
  reportValue: { fontSize: 14, fontWeight: '700', color: AdminColors.navy },
});

export default ReportsScreen;
