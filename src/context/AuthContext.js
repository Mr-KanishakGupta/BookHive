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
          // Check if admin
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          if (adminDoc.exists() || firebaseUser.email === 'admin@bmsce.ac.in') {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'admin',
              name: adminDoc.exists() ? adminDoc.data().name : 'Library Admin',
            });
          } else {
            // Must be student, but we need library_card_id etc.
            // Since we stored authUid on student doc during signup, we need a way to look them up.
            // Or we can just use the login flow to set user state and ignore onAuthStateChanged for students 
            // if we don't have a reverse lookup.
            // Let's assume login() sets the context. This listener is mostly for re-auth on app launch.
            // For now, if student, we'll try to find them by email
            const { collection, query, where, getDocs } = require('firebase/firestore');
            const q = query(collection(db, 'students'), where('college_id', '==', firebaseUser.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setUser({
                    ...querySnapshot.docs[0].data(),
                    role: 'student',
                    uid: firebaseUser.uid
                });
            } else {
                setUser(null); // Unknown user
            }
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

  const adminLogin = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const adminData = await authService.adminLogin(email, password);
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
