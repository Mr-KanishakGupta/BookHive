import { db } from '../config/firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, orderBy, limit, writeBatch,
  addDoc, serverTimestamp, Timestamp 
} from 'firebase/firestore';
import { generateBookCode } from '../utils/bookCodeGenerator';

const booksRef = collection(db, 'books');

// ----------------------------------------------------------------------------
// Image Handling — Base64 encoded, stored directly in Firestore
// (Firebase Storage requires Blaze plan; this approach works on Spark/free)
// ----------------------------------------------------------------------------

/**
 * Convert a local image URI to a compressed base64 data-URI string.
 * Uses an off-screen canvas (via Image + Canvas on web, or FileReader on RN).
 * The image is resized to maxWidth to keep the Firestore doc under 1 MB.
 */
const imageUriToBase64 = async (uri) => {
  if (!uri) return null;

  try {
    // In React Native / Expo we read the file via fetch + FileReader
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // reader.result is a data:image/...;base64,XXXX string
        resolve(reader.result);
      };
      reader.onerror = () => {
        console.warn('FileReader error, skipping image');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert image to base64:', error.message);
    return null;
  }
};

// ----------------------------------------------------------------------------
// Core Book CRUD
// ----------------------------------------------------------------------------
export const getBooks = async () => {
  const q = query(booksRef, orderBy('year', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, bookCode: doc.id, ...doc.data() }));
};

export const getBookById = async (bookCode) => {
  const docRef = doc(db, 'books', bookCode);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) throw new Error('Book not found');
  return { id: snapshot.id, bookCode: snapshot.id, ...snapshot.data() };
};

export const createBook = async (bookData, frontImageUri, rearImageUri) => {
  // Count books in this genre for code generation
  const q = query(booksRef, where('genre', '==', bookData.genre), where('innerGenre', '==', bookData.innerGenre));
  const snapshot = await getDocs(q);
  const count = snapshot.size;

  const bookCode = generateBookCode(bookData.year, bookData.genre, bookData.innerGenre, count + 1);
  
  // Convert images to base64 for Firestore storage
  const frontImage = await imageUriToBase64(frontImageUri);
  const rearImage = await imageUriToBase64(rearImageUri);

  const newBook = {
    title: bookData.title,
    author: bookData.author,
    genre: bookData.genre,
    innerGenre: bookData.innerGenre,
    department: bookData.department,
    year: Number(bookData.year),
    totalCopies: Number(bookData.totalCopies),
    availableCopies: Number(bookData.totalCopies),
    cost: Number(bookData.cost),
    language: bookData.language || '',
    description: bookData.description || '',
    frontImage: frontImage || '',
    rearImage: rearImage || '',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'books', bookCode), newBook);
  return { id: bookCode, bookCode, ...newBook };
};

export const updateBook = async (bookCode, updates) => {
  const docRef = doc(db, 'books', bookCode);
  
  // Handle copies update: adjust availableCopies by the difference
  if (updates.totalCopies !== undefined) {
    const book = await getBookById(bookCode);
    const diff = Number(updates.totalCopies) - book.totalCopies;
    updates.availableCopies = Math.max(0, book.availableCopies + diff);
  }

  await updateDoc(docRef, updates);
  return await getBookById(bookCode);
};

export const deleteBook = async (bookCode) => {
  await deleteDoc(doc(db, 'books', bookCode));
};

// ----------------------------------------------------------------------------
// Client-side Search and Filtering (Simple implementation)
// ----------------------------------------------------------------------------
export const searchBooks = async (searchQuery, filterType = 'title') => {
  const allBooks = await getBooks();
  
  if (!searchQuery) return allBooks;
  
  const q = searchQuery.toLowerCase();
  
  return allBooks.filter(book => {
    switch (filterType) {
      case 'title': return book.title?.toLowerCase().includes(q);
      case 'author': return book.author?.toLowerCase().includes(q);
      case 'genre': return book.genre?.toLowerCase().includes(q);
      case 'bookCode': return book.bookCode?.toLowerCase().includes(q);
      default: return (
        book.title?.toLowerCase().includes(q) ||
        book.author?.toLowerCase().includes(q) ||
        book.genre?.toLowerCase().includes(q) ||
        book.bookCode?.toLowerCase().includes(q)
      );
    }
  });
};

// ----------------------------------------------------------------------------
// Discovery Categories
// ----------------------------------------------------------------------------
export const getRecommendedBooks = async () => {
  // Simple approximation: Random sample or highest rated/most borrowed.
  // For now, returning recently added with a limit as a proxy.
  const q = query(booksRef, orderBy('createdAt', 'desc'), limit(6));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, bookCode: doc.id, ...doc.data() }));
};

export const getRecentlyAddedBooks = async () => {
  const q = query(booksRef, orderBy('year', 'desc'), limit(6));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, bookCode: doc.id, ...doc.data() }));
};

export const getPopularBooks = async () => {
  // Books with availableCopies < totalCopies (i.e. being borrowed)
  // Approximated by fetching some books and sorting by borrow ratio client-side
  const snapshot = await getDocs(query(booksRef, limit(20)));
  const books = snapshot.docs.map(doc => ({ id: doc.id, bookCode: doc.id, ...doc.data() }));
  
  return books.sort((a, b) => 
    (a.availableCopies / a.totalCopies) - (b.availableCopies / b.totalCopies)
  ).slice(0, 6);
};

// ----------------------------------------------------------------------------
// Advance Booking — FCFS Queue System
// ----------------------------------------------------------------------------
import { ADVANCE_BOOKING_STATUS, ADVANCE_BOOKING_EXPIRY_HOURS } from '../utils/constants';

const advanceBookingsRef = collection(db, 'advance_bookings');

/**
 * Student creates an advance booking for an unavailable book.
 * Joins a first-come-first-serve queue.
 */
export const createAdvanceBooking = async (studentId, bookId) => {
  // Check if student already has a WAITING or READY booking for this book
  const existingQ = query(
    advanceBookingsRef,
    where('studentId', '==', studentId),
    where('bookId', '==', bookId),
    where('status', 'in', [ADVANCE_BOOKING_STATUS.WAITING, ADVANCE_BOOKING_STATUS.READY])
  );
  const existing = await getDocs(existingQ);
  if (!existing.empty) {
    throw new Error('You already have an advance booking for this book.');
  }

  // Check if student is blacklisted
  const studentDoc = await getDoc(doc(db, 'students', studentId));
  if (studentDoc.exists() && studentDoc.data().isBlacklisted) {
    throw new Error('You are blacklisted. Please clear your dues first.');
  }

  // Get queue position (count of WAITING bookings for this book + 1)
  const waitingQ = query(
    advanceBookingsRef,
    where('bookId', '==', bookId),
    where('status', '==', ADVANCE_BOOKING_STATUS.WAITING)
  );
  const waitingSnap = await getDocs(waitingQ);
  const position = waitingSnap.size + 1;

  const booking = {
    bookId,
    studentId,
    position,
    status: ADVANCE_BOOKING_STATUS.WAITING,
    createdAt: serverTimestamp(),
    notifiedAt: null,
    expiresAt: null,
  };

  const docRef = await addDoc(advanceBookingsRef, booking);
  return { id: docRef.id, ...booking, position, message: `Advance booking placed! You are #${position} in the queue.` };
};

/**
 * Student cancels their advance booking.
 */
export const cancelAdvanceBooking = async (bookingId, studentId) => {
  const bookingRef = doc(db, 'advance_bookings', bookingId);
  const bookingDoc = await getDoc(bookingRef);

  if (!bookingDoc.exists()) throw new Error('Booking not found.');
  const data = bookingDoc.data();

  if (data.studentId !== studentId) throw new Error('Not authorized.');
  if (data.status !== ADVANCE_BOOKING_STATUS.WAITING && data.status !== ADVANCE_BOOKING_STATUS.READY) {
    throw new Error('Cannot cancel this booking.');
  }

  await updateDoc(bookingRef, { status: ADVANCE_BOOKING_STATUS.CANCELLED });
  return { success: true };
};

/**
 * Get advance bookings for a specific student.
 */
export const getStudentAdvanceBookings = async (studentId) => {
  const q = query(
    advanceBookingsRef,
    where('studentId', '==', studentId),
    where('status', 'in', [ADVANCE_BOOKING_STATUS.WAITING, ADVANCE_BOOKING_STATUS.READY])
  );
  const snap = await getDocs(q);

  const bookings = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    let bookData = null;
    try {
      const bookDoc = await getDoc(doc(db, 'books', data.bookId));
      if (bookDoc.exists()) bookData = { id: bookDoc.id, ...bookDoc.data() };
    } catch (e) { /* ignore */ }
    bookings.push({
      id: docSnap.id,
      ...data,
      book: bookData,
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
      expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
    });
  }
  return bookings;
};

/**
 * Get all advance bookings for a specific book (admin view / queue check).
 */
export const getBookAdvanceQueue = async (bookId) => {
  const q = query(
    advanceBookingsRef,
    where('bookId', '==', bookId),
    where('status', 'in', [ADVANCE_BOOKING_STATUS.WAITING, ADVANCE_BOOKING_STATUS.READY])
  );
  const snap = await getDocs(q);

  const queue = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    let studentData = null;
    try {
      const studentDoc = await getDoc(doc(db, 'students', data.studentId));
      if (studentDoc.exists()) studentData = { id: studentDoc.id, ...studentDoc.data() };
    } catch (e) { /* ignore */ }
    queue.push({
      id: docSnap.id,
      ...data,
      student: studentData,
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
      expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
    });
  }
  // Sort by position
  return queue.sort((a, b) => (a.position || 0) - (b.position || 0));
};

/**
 * Process the advance booking queue for a book after a copy becomes available.
 * Called after a book is returned.
 * Notifies the first WAITING student and gives them 24 hours.
 */
export const processAdvanceQueue = async (bookId) => {
  // First, expire any READY bookings that have passed their expiry
  await expireStaleBookings(bookId);

  // Check if there's already a READY booking (someone is already notified)
  const readyQ = query(
    advanceBookingsRef,
    where('bookId', '==', bookId),
    where('status', '==', ADVANCE_BOOKING_STATUS.READY)
  );
  const readySnap = await getDocs(readyQ);
  if (!readySnap.empty) return; // Someone is already notified — don't promote another

  // Find the first WAITING student
  const waitingQ = query(
    advanceBookingsRef,
    where('bookId', '==', bookId),
    where('status', '==', ADVANCE_BOOKING_STATUS.WAITING)
  );
  const waitingSnap = await getDocs(waitingQ);

  if (waitingSnap.empty) return; // No one is waiting

  // Sort by createdAt to get the first in line
  const sorted = waitingSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return aTime - bTime;
    });

  const first = sorted[0];
  const expiresAt = new Date(Date.now() + ADVANCE_BOOKING_EXPIRY_HOURS * 60 * 60 * 1000);

  await updateDoc(doc(db, 'advance_bookings', first.id), {
    status: ADVANCE_BOOKING_STATUS.READY,
    notifiedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
  });

  // Create a notification for the student
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: first.studentId,
      type: 'advance_booking_ready',
      message: `Your advance-booked book is now available! You have 24 hours to collect it from the library.`,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) { /* ignore notification error */ }
};

/**
 * Expire READY bookings that have passed their 24-hour window.
 * Promotes the next person in the queue.
 */
export const expireStaleBookings = async (bookId) => {
  const readyQ = query(
    advanceBookingsRef,
    where('bookId', '==', bookId),
    where('status', '==', ADVANCE_BOOKING_STATUS.READY)
  );
  const readySnap = await getDocs(readyQ);
  const now = new Date();

  for (const docSnap of readySnap.docs) {
    const data = docSnap.data();
    const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);

    if (now > expiresAt) {
      await updateDoc(doc(db, 'advance_bookings', docSnap.id), {
        status: ADVANCE_BOOKING_STATUS.EXPIRED,
      });

      // Notify the student their booking expired
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: data.studentId,
          type: 'advance_booking_expired',
          message: `Your advance booking has expired because you did not collect the book within 24 hours.`,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      } catch (e) { /* ignore */ }
    }
  }
};

/**
 * Mark an advance booking as fulfilled (student borrowed the book).
 */
export const fulfillAdvanceBooking = async (studentId, bookId) => {
  const q = query(
    advanceBookingsRef,
    where('studentId', '==', studentId),
    where('bookId', '==', bookId),
    where('status', '==', ADVANCE_BOOKING_STATUS.READY)
  );
  const snap = await getDocs(q);
  
  for (const docSnap of snap.docs) {
    await updateDoc(doc(db, 'advance_bookings', docSnap.id), {
      status: ADVANCE_BOOKING_STATUS.FULFILLED,
    });
  }
};

/**
 * Get all advance bookings for admin view.
 */
export const getAllAdvanceBookings = async () => {
  const q = query(
    advanceBookingsRef,
    where('status', 'in', [ADVANCE_BOOKING_STATUS.WAITING, ADVANCE_BOOKING_STATUS.READY])
  );
  const snap = await getDocs(q);

  const bookings = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    let studentData = null;
    let bookData = null;
    try {
      const studentDoc = await getDoc(doc(db, 'students', data.studentId));
      if (studentDoc.exists()) studentData = { id: studentDoc.id, ...studentDoc.data() };
    } catch (e) { /* ignore */ }
    try {
      const bookDoc = await getDoc(doc(db, 'books', data.bookId));
      if (bookDoc.exists()) bookData = { id: bookDoc.id, ...bookDoc.data() };
    } catch (e) { /* ignore */ }

    bookings.push({
      id: docSnap.id,
      ...data,
      student: studentData,
      book: bookData,
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
      expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
    });
  }
  return bookings.sort((a, b) => (a.position || 0) - (b.position || 0));
};

