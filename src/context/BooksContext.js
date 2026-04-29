import React, { createContext, useContext, useState, useCallback } from 'react';
import * as bookService from '../services/bookService';

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
      const data = await bookService.getActiveBorrows(studentId);
      setActiveBorrows(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBorrowHistory = useCallback(async (studentId) => {
    setIsLoading(true);
    try {
      const data = await bookService.getBorrowHistory(studentId);
      setBorrowHistory(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFines = useCallback(async (studentId) => {
    try {
      const data = await bookService.getStudentFines(studentId);
      setFines(data);
    } catch (e) { /* ignore */ }
  }, []);

  const requestIssue = useCallback(async (studentId, bookId) => {
    return await bookService.requestIssue(studentId, bookId);
  }, []);

  const advanceReserve = useCallback(async (studentId, bookId) => {
    return await bookService.advanceReserve(studentId, bookId);
  }, []);

  const extendBorrow = useCallback(async (borrowRecordId) => {
    return await bookService.extendBorrow(borrowRecordId);
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
