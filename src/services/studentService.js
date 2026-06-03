import { db } from '../config/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';

// Collection ref
const studentsRef = collection(db, 'students');

/**
 * Admin creates a new student
 * Workflow A
 */
export const createStudent = async (library_card_id, college_id, usn) => {
  const studentDoc = doc(studentsRef, library_card_id);
  
  const existing = await getDoc(studentDoc);
  if (existing.exists()) {
    throw new Error('Student with this library card ID already exists.');
  }

  const studentData = {
    library_card_id,
    college_id,
    usn,
    password: null,
    isActive: false,
    fineAmount: 0,
    isBlacklisted: false,
    createdAt: new Date().toISOString()
  };

  await setDoc(studentDoc, studentData);
  return studentData;
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
