import { STUDENTS, ADMIN } from './mockData';

// Simulate fetching student info by Library Card Number
export const fetchStudentByCard = (cardNumber) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const student = STUDENTS.find(s => s.libraryCardNumber === cardNumber);
      if (student) {
        resolve({
          name: student.name,
          email: student.email,
          usn: student.usn,
          libraryCardNumber: student.libraryCardNumber,
        });
      } else {
        reject(new Error('Library card not found'));
      }
    }, 800);
  });
};

// Login with email/card + password
export const login = (identifier, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const student = STUDENTS.find(
        s => (s.email === identifier || s.libraryCardNumber === identifier) && s.password === password
      );
      if (student) {
        resolve({ ...student, role: 'student' });
        return;
      }
      if ((ADMIN.email === identifier) && ADMIN.password === password) {
        resolve({ ...ADMIN, role: 'admin' });
        return;
      }
      reject(new Error('Invalid credentials'));
    }, 800);
  });
};

// Admin login
export const adminLogin = (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (ADMIN.email === email && ADMIN.password === password) {
        resolve({ ...ADMIN, role: 'admin' });
      } else {
        reject(new Error('Invalid admin credentials'));
      }
    }, 800);
  });
};

// Signup
export const signup = (cardNumber, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const student = STUDENTS.find(s => s.libraryCardNumber === cardNumber);
      if (student) {
        resolve({ ...student, role: 'student' });
      } else {
        reject(new Error('Library card not found. Contact the library admin.'));
      }
    }, 800);
  });
};
