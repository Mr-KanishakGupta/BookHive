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
