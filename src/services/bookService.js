import { BOOKS, BORROW_RECORDS, ISSUE_REQUESTS, ADVANCE_RESERVATIONS } from './mockData';

// Get all books
export const getBooks = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...BOOKS]), 300);
  });
};

// Search books by query + filter type
export const searchBooks = (query, filterType = 'title') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const q = query.toLowerCase();
      const results = BOOKS.filter(book => {
        switch (filterType) {
          case 'title': return book.title.toLowerCase().includes(q);
          case 'author': return book.author.toLowerCase().includes(q);
          case 'genre': return book.genre.toLowerCase().includes(q);
          case 'bookCode': return book.bookCode.toLowerCase().includes(q);
          default: return (
            book.title.toLowerCase().includes(q) ||
            book.author.toLowerCase().includes(q) ||
            book.genre.toLowerCase().includes(q) ||
            book.bookCode.toLowerCase().includes(q)
          );
        }
      });
      resolve(results);
    }, 300);
  });
};

// Get book details
export const getBookById = (bookId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const book = BOOKS.find(b => b.id === bookId);
      if (book) resolve({ ...book });
      else reject(new Error('Book not found'));
    }, 200);
  });
};

// Request book issue
export const requestIssue = (studentId, bookId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const book = BOOKS.find(b => b.id === bookId);
      if (!book) return reject(new Error('Book not found'));
      if (book.availableCopies <= 0) return reject(new Error('No copies available'));

      const existingRequest = ISSUE_REQUESTS.find(
        ir => ir.studentId === studentId && ir.bookId === bookId && ir.status === 'pending'
      );
      if (existingRequest) return reject(new Error('You already have a pending request for this book'));

      resolve({ success: true, message: 'Issue request submitted successfully!' });
    }, 500);
  });
};

// Advance reserve
export const advanceReserve = (studentId, bookId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const book = BOOKS.find(b => b.id === bookId);
      if (!book) return reject(new Error('Book not found'));
      if (book.availableCopies > 0) return reject(new Error('Book is available, request issue instead'));
      if (book.reservedBy) return reject(new Error('This book is already reserved by another student'));

      resolve({ success: true, message: 'Advance reservation successful! You will be notified when available.' });
    }, 500);
  });
};

// Extend borrow period
export const extendBorrow = (borrowRecordId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const record = BORROW_RECORDS.find(br => br.id === borrowRecordId);
      if (!record) return reject(new Error('Borrow record not found'));
      if (record.status !== 'active') return reject(new Error('Cannot extend: book is overdue'));

      const book = BOOKS.find(b => b.id === record.bookId);
      if (book && book.availableCopies > 0) {
        resolve({ success: true, message: 'Borrow period extended by 7 days!' });
      } else {
        reject(new Error('Cannot extend: no additional copies available'));
      }
    }, 500);
  });
};

// Get student borrow history
export const getBorrowHistory = (studentId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = BORROW_RECORDS.filter(br => br.studentId === studentId).map(br => {
        const book = BOOKS.find(b => b.id === br.bookId);
        return { ...br, book };
      });
      resolve(records);
    }, 300);
  });
};

// Get active borrows
export const getActiveBorrows = (studentId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = BORROW_RECORDS.filter(
        br => br.studentId === studentId && (br.status === 'active' || br.status === 'overdue')
      ).map(br => {
        const book = BOOKS.find(b => b.id === br.bookId);
        return { ...br, book };
      });
      resolve(records);
    }, 300);
  });
};

// Get student fines
export const getStudentFines = (studentId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = BORROW_RECORDS.filter(
        br => br.studentId === studentId && br.fine > 0
      ).map(br => {
        const book = BOOKS.find(b => b.id === br.bookId);
        return { ...br, book };
      });
      const totalFine = records.reduce((sum, r) => sum + r.fine, 0);
      resolve({ records, totalFine });
    }, 300);
  });
};

// Admin functions

// Get pending issue requests
export const getPendingIssueRequests = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const requests = ISSUE_REQUESTS.filter(ir => ir.status === 'pending').map(ir => {
        const book = BOOKS.find(b => b.id === ir.bookId);
        const student = require('./mockData').STUDENTS.find(s => s.id === ir.studentId);
        return { ...ir, book, student };
      });
      resolve(requests);
    }, 300);
  });
};

// Get advance reservations
export const getAdvanceReservations = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const reservations = ADVANCE_RESERVATIONS.map(ar => {
        const book = BOOKS.find(b => b.id === ar.bookId);
        const student = require('./mockData').STUDENTS.find(s => s.id === ar.studentId);
        return { ...ar, book, student };
      });
      resolve(reservations);
    }, 300);
  });
};

// Get recommended books (random selection)
export const getRecommendedBooks = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const shuffled = [...BOOKS].sort(() => 0.5 - Math.random());
      resolve(shuffled.slice(0, 6));
    }, 300);
  });
};

// Get recently added books (by year)
export const getRecentlyAddedBooks = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sorted = [...BOOKS].sort((a, b) => b.year - a.year);
      resolve(sorted.slice(0, 6));
    }, 300);
  });
};

// Get popular books (ones with less available copies = more borrowed)
export const getPopularBooks = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sorted = [...BOOKS].sort((a, b) =>
        (a.availableCopies / a.totalCopies) - (b.availableCopies / b.totalCopies)
      );
      resolve(sorted.slice(0, 6));
    }, 300);
  });
};
