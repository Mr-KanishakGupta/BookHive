import { auth, db } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Platform } from 'react-native';

// Use local IP for emulator testing, replace with Render URL later
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

// ----------------------------------------------------------------------------
// Admin Login
// ----------------------------------------------------------------------------
export const adminLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if user is an admin
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    
    // For demo purposes, we can fallback to checking if email is admin@bmsce.ac.in
    if (!adminDoc.exists() && email !== 'admin@bmsce.ac.in') {
      await signOut(auth);
      throw new Error('User is not an admin.');
    }

    return {
      uid: user.uid,
      email: user.email,
      role: 'admin',
      name: adminDoc.exists() ? adminDoc.data().name : 'Library Admin',
    };
  } catch (error) {
    throw new Error(error.message || 'Invalid admin credentials');
  }
};

// ----------------------------------------------------------------------------
// Student Login
// ----------------------------------------------------------------------------
export const login = async (identifier, password) => {
  try {
    let email = identifier;
    let studentData = null;

    // If identifier is not an email (e.g., library_card_id), lookup the email
    if (!identifier.includes('@')) {
      const studentDoc = await getDoc(doc(db, 'students', identifier));
      if (!studentDoc.exists()) {
        throw new Error('Invalid library card number.');
      }
      studentData = studentDoc.data();
      email = studentData.college_id;
    } else {
      // Find student by email
      const q = query(collection(db, 'students'), where('college_id', '==', identifier));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Student not found.');
      }
      studentData = querySnapshot.docs[0].data();
    }

    if (studentData.isBlacklisted) {
      throw new Error('Your ID is blacklisted. Please contact the library office.');
    }

    if (!studentData.isActive) {
      throw new Error('Create password first');
    }

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      ...studentData,
      role: 'student',
      uid: userCredential.user.uid
    };
  } catch (error) {
    throw new Error(error.message || 'Login failed.');
  }
};

// ----------------------------------------------------------------------------
// Fetch Student Info (For Signup Flow)
// ----------------------------------------------------------------------------
export const fetchStudentByCard = async (cardNumber) => {
  const studentDoc = await getDoc(doc(db, 'students', cardNumber));
  if (!studentDoc.exists()) {
    throw new Error('Following ID does not exist.');
  }
  const data = studentDoc.data();
  if (data.isActive) {
      throw new Error('Account is already active. Please login.');
  }
  return data;
};

// ----------------------------------------------------------------------------
// Request OTP for Registration
// ----------------------------------------------------------------------------
export const requestOTP = async (libraryCardNumber) => {
  try {
    const response = await fetch(`${API_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ libraryCardNumber })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to request OTP');
    return result;
  } catch (error) {
    throw new Error(error.message || 'Failed to request OTP.');
  }
};

// ----------------------------------------------------------------------------
// Verify OTP and Create Password
// ----------------------------------------------------------------------------
export const signup = async (cardNumber, otp, newPassword) => {
  try {
    // 1. Verify OTP via Express API
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ libraryCardNumber: cardNumber, otp })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Invalid OTP');
    
    // 2. Get student data to get email
    const studentDocRef = doc(db, 'students', cardNumber);
    const studentDoc = await getDoc(studentDocRef);
    if (!studentDoc.exists()) throw new Error('Student not found.');
    
    const studentData = studentDoc.data();
    const email = studentData.college_id;

    // 3. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, newPassword);
    
    // 4. Update Firestore to set active and store UID
    await updateDoc(studentDocRef, {
      isActive: true,
      authUid: userCredential.user.uid
    });

    return {
      ...studentData,
      isActive: true,
      role: 'student',
      uid: userCredential.user.uid
    };
  } catch (error) {
    throw new Error(error.message || 'Signup failed.');
  }
};

// ----------------------------------------------------------------------------
// Logout
// ----------------------------------------------------------------------------
export const logout = async () => {
  return await signOut(auth);
};
