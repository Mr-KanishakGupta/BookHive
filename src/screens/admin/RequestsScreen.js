import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Menu, Clock, CheckCircle, XCircle, User, BookOpen, Calendar, Mail, RotateCcw } from 'lucide-react-native';
import { AdminColors } from '../../theme/colors';
import {
  getPendingRequests, approveBorrow, rejectBorrow,
  getPendingExtensions, approveExtension, rejectExtension,
} from '../../services/borrowService';

const RequestsScreen = ({ navigation }) => {
  const [tab, setTab] = useState('borrow');
  const [borrowReqs, setBorrowReqs] = useState([]);
  const [extensionReqs, setExtensionReqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const [borrows, extensions] = await Promise.all([
        getPendingRequests(),
        getPendingExtensions(),
      ]);
      setBorrowReqs(borrows);
      setExtensionReqs(extensions);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchRequests);
    return unsubscribe;
  }, [navigation]);

  // ─── Borrow Handlers ──────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await approveBorrow(id, 'admin');
      Alert.alert('Approved', 'Borrow request approved successfully.');
      fetchRequests();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectBorrow(id);
      Alert.alert('Rejected', 'Borrow request rejected.');
      fetchRequests();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // ─── Extension Handlers ───────────────────────────────────────────────
  const handleApproveExtension = async (id) => {
    try {
      const result = await approveExtension(id);
      Alert.alert('Approved', `Extension approved. New due date: ${new Date(result.newDueDate).toLocaleDateString()}`);
      fetchRequests();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleRejectExtension = async (id) => {
    try {
      await rejectExtension(id);
      Alert.alert('Rejected', 'Extension request rejected.');
      fetchRequests();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // ─── Renderers ────────────────────────────────────────────────────────
  const renderBorrow = ({ item }) => {
    const student = item.student;
    const book = item.book;
    return (
      <View style={s.reqCard}>
        <View style={s.reqTop}>
          <View style={s.reqAvatar}><User size={20} color={AdminColors.navy} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.reqName}>{student?.name || student?.id}</Text>
            <Text style={s.reqEmail}>{student?.college_id || 'N/A'}</Text>
            <View style={s.reqRow}><BookOpen size={13} color={AdminColors.textMuted} /><Text style={s.reqInfo}>Book: {book?.title}</Text></View>
            <View style={s.reqRow}><Calendar size={13} color={AdminColors.textMuted} /><Text style={s.reqInfo}>Request Date: {new Date(item.createdAt).toLocaleDateString()}</Text></View>
          </View>
          <View style={s.reqActions}>
            <TouchableOpacity style={s.approveBtn} onPress={() => handleApprove(item.id)}>
              <CheckCircle size={16} color="#fff" /><Text style={s.appText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(item.id)}>
              <XCircle size={16} color={AdminColors.red} /><Text style={s.rejText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.reqNote}>
          <Mail size={12} color={AdminColors.textMuted} />
          <Text style={s.noteText}>Student will be notified automatically</Text>
        </View>
      </View>
    );
  };

  const renderExtension = ({ item }) => {
    const student = item.student;
    const book = item.book;
    const currentDue = item.currentDueDate
      ? new Date(item.currentDueDate).toLocaleDateString()
      : 'N/A';

    return (
      <View style={s.reqCard}>
        <View style={s.reqTop}>
          <View style={[s.reqAvatar, { backgroundColor: AdminColors.orangeLight }]}>
            <RotateCcw size={20} color={AdminColors.orange} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.reqName}>{student?.name || student?.id}</Text>
            <Text style={s.reqEmail}>Library Card: {student?.id || 'N/A'}</Text>
            <View style={s.reqRow}><BookOpen size={13} color={AdminColors.textMuted} /><Text style={s.reqInfo}>Book: {book?.title || item.bookId}</Text></View>
            <View style={s.reqRow}><Calendar size={13} color={AdminColors.textMuted} /><Text style={s.reqInfo}>Current Due: {currentDue}</Text></View>
            {item.reason ? <Text style={s.reason}>Reason: "{item.reason}"</Text> : null}
          </View>
          <View style={s.reqActions}>
            <TouchableOpacity style={s.approveBtn} onPress={() => handleApproveExtension(item.id)}>
              <CheckCircle size={16} color="#fff" /><Text style={s.appText}>Extend</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.rejectBtn} onPress={() => handleRejectExtension(item.id)}>
              <XCircle size={16} color={AdminColors.red} /><Text style={s.rejText}>Deny</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.reqNote}>
          <RotateCcw size={12} color={AdminColors.textMuted} />
          <Text style={s.noteText}>Extends due date by 7 days if approved</Text>
        </View>
      </View>
    );
  };

  const data = tab === 'borrow' ? borrowReqs : extensionReqs;
  const pendingCount = tab === 'borrow' ? borrowReqs.length : extensionReqs.length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}><Menu size={24} color={AdminColors.navy} /></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={s.title}>Requests Management</Text>
          <Text style={s.sub}>Review and manage student requests</Text>
        </View>
      </View>
      
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'borrow' && s.tabActive]} onPress={() => setTab('borrow')}>
          <Text style={[s.tabText, tab === 'borrow' && s.tabTextActive]}>Borrow Requests</Text>
          <View style={[s.tabBadge, tab === 'borrow' && s.tabBadgeActive]}><Text style={[s.tabBadgeText, tab === 'borrow' && { color: '#fff' }]}>{borrowReqs.length}</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'extension' && s.tabActive]} onPress={() => setTab('extension')}>
          <Text style={[s.tabText, tab === 'extension' && s.tabTextActive]}>Extension Requests</Text>
          <View style={[s.tabBadge, tab === 'extension' && s.tabBadgeActive]}><Text style={[s.tabBadgeText, tab === 'extension' && { color: '#fff' }]}>{extensionReqs.length}</Text></View>
        </TouchableOpacity>
      </View>
      
      {pendingCount > 0 && (
        <View style={s.alert}>
          <Clock size={18} color={AdminColors.orange} />
          <View style={{ marginLeft: 10 }}>
            <Text style={s.alertTitle}>{pendingCount} Pending {tab === 'borrow' ? 'Borrow' : 'Extension'} Requests</Text>
            <Text style={s.alertSub}>Review these requests as soon as possible</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AdminColors.navy} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={i => i.id}
          renderItem={tab === 'borrow' ? renderBorrow : renderExtension}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>No pending {tab} requests</Text></View>}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: AdminColors.bgGrey },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  title: { fontSize: 22, fontWeight: '700', color: AdminColors.textPrimary },
  sub: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: AdminColors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: AdminColors.navy },
  tabText: { fontSize: 13, fontWeight: '600', color: AdminColors.textSecondary },
  tabTextActive: { color: '#fff' },
  tabBadge: { marginLeft: 6, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: AdminColors.bgGrey },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: AdminColors.textSecondary },
  alert: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 14, backgroundColor: AdminColors.orangeLight, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: AdminColors.orange },
  alertTitle: { fontSize: 14, fontWeight: '700', color: AdminColors.orange },
  alertSub: { fontSize: 11, color: AdminColors.orange, marginTop: 1, opacity: 0.8 },
  reqCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 1 },
  reqTop: { flexDirection: 'row', alignItems: 'flex-start' },
  reqAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: AdminColors.blueLight, justifyContent: 'center', alignItems: 'center' },
  reqName: { fontSize: 15, fontWeight: '700', color: AdminColors.textPrimary },
  reqEmail: { fontSize: 12, color: AdminColors.textSecondary, marginTop: 1 },
  reqRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  reqInfo: { fontSize: 12, color: AdminColors.textSecondary, marginLeft: 6 },
  reason: { fontSize: 12, color: AdminColors.textMuted, marginTop: 4, fontStyle: 'italic' },
  reqActions: { gap: 6 },
  approveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: AdminColors.green, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  appText: { fontSize: 12, fontWeight: '600', color: '#fff', marginLeft: 4 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: AdminColors.red, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  rejText: { fontSize: 12, fontWeight: '600', color: AdminColors.red, marginLeft: 4 },
  reqNote: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: AdminColors.border },
  noteText: { fontSize: 11, color: AdminColors.textMuted, marginLeft: 6 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: AdminColors.textMuted },
});

export default RequestsScreen;
