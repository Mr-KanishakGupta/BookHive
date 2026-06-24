import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  SafeAreaView, ScrollView,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  LayoutDashboard, BookOpen, Users, BookPlus,
  ClipboardList, RotateCcw, DollarSign, BarChart3,
  LogOut, Menu, Settings
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { AdminColors } from '../theme/colors';
import { Typography, Spacing, BorderRadius } from '../theme/typography';

// Local assets
const BMSU_LOGO = require('../BMSU _logo.png');

// Screens
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ManageBooksScreen from '../screens/admin/ManageBooksScreen';
import StudentsScreen from '../screens/admin/StudentsScreen';
import IssueBookScreen from '../screens/admin/IssueBookScreen';
import RequestsScreen from '../screens/admin/RequestsScreen';
import ReturnsScreen from '../screens/admin/ReturnsScreen';
import FinesScreen from '../screens/admin/FinesScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import AddBookScreen from '../screens/admin/AddBookScreen';
import EditBookScreen from '../screens/admin/EditBookScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

const Drawer = createDrawerNavigator();

const DRAWER_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, component: AdminDashboardScreen },
  { name: 'ManageBooks', icon: BookOpen, component: ManageBooksScreen, label: 'Manage Books' },
  { name: 'Students', icon: Users, component: StudentsScreen },
  { name: 'IssueBook', icon: BookPlus, component: IssueBookScreen, label: 'Issue Book' },
  { name: 'Requests', icon: ClipboardList, component: RequestsScreen },
  { name: 'Returns', icon: RotateCcw, component: ReturnsScreen },
  { name: 'Fines', icon: DollarSign, component: FinesScreen },
  { name: 'Reports', icon: BarChart3, component: ReportsScreen },
];

const CustomDrawerContent = ({ state, navigation }) => {
  const { logout, user } = useAuth();
  const activeRoute = state.routes[state.index]?.name;

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Image 
          source={BMSU_LOGO} 
          style={styles.profileImage} 
        />
        <View style={{ marginLeft: 16 }}>
          <Text style={styles.drawerTitle}>{user?.name || 'Alex Admin'}</Text>
          <Text style={styles.drawerSubtitle}>Administrator</Text>
        </View>
      </View>

      <ScrollView style={styles.drawerMenu} showsVerticalScrollIndicator={false}>
        {DRAWER_ITEMS.map((item) => {
          const isActive = activeRoute === item.name;
          const Icon = item.icon;
          const label = item.label || item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.drawerItem,
                isActive && styles.drawerItemActive,
              ]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <Icon
                size={22}
                color={isActive ? AdminColors.navy : AdminColors.navy}
              />
              <Text style={[
                styles.drawerItemText,
                isActive && styles.drawerItemTextActive,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.footerButton} activeOpacity={0.7} onPress={() => navigation.navigate('AdminSettings')}>
          <Settings size={20} color={AdminColors.navy} />
          <Text style={styles.footerText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => logout()}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={AdminColors.navy} />
          <Text style={styles.footerText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const AdminStack = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280, // Slightly wider drawer
          backgroundColor: '#FFFFFF',
        },
        swipeEnabled: true,
      }}
    >
      {DRAWER_ITEMS.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={item.component}
        />
      ))}
      {/* Hidden screen — not shown in drawer sidebar */}
      <Drawer.Screen
        name="AddBook"
        component={AddBookScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          swipeEnabled: false,
        }}
      />
      <Drawer.Screen
        name="EditBook"
        component={EditBookScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          swipeEnabled: false,
        }}
      />
      <Drawer.Screen
        name="AdminSettings"
        component={AdminSettingsScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          swipeEnabled: false,
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: AdminColors.white,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AdminColors.navy,
  },
  drawerSubtitle: {
    fontSize: 14,
    color: AdminColors.textSecondary,
    marginTop: 2,
  },
  drawerMenu: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#E8F0F8', // Light blue tint
  },
  drawerItemActive: {
    backgroundColor: '#C5DDF5', // Slightly darker blue tint for active
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: AdminColors.navy,
    marginLeft: 16,
  },
  drawerItemTextActive: {
    fontWeight: '600',
  },
  drawerFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8F0F8',
  },
  footerText: {
    fontSize: 15,
    fontWeight: '500',
    color: AdminColors.navy,
    marginLeft: 8,
  },
});

export default AdminStack;
