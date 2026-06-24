import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Admin no longer uses Firebase Auth, so any authenticated user is a student.
          // Try to find them by email in students collection.
          const { collection, query, where, getDocs } = require('firebase/firestore');
          const q = query(collection(db, 'students'), where('college_id', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              const docSnap = querySnapshot.docs[0];
              const data = docSnap.data();
              setUser({
                  ...data,
                  id: docSnap.id,
                  libraryCardNumber: docSnap.id,
                  email: data.college_id,
                  role: 'student',
                  uid: firebaseUser.uid
              });
          } else {
              setUser(null);
          }
        } catch (e) {
          console.error('Error fetching user details:', e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (identifier, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authService.login(identifier, password);
      setUser(userData);
      return userData;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (password) => {
    setIsLoading(true);
    setError(null);
    try {
      const adminData = await authService.adminLogin(password);
      setUser(adminData);
      return adminData;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const requestOTP = async (cardNumber) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.requestOTP(cardNumber);
      return res;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (cardNumber, otp, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authService.signup(cardNumber, otp, password);
      setUser(userData);
      return userData;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentByCard = async (cardNumber) => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await authService.fetchStudentByCard(cardNumber);
      return info;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      login,
      adminLogin,
      requestOTP,
      signup,
      fetchStudentByCard,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
