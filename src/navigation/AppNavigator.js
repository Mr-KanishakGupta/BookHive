import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import StudentTabs from './StudentTabs';
import AdminStack from './AdminStack';

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : user.role === 'admin' ? (
        <AdminStack />
      ) : (
        <StudentTabs />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
