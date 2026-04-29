import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Typography } from '../theme/typography';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MyBooksScreen from '../screens/MyBooksScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import BorrowHistoryScreen from '../screens/BorrowHistoryScreen';
import QRCodeScreen from '../screens/QRCodeScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Nested Stacks
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
    <Stack.Screen name="QRCode" component={QRCodeScreen} />
  </Stack.Navigator>
);

const SearchStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}>
    <Stack.Screen name="SearchMain" component={SearchScreen} />
    <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
  </Stack.Navigator>
);

const MyBooksStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}>
    <Stack.Screen name="MyBooksMain" component={MyBooksScreen} />
    <Stack.Screen name="BorrowHistory" component={BorrowHistoryScreen} />
    <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="BorrowHistory" component={BorrowHistoryScreen} />
    <Stack.Screen name="QRCode" component={QRCodeScreen} />
  </Stack.Navigator>
);

const StudentTabs = () => {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
            case 'Search': iconName = focused ? 'search' : 'search-outline'; break;
            case 'MyBooks': iconName = focused ? 'book' : 'book-outline'; break;
            case 'Notifications': iconName = focused ? 'notifications' : 'notifications-outline'; break;
            case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          ...Typography.tabLabel,
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.error,
          fontSize: 10,
          minWidth: 18,
          height: 18,
          lineHeight: 18,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen name="MyBooks" component={MyBooksStack} options={{ tabBarLabel: 'My Books' }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default StudentTabs;
