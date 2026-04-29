import React, { createContext, useContext, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const signup = async (cardNumber, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authService.signup(cardNumber, password);
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

  const logout = () => {
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
