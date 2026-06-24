import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwh7OgdijM2Htdr0bns_ql-pfwfRyJ0yg",
  authDomain: "bookhive-3b9fc.firebaseapp.com",
  databaseURL: "https://bookhive-3b9fc-default-rtdb.firebaseio.com",
  projectId: "bookhive-3b9fc",
  storageBucket: "bookhive-3b9fc.firebasestorage.app",
  messagingSenderId: "197050324831",
  appId: "1:197050324831:web:f841597aab35b055de88ea",
  measurementId: "G-HDY5Q6CV62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);
