import { db } from '../config/firebase';
import { 
  collection, doc, getDoc, getDocs, updateDoc, 
  deleteDoc, query, where
} from 'firebase/firestore';

const dueBooksRef = collection(db, 'due_books');
const borrowRef = collection(db, 'borrow_records');
const studentsRef = collection(db, 'students');

// ----------------------------------------------------------------------------
// Student Flow
// ----------------------------------------------------------------------------

export const getStudentFines = async (studentId) => {
  // Get active dues from due_books where fine > 0
  const q = query(dueBooksRef, where('studentId', '==', studentId), where('fine', '>', 0));
  const snapshot = await getDocs(q);
  
  const records = [];
  let totalFine = 0;

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    totalFine += data.fine;

    // Get book info
    let bookData = null;
    try {
        const bookDoc = await getDoc(doc(db, 'books', data.bookId));
        if (bookDoc.exists()) bookData = { id: bookDoc.id, ...bookDoc.data() };
    } catch (e) {
        console.error(e);
    }

    records.push({
      id: docSnapshot.id,
      ...data,
      book: bookData,
      dueDate: data.dueDate?.toDate?.()?.toISOString()
    });
  }

  return { records, totalFine };
};

// ----------------------------------------------------------------------------
// Admin Flow
// ----------------------------------------------------------------------------

export const getDueBooks = async () => {
  const q = query(dueBooksRef, where('fine', '>', 0));
  const snapshot = await getDocs(q);
  
  const dues = [];
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    
    const studentDoc = await getDoc(doc(db, 'students', data.studentId));
    const bookDoc = await getDoc(doc(db, 'books', data.bookId));
    
    dues.push({
      id: docSnapshot.id,
      ...data,
      student: studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } : null,
      book: bookDoc.exists() ? { id: bookDoc.id, ...bookDoc.data() } : null,
      dueDate: data.dueDate?.toDate?.()?.toISOString()
    });
  }
  
  return dues;
};

export const markFinePaid = async (dueBookId) => {
  const dueDocRef = doc(db, 'due_books', dueBookId);
  const dueDoc = await getDoc(dueDocRef);
  
  if (!dueDoc.exists()) throw new Error('Due record not found');
  const dueData = dueDoc.data();

  // 1. Delete from due_books
  await deleteDoc(dueDocRef);

  // 2. Update borrow_records (fineStatus = true, and status = RETURNED if previously false/blocked)
  if (dueData.borrowRecordId) {
    const borrowDocRef = doc(db, 'borrow_records', dueData.borrowRecordId);
    const borrowDoc = await getDoc(borrowDocRef);
    if (borrowDoc.exists()) {
        const updates = { fineStatus: true };
        // If the student was blocked on this transaction and it was returned
        if (borrowDoc.data().returnDate) {
            updates.status = 'RETURNED'; // Unblock record if returned
        }
        await updateDoc(borrowDocRef, updates);
    }
  }

  // 3. Recalculate student total fine & blacklist status
  const studentDocRef = doc(db, 'students', dueData.studentId);
  const studentDoc = await getDoc(studentDocRef);
  if (studentDoc.exists()) {
    const newTotalFine = Math.max(0, studentDoc.data().fineAmount - dueData.fine);
    
    // Check if there are any remaining dues for this student
    const remainingDuesQ = query(dueBooksRef, where('studentId', '==', dueData.studentId), where('fine', '>', 0));
    const remainingSnap = await getDocs(remainingDuesQ);
    const hasRemainingOverdue = !remainingSnap.empty;

    await updateDoc(studentDocRef, {
      fineAmount: newTotalFine,
      isBlacklisted: hasRemainingOverdue
    });
  }

  return { success: true };
};

// ----------------------------------------------------------------------------
// On-Demand Fine & Blacklist Recalculation
// This mirrors the daily cron logic but runs from the client when needed.
// Ensures the blacklist status is always current.
// ----------------------------------------------------------------------------
export const recalculateFinesNow = async () => {
  const dueBooksSnap = await getDocs(dueBooksRef);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let processed = 0;

  for (const dueDocSnap of dueBooksSnap.docs) {
    const dueBook = dueDocSnap.data();
    const dueDate = dueBook.dueDate?.toDate ? dueBook.dueDate.toDate() : new Date(dueBook.dueDate);
    const normalizedDue = new Date(dueDate);
    normalizedDue.setHours(0, 0, 0, 0);

    if (today > normalizedDue) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysOverdue = Math.floor((today.getTime() - normalizedDue.getTime()) / msPerDay);

      // Calculate fine
      let bookCost = 0;
      try {
        const bookDoc = await getDoc(doc(db, 'books', dueBook.bookId));
        bookCost = bookDoc.exists() ? (bookDoc.data().cost || bookDoc.data().price || 0) : 0;
      } catch (e) { /* ignore */ }

      const dailyPenalty = bookCost > 0 ? bookCost * 0.05 : 35;
      const newFine = Math.round(daysOverdue * dailyPenalty);
      const shouldBlacklist = daysOverdue >= 7;

      // Update due_books record
      await updateDoc(doc(db, 'due_books', dueDocSnap.id), { fine: newFine });

      // Update borrow_records
      if (dueBook.borrowRecordId) {
        try {
          await updateDoc(doc(db, 'borrow_records', dueBook.borrowRecordId), {
            fine: newFine,
            status: shouldBlacklist ? 'BLOCKED' : 'OVERDUE'
          });
        } catch (e) { /* record may not exist */ }
      }

      // Update student blacklist status
      if (shouldBlacklist && dueBook.studentId) {
        try {
          await updateDoc(doc(db, 'students', dueBook.studentId), {
            isBlacklisted: true
          });
        } catch (e) { /* ignore */ }
      }

      processed++;
    }
  }

  return { processed };
};

