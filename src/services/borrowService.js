import { db } from '../config/firebase';
import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, 
  deleteDoc, query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { BORROW_STATUS, BORROW_DURATION_DAYS } from '../utils/constants';
import { processAdvanceQueue, fulfillAdvanceBooking } from './bookService';

const borrowRef = collection(db, 'borrow_records');
const dueBooksRef = collection(db, 'due_books');

// ----------------------------------------------------------------------------
// Student Flow
// ----------------------------------------------------------------------------

export const requestBorrow = async (studentId, bookId) => {
  // Check if student is blacklisted
  const studentDoc = await getDoc(doc(db, 'students', studentId));
  if (!studentDoc.exists()) throw new Error('Student not found');
  if (studentDoc.data().isBlacklisted) {
    throw new Error('You are blacklisted. Please clear your dues first.');
  }

  // Check if book has available copies
  const bookDoc = await getDoc(doc(db, 'books', bookId));
  if (!bookDoc.exists()) throw new Error('Book not found');
  if (bookDoc.data().availableCopies <= 0) {
    throw new Error('No copies available');
  }

  // Check for existing pending request for this book
  const existingReqQ = query(
    borrowRef, 
    where('studentId', '==', studentId), 
    where('bookId', '==', bookId),
    where('status', 'in', [BORROW_STATUS.PENDING, BORROW_STATUS.BORROWED])
  );
  const existingReqs = await getDocs(existingReqQ);
  
  if (!existingReqs.empty) {
    throw new Error('You already have a pending or active borrow for this book.');
  }

  // Create PENDING record
  const record = {
    studentId,
    bookId,
    status: BORROW_STATUS.PENDING,
    borrowDate: null,
    dueDate: null,
    returnDate: null,
    fine: 0,
    fineStatus: false,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(borrowRef, record);
  return { id: docRef.id, ...record };
};

export const getBorrowHistory = async (studentId) => {
  const q = query(borrowRef, where('studentId', '==', studentId));
  const snapshot = await getDocs(q);
  
  // We need to fetch book details for each record
  const records = [];
  for (const docSnapshot of snapshot.docs) {
    const recordData = docSnapshot.data();
    let bookData = null;
    try {
        const bookDoc = await getDoc(doc(db, 'books', recordData.bookId));
        if (bookDoc.exists()) bookData = { id: bookDoc.id, ...bookDoc.data() };
    } catch (e) {
        console.error("Error fetching book details", e);
    }
    
    records.push({
      id: docSnapshot.id,
      ...recordData,
      book: bookData,
      // Convert Firestore timestamps to standard dates for UI
      borrowDate: recordData.borrowDate?.toDate?.()?.toISOString(),
      dueDate: recordData.dueDate?.toDate?.()?.toISOString(),
      returnDate: recordData.returnDate?.toDate?.()?.toISOString(),
      createdAt: recordData.createdAt?.toDate?.()?.toISOString()
    });
  }
  
  // Sort by date locally
  return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getActiveBorrows = async (studentId) => {
  const allHistory = await getBorrowHistory(studentId);
  return allHistory.filter(r => r.status === BORROW_STATUS.BORROWED || r.status === BORROW_STATUS.OVERDUE);
};

export const getPendingRequestsForStudent = async (studentId) => {
  const allHistory = await getBorrowHistory(studentId);
  return allHistory.filter(r => r.status === BORROW_STATUS.PENDING);
};

// ----------------------------------------------------------------------------
// Admin Flow
// ----------------------------------------------------------------------------

export const getPendingRequests = async () => {
  const q = query(borrowRef, where('status', '==', BORROW_STATUS.PENDING));
  const snapshot = await getDocs(q);
  
  const requests = [];
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    
    // Fetch related student and book
    const studentDoc = await getDoc(doc(db, 'students', data.studentId));
    const bookDoc = await getDoc(doc(db, 'books', data.bookId));
    
    requests.push({
      id: docSnapshot.id,
      ...data,
      student: studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } : null,
      book: bookDoc.exists() ? { id: bookDoc.id, ...bookDoc.data() } : null,
      createdAt: data.createdAt?.toDate?.()?.toISOString()
    });
  }
  
  return requests;
};

export const approveBorrow = async (borrowRecordId, adminId) => {
  const recordDocRef = doc(db, 'borrow_records', borrowRecordId);
  const recordDoc = await getDoc(recordDocRef);
  
  if (!recordDoc.exists()) throw new Error('Borrow record not found');
  const recordData = recordDoc.data();
  
  if (recordData.status !== BORROW_STATUS.PENDING) {
    throw new Error('Record is not pending');
  }

  const bookDocRef = doc(db, 'books', recordData.bookId);
  const bookDoc = await getDoc(bookDocRef);
  if (!bookDoc.exists() || bookDoc.data().availableCopies <= 0) {
    throw new Error('No copies available to issue');
  }

  // Calculate Dates
  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

  // Update book copies
  await updateDoc(bookDocRef, {
    availableCopies: bookDoc.data().availableCopies - 1
  });

  // Update borrow record
  await updateDoc(recordDocRef, {
    status: BORROW_STATUS.BORROWED,
    borrowDate,
    dueDate,
    approvedBy: adminId
  });

  // Create due_books tracking entry
  await addDoc(dueBooksRef, {
    borrowRecordId,
    bookId: recordData.bookId,
    studentId: recordData.studentId,
    dueDate,
    fine: 0
  });

  // Mark any advance booking as fulfilled
  try {
    await fulfillAdvanceBooking(recordData.studentId, recordData.bookId);
  } catch (e) { /* ignore */ }

  return { success: true };
};

export const rejectBorrow = async (borrowRecordId) => {
  await deleteDoc(doc(db, 'borrow_records', borrowRecordId));
  return { success: true };
};

export const returnBook = async (borrowRecordId) => {
  const recordDocRef = doc(db, 'borrow_records', borrowRecordId);
  const recordDoc = await getDoc(recordDocRef);
  
  if (!recordDoc.exists()) throw new Error('Borrow record not found');
  const recordData = recordDoc.data();
  
  if (recordData.status === BORROW_STATUS.RETURNED) {
    throw new Error('Book already returned');
  }

  // Update book copies
  const bookDocRef = doc(db, 'books', recordData.bookId);
  const bookDoc = await getDoc(bookDocRef);
  if (bookDoc.exists()) {
    await updateDoc(bookDocRef, {
      availableCopies: bookDoc.data().availableCopies + 1
    });
  }

  const returnDate = new Date();

  // Fine calculation happens via Cloud Function, but here we just mark returned
  // If there's an existing fine on the record, it stays on the record until paid.
  await updateDoc(recordDocRef, {
    status: BORROW_STATUS.RETURNED,
    returnDate
  });

  // Note: We don't delete from due_books here if there's an unpaid fine. 
  // It should be deleted when the fine is paid, or if no fine, we delete it now.
  if (recordData.fine === 0) {
     const q = query(dueBooksRef, where('borrowRecordId', '==', borrowRecordId));
     const dueBooksSnap = await getDocs(q);
     dueBooksSnap.forEach(async (docSnap) => {
         await deleteDoc(doc(db, 'due_books', docSnap.id));
     });
  }

  // Process advance booking queue — notify next student in FCFS queue
  try {
    await processAdvanceQueue(recordData.bookId);
  } catch (e) {
    console.error('Error processing advance queue:', e);
  }

  return { success: true, fine: recordData.fine };
};

// ----------------------------------------------------------------------------
// Extension Request Flow
// ----------------------------------------------------------------------------
const extensionRef = collection(db, 'extension_requests');

/**
 * Student requests a due-date extension for an active borrow.
 */
export const requestExtension = async (borrowRecordId, studentId, reason = '') => {
  const recordDoc = await getDoc(doc(db, 'borrow_records', borrowRecordId));
  if (!recordDoc.exists()) throw new Error('Borrow record not found');
  const data = recordDoc.data();

  if (data.status !== BORROW_STATUS.BORROWED && data.status !== BORROW_STATUS.OVERDUE) {
    throw new Error('Only active borrows can request extension');
  }

  // Check for existing pending extension
  const existingQ = query(
    extensionRef,
    where('borrowRecordId', '==', borrowRecordId),
    where('status', '==', 'PENDING')
  );
  const existing = await getDocs(existingQ);
  if (!existing.empty) throw new Error('An extension request is already pending.');

  const extensionDoc = {
    borrowRecordId,
    studentId,
    bookId: data.bookId,
    currentDueDate: data.dueDate,
    reason,
    status: 'PENDING',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(extensionRef, extensionDoc);
  return { id: docRef.id, ...extensionDoc };
};

/**
 * Admin fetches all pending extension requests (with student & book details).
 */
export const getPendingExtensions = async () => {
  const q = query(extensionRef, where('status', '==', 'PENDING'));
  const snapshot = await getDocs(q);

  const requests = [];
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    const studentDoc = await getDoc(doc(db, 'students', data.studentId));
    const bookDoc = await getDoc(doc(db, 'books', data.bookId));
    const borrowDoc = await getDoc(doc(db, 'borrow_records', data.borrowRecordId));

    requests.push({
      id: docSnapshot.id,
      ...data,
      student: studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } : null,
      book: bookDoc.exists() ? { id: bookDoc.id, ...bookDoc.data() } : null,
      borrowRecord: borrowDoc.exists() ? { id: borrowDoc.id, ...borrowDoc.data() } : null,
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
      currentDueDate: data.currentDueDate?.toDate?.()?.toISOString(),
    });
  }
  return requests;
};

/**
 * Admin approves extension — extends the due date by EXTENSION_DAYS.
 */
export const approveExtension = async (extensionRequestId) => {
  const EXTENSION_DAYS = 7;
  const extDocRef = doc(db, 'extension_requests', extensionRequestId);
  const extDoc = await getDoc(extDocRef);
  if (!extDoc.exists()) throw new Error('Extension request not found');
  const extData = extDoc.data();

  const borrowDocRef = doc(db, 'borrow_records', extData.borrowRecordId);
  const borrowDoc = await getDoc(borrowDocRef);
  if (!borrowDoc.exists()) throw new Error('Borrow record not found');
  const borrowData = borrowDoc.data();

  // Calculate new due date
  const currentDue = borrowData.dueDate?.toDate ? borrowData.dueDate.toDate() : new Date(borrowData.dueDate);
  const newDueDate = new Date(currentDue);
  newDueDate.setDate(newDueDate.getDate() + EXTENSION_DAYS);

  // Update borrow_record
  await updateDoc(borrowDocRef, {
    dueDate: newDueDate,
    status: BORROW_STATUS.BORROWED, // Reset from OVERDUE if applicable
  });

  // Update due_books entry
  const dueQ = query(dueBooksRef, where('borrowRecordId', '==', extData.borrowRecordId));
  const dueSnap = await getDocs(dueQ);
  for (const dueDoc of dueSnap.docs) {
    await updateDoc(doc(db, 'due_books', dueDoc.id), { dueDate: newDueDate });
  }

  // Mark extension request as APPROVED
  await updateDoc(extDocRef, { status: 'APPROVED', approvedAt: serverTimestamp() });

  return { success: true, newDueDate: newDueDate.toISOString() };
};

/**
 * Admin rejects extension request.
 */
export const rejectExtension = async (extensionRequestId) => {
  await updateDoc(doc(db, 'extension_requests', extensionRequestId), {
    status: 'REJECTED',
    rejectedAt: serverTimestamp(),
  });
  return { success: true };
};
