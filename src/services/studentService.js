import { db } from '../config/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

// Collection ref
const studentsRef = collection(db, 'students');

/**
 * Admin creates a new student (Calls backend to send email)
 */
export const createStudent = async (libraryCardNumber, email, usn, name) => {
  const API_URL = "https://bookhive-31uu.onrender.com/api";
  
  const response = await fetch(`${API_URL}/auth/add-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ libraryCardNumber, email, usn, name })
  });
  
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to add student');
  
  return result;
};

/**
 * Get student by ID
 */
export const getStudentById = async (library_card_id) => {
  const studentDoc = await getDoc(doc(studentsRef, library_card_id));
  if (!studentDoc.exists()) {
    throw new Error('Student not found');
  }
  return studentDoc.data();
};

/**
 * Check if student is blacklisted
 */
export const checkBlacklist = async (library_card_id) => {
  const student = await getStudentById(library_card_id);
  return student.isBlacklisted;
};

/**
 * Update fine amount
 */
export const updateFineAmount = async (library_card_id, amount) => {
  const studentDoc = doc(studentsRef, library_card_id);
  await updateDoc(studentDoc, { fineAmount: amount });
};

/**
 * Set blacklisted status
 */
export const setBlacklisted = async (library_card_id, value) => {
  const studentDoc = doc(studentsRef, library_card_id);
  await updateDoc(studentDoc, { isBlacklisted: value });
};

/**
 * Get all students (Admin)
 */
export const getAllStudents = async () => {
  const snapshot = await getDocs(studentsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get blacklisted students (Admin)
 */
export const getBlacklistedStudents = async () => {
  const q = query(studentsRef, where('isBlacklisted', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Delete a student (Admin)
 */
export const deleteStudent = async (library_card_id) => {
  const studentDoc = doc(studentsRef, library_card_id);
  await deleteDoc(studentDoc);
};

/**
 * Update a student (Admin)
 */
export const updateStudent = async (library_card_id, data) => {
  const studentDoc = doc(studentsRef, library_card_id);
  await updateDoc(studentDoc, data);
};
