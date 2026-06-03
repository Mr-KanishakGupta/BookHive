import { db, storage } from '../config/firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, orderBy, limit, writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateBookCode } from '../utils/bookCodeGenerator';

const booksRef = collection(db, 'books');

// ----------------------------------------------------------------------------
// Image Upload to Firebase Storage
// ----------------------------------------------------------------------------
export const uploadBookImage = async (uri, bookCode, isFront = true) => {
  if (!uri) return null;
  
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const filename = `books/${bookCode}/${isFront ? 'front' : 'rear'}.jpg`;
    const imageRef = ref(storage, filename);
    
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
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
  
  // Upload images
  const frontImage = await uploadBookImage(frontImageUri, bookCode, true);
  const rearImage = await uploadBookImage(rearImageUri, bookCode, false);

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
