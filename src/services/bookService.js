import { db } from '../config/firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, orderBy, limit, writeBatch 
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
