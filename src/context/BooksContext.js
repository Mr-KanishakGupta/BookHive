import React, { createContext, useContext, useState, useCallback } from 'react';
import * as bookService from '../services/bookService';
import * as borrowService from '../services/borrowService';
import * as fineService from '../services/fineService';

const BooksContext = createContext();

export const BooksProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [fines, setFines] = useState({ records: [], totalFine: 0 });
  const [recommended, setRecommended] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [popular, setPopular] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await bookService.getBooks();
      setBooks(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rec, recent, pop] = await Promise.all([
        bookService.getRecommendedBooks(),
        bookService.getRecentlyAddedBooks(),
        bookService.getPopularBooks(),
      ]);
      setRecommended(rec);
      setRecentlyAdded(recent);
      setPopular(pop);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchBooksAction = useCallback(async (query, filterType) => {
    setIsLoading(true);
    try {
      const results = await bookService.searchBooks(query, filterType);
      setSearchResults(results);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActiveBorrows = useCallback(async (studentId) => {
    setIsLoading(true);
    try {
      const data = await borrowService.getActiveBorrows(studentId);
      setActiveBorrows(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBorrowHistory = useCallback(async (studentId) => {
    setIsLoading(true);
    try {
      const data = await borrowService.getBorrowHistory(studentId);
      setBorrowHistory(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFines = useCallback(async (studentId) => {
    try {
      const data = await fineService.getStudentFines(studentId);
      setFines(data);
    } catch (e) { /* ignore */ }
  }, []);

  const requestIssue = useCallback(async (studentId, bookId) => {
    if (!studentId) throw new Error('Student ID is missing. Please log out and log back in.');
    if (!bookId) throw new Error('Book ID is missing.');
    return await borrowService.requestBorrow(studentId, bookId);
  }, []);

  const advanceReserve = useCallback(async (studentId, bookId) => {
    // advanceReserve was removed from spec, leaving as a placeholder or you can implement it later
    // return await bookService.advanceReserve(studentId, bookId);
    throw new Error('Advance reservations are currently disabled in the new system.');
  }, []);

  const extendBorrow = useCallback(async (borrowRecordId, studentId, reason = '') => {
    if (!borrowRecordId) throw new Error('Borrow record ID is missing.');
    if (!studentId) throw new Error('Student ID is missing. Please log out and log back in.');
    return await borrowService.requestExtension(borrowRecordId, studentId, reason);
  }, []);

  return (
    <BooksContext.Provider value={{
      books,
      searchResults,
      activeBorrows,
      borrowHistory,
      fines,
      recommended,
      recentlyAdded,
      popular,
      isLoading,
      loadBooks,
      loadHomeData,
      searchBooksAction,
      loadActiveBorrows,
      loadBorrowHistory,
      loadFines,
      requestIssue,
      advanceReserve,
      extendBorrow,
    }}>
      {children}
    </BooksContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BooksContext);
  if (!context) throw new Error('useBooks must be used within BooksProvider');
  return context;
};
