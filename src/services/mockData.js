// ─── Book Code Generator ──────────────────────────
function generateBookCode(year, genre, innerGenre, copyNum) {
  const y = String(year).slice(-2);
  const g = genre.slice(0, 3).toUpperCase();
  const ig = innerGenre.slice(0, 2).toUpperCase();
  const c = String(copyNum).padStart(3, '0');
  return `${y}${g}${ig}${c}`;
}

// ─── Students Database ────────────────────────────
export const STUDENTS = [
  {
    id: 's1',
    libraryCardNumber: 'BMSCE2024001',
    name: 'Kemakarunya',
    email: 'student@bmsce.ac.in',
    usn: '1BM22CS001',
    password: 'student123',
    isBlacklisted: false,
    borrowedBooks: ['b1', 'b3'],
    fines: 70,
    department: 'Computer Science',
  },
  {
    id: 's2',
    libraryCardNumber: 'BMSCE2024002',
    name: 'Priya Sharma',
    email: 'priya.ec23@bmsce.ac.in',
    usn: '1BM22EC002',
    password: 'student123',
    isBlacklisted: false,
    borrowedBooks: ['b5'],
    fines: 0,
    department: 'Electronics & Communication',
  },
  {
    id: 's3',
    libraryCardNumber: 'BMSCE2024003',
    name: 'Rahul Kumar',
    email: 'rahul.me24@bmsce.ac.in',
    usn: '1BM22ME003',
    password: 'student123',
    isBlacklisted: false,
    borrowedBooks: ['b7', 'b10', 'b12'],
    fines: 140,
    department: 'Mechanical Engineering',
  },
  {
    id: 's4',
    libraryCardNumber: 'BMSCE2024004',
    name: 'Sneha Reddy',
    email: 'sneha.is24@bmsce.ac.in',
    usn: '1BM22IS004',
    password: 'student123',
    isBlacklisted: false,
    borrowedBooks: [],
    fines: 0,
    department: 'Information Science',
  },
];

// ─── Admin Account ─────────────────────────────────
export const ADMIN = {
  id: 'admin1',
  email: 'admin@bmsce.ac.in',
  password: 'admin123',
  name: 'Library Admin',
};

// ─── Books Collection ──────────────────────────────
export const BOOKS = [
  {
    id: 'b1',
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    genre: 'Academic',
    innerGenre: 'Algorithms',
    year: 2009,
    totalCopies: 25,
    availableCopies: 15,
    cost: 650,
    coverUrl: 'https://picsum.photos/seed/algo/200/300',
    description: 'A comprehensive textbook covering a broad range of algorithms in depth.',
    isbn: '23ACMCSALG001',
    bookCode: '',
    reservedBy: null,
    department: 'Computer Science',
    rating: 4.9,
    pages: 1312,
    language: 'English',
  },
  {
    id: 'b2',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    genre: 'Technical',
    innerGenre: 'Best Practices',
    year: 2008,
    totalCopies: 20,
    availableCopies: 0,
    cost: 450,
    coverUrl: 'https://picsum.photos/seed/clean/200/300',
    description: 'A handbook of agile software craftsmanship for writing clean, maintainable code.',
    isbn: '24TCHCSSWE001',
    bookCode: '',
    reservedBy: null,
    department: 'Computer Science',
    rating: 4.7,
    pages: 464,
    language: 'English',
  },
  {
    id: 'b3',
    title: 'Digital Electronics',
    author: 'Morris Mano',
    genre: 'Academic',
    innerGenre: 'Digital',
    year: 2017,
    totalCopies: 22,
    availableCopies: 18,
    cost: 400,
    coverUrl: 'https://picsum.photos/seed/digital/200/300',
    description: 'Foundational textbook on digital logic circuits and design methodology.',
    isbn: '22ACHECDGD001',
    bookCode: '',
    reservedBy: null,
    department: 'Electronics & Communication',
    rating: 4.5,
    pages: 576,
    language: 'English',
  },
  {
    id: 'b4',
    title: 'Machine Design',
    author: 'R.S. Khurmi',
    genre: 'Reference',
    innerGenre: 'Design',
    year: 2020,
    totalCopies: 24,
    availableCopies: 8,
    cost: 800,
    coverUrl: 'https://picsum.photos/seed/machinedesign/200/300',
    description: 'Comprehensive reference for mechanical design principles and applications.',
    isbn: '23REFMEDES001',
    bookCode: '',
    reservedBy: null,
    department: 'Mechanical Engineering',
    rating: 4.3,
    pages: 1250,
    language: 'English',
  },
  {
    id: 'b5',
    title: 'Database Management Systems',
    author: 'Raghu Ramakrishnan',
    genre: 'Academic',
    innerGenre: 'Database',
    year: 2019,
    totalCopies: 28,
    availableCopies: 12,
    cost: 700,
    coverUrl: 'https://picsum.photos/seed/dbbook/200/300',
    description: 'Comprehensive coverage of database systems including relational model and SQL.',
    isbn: '24ACMISDBS001',
    bookCode: '',
    reservedBy: null,
    department: 'Information Science',
    rating: 4.6,
    pages: 1104,
    language: 'English',
  },
  {
    id: 'b6',
    title: 'Structural Analysis',
    author: 'R.C. Hibbeler',
    genre: 'Technical',
    innerGenre: 'Structures',
    year: 2021,
    totalCopies: 20,
    availableCopies: 3,
    cost: 600,
    coverUrl: 'https://picsum.photos/seed/structural/200/300',
    description: 'Classic textbook on structural analysis covering methods and applications.',
    isbn: '23TCHCESTR001',
    bookCode: '',
    reservedBy: null,
    department: 'Civil Engineering',
    rating: 4.4,
    pages: 720,
    language: 'English',
  },
  {
    id: 'b7',
    title: 'Artificial Intelligence',
    author: 'Stuart Russell',
    genre: 'Research',
    innerGenre: 'AI',
    year: 2020,
    totalCopies: 26,
    availableCopies: 1,
    cost: 550,
    coverUrl: 'https://picsum.photos/seed/aibook/200/300',
    description: 'The most comprehensive introduction to the theory and practice of AI.',
    isbn: '24RSHCSAIM001',
    bookCode: '',
    reservedBy: null,
    department: 'Computer Science',
    rating: 4.8,
    pages: 1136,
    language: 'English',
  },
  {
    id: 'b8',
    title: 'Power Systems',
    author: 'J.B. Gupta',
    genre: 'Reference',
    innerGenre: 'Power',
    year: 2019,
    totalCopies: 23,
    availableCopies: 10,
    cost: 400,
    coverUrl: 'https://picsum.photos/seed/powersys/200/300',
    description: 'Detailed coverage of electrical power system analysis and design.',
    isbn: '22REFEEPWR001',
    bookCode: '',
    reservedBy: null,
    department: 'Electrical Engineering',
    rating: 4.2,
    pages: 890,
    language: 'English',
  },
];

// Generate book codes
BOOKS.forEach((book, idx) => {
  book.bookCode = generateBookCode(book.year, book.genre, book.innerGenre, idx + 1);
});

// ─── Borrow Records ───────────────────────────────
const today = new Date();
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};
const daysFromNow = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const BORROW_RECORDS = [
  {
    id: 'br1',
    studentId: 's1',
    bookId: 'b1',
    borrowDate: daysAgo(30),
    dueDate: daysAgo(9),
    returnDate: null,
    fine: 0,
    status: 'active',
  },
  {
    id: 'br2',
    studentId: 's1',
    bookId: 'b3',
    borrowDate: daysAgo(3),
    dueDate: daysFromNow(4),
    returnDate: null,
    fine: 0,
    status: 'active',
  },
  {
    id: 'br3',
    studentId: 's2',
    bookId: 'b5',
    borrowDate: daysAgo(6),
    dueDate: daysFromNow(1),
    returnDate: null,
    fine: 0,
    status: 'active',
  },
  {
    id: 'br4',
    studentId: 's3',
    bookId: 'b7',
    borrowDate: daysAgo(48),
    dueDate: daysAgo(34),
    returnDate: null,
    fine: 340,
    status: 'overdue',
  },
  {
    id: 'br5',
    studentId: 's3',
    bookId: 'b6',
    borrowDate: daysAgo(1),
    dueDate: daysFromNow(27),
    returnDate: null,
    fine: 0,
    status: 'active',
  },
  {
    id: 'br6',
    studentId: 's3',
    bookId: 'b12',
    borrowDate: daysAgo(10),
    dueDate: daysAgo(3),
    returnDate: null,
    fine: 15,
    status: 'overdue',
  },
  // Past records
  {
    id: 'br7',
    studentId: 's1',
    bookId: 'b2',
    borrowDate: daysAgo(30),
    dueDate: daysAgo(23),
    returnDate: daysAgo(24),
    fine: 0,
    status: 'returned',
  },
  {
    id: 'br8',
    studentId: 's1',
    bookId: 'b4',
    borrowDate: daysAgo(60),
    dueDate: daysAgo(53),
    returnDate: daysAgo(50),
    fine: 15,
    status: 'returned',
  },
  {
    id: 'br9',
    studentId: 's2',
    bookId: 'b3',
    borrowDate: daysAgo(20),
    dueDate: daysAgo(13),
    returnDate: daysAgo(13),
    fine: 0,
    status: 'returned',
  },
  {
    id: 'br10',
    studentId: 's4',
    bookId: 'b8',
    borrowDate: daysAgo(14),
    dueDate: daysAgo(7),
    returnDate: daysAgo(6),
    fine: 0,
    status: 'returned',
  },
];

// ─── Issue Requests (Borrow Requests) ──────────────
export const ISSUE_REQUESTS = [
  {
    id: 'ir1',
    studentId: 's1',
    bookId: 'b2',
    requestDate: daysAgo(2),
    status: 'pending',
  },
  {
    id: 'ir2',
    studentId: 's2',
    bookId: 'b3',
    requestDate: daysAgo(1),
    status: 'pending',
  },
];

// ─── Extension Requests ────────────────────────────
export const EXTENSION_REQUESTS = [
  {
    id: 'er1',
    studentId: 's1',
    bookId: 'b1',
    borrowRecordId: 'br1',
    originalDueDate: daysAgo(9),
    requestedDueDate: daysFromNow(5),
    requestDate: daysAgo(10),
    reason: 'Need more time for semester project',
    status: 'pending',
  },
  {
    id: 'er2',
    studentId: 's3',
    bookId: 'b6',
    borrowRecordId: 'br5',
    originalDueDate: daysFromNow(27),
    requestedDueDate: daysFromNow(41),
    requestDate: daysAgo(0),
    reason: 'Research paper submission extended',
    status: 'pending',
  },
];

// ─── Advance Reservations ──────────────────────────
export const ADVANCE_RESERVATIONS = [
  {
    id: 'ar1',
    studentId: 's2',
    bookId: 'b7',
    reservationDate: daysAgo(2),
    status: 'waiting',
    expiresAt: null,
  },
  {
    id: 'ar2',
    studentId: 's1',
    bookId: 'b8',
    reservationDate: daysAgo(1),
    status: 'waiting',
    expiresAt: null,
  },
];

// ─── Fines Database ────────────────────────────────
export const FINES = [
  {
    id: 'f1',
    studentId: 's1',
    bookId: 'b7',
    borrowRecordId: 'br4',
    amount: 340,
    perDay: 10,
    dueDate: '2026-03-07',
    daysOverdue: 34,
    status: 'unpaid',
    createdAt: daysAgo(34),
  },
  {
    id: 'f2',
    studentId: 's4',
    bookId: 'b5',
    borrowRecordId: null,
    amount: 260,
    perDay: 10,
    dueDate: '2026-03-15',
    daysOverdue: 26,
    status: 'unpaid',
    createdAt: daysAgo(26),
  },
  {
    id: 'f3',
    studentId: 's2',
    bookId: 'b3',
    borrowRecordId: null,
    amount: 210,
    perDay: 10,
    dueDate: '2026-03-20',
    daysOverdue: 21,
    status: 'unpaid',
    createdAt: daysAgo(21),
  },
  {
    id: 'f4',
    studentId: 's3',
    bookId: 'b4',
    borrowRecordId: null,
    amount: 130,
    perDay: 10,
    dueDate: '2026-03-25',
    daysOverdue: 16,
    status: 'unpaid',
    createdAt: daysAgo(16),
  },
  // Paid fines
  {
    id: 'f5',
    studentId: 's1',
    bookId: 'b2',
    borrowRecordId: 'br7',
    amount: 120,
    perDay: 10,
    dueDate: '2026-02-15',
    daysOverdue: 12,
    status: 'paid',
    createdAt: daysAgo(60),
    paidAt: daysAgo(55),
  },
  {
    id: 'f6',
    studentId: 's2',
    bookId: 'b8',
    borrowRecordId: null,
    amount: 80,
    perDay: 10,
    dueDate: '2026-02-20',
    daysOverdue: 8,
    status: 'paid',
    createdAt: daysAgo(50),
    paidAt: daysAgo(48),
  },
  {
    id: 'f7',
    studentId: 's3',
    bookId: 'b1',
    borrowRecordId: null,
    amount: 120,
    perDay: 10,
    dueDate: '2026-02-10',
    daysOverdue: 12,
    status: 'paid',
    createdAt: daysAgo(65),
    paidAt: daysAgo(60),
  },
];

// ─── Recent Activity ──────────────────────────────
export const RECENT_ACTIVITY = [
  {
    id: 'ra1',
    type: 'borrow',
    icon: 'book-open',
    message: 'Kemakarunya borrowed Introduction to Algorithms',
    timestamp: '2 hours ago',
  },
  {
    id: 'ra2',
    type: 'return',
    icon: 'check-circle',
    message: 'Priya Sharma returned Digital Electronics',
    timestamp: '5 hours ago',
  },
  {
    id: 'ra3',
    type: 'request',
    icon: 'clock',
    message: 'New borrow request from Rahul Kumar',
    timestamp: '1 day ago',
  },
  {
    id: 'ra4',
    type: 'overdue',
    icon: 'alert-circle',
    message: 'Artificial Intelligence is now overdue',
    timestamp: '2 days ago',
  },
];

// ─── Notifications ─────────────────────────────────
export const NOTIFICATIONS = [
  {
    id: 'n1',
    studentId: 's1',
    type: 'return_reminder',
    title: 'Return Reminder',
    message: '"Introduction to Algorithms" is due in 2 days. Please return it on time to avoid fines.',
    timestamp: daysAgo(0) + 'T09:00:00',
    read: false,
    icon: 'clock',
  },
  {
    id: 'n2',
    studentId: 's1',
    type: 'issue_approved',
    title: 'Issue Approved',
    message: 'Your request for "Clean Code" has been approved. Please collect it from the library.',
    timestamp: daysAgo(1) + 'T14:30:00',
    read: false,
    icon: 'check-circle',
  },
  {
    id: 'n3',
    studentId: 's1',
    type: 'fine_update',
    title: 'Fine Cleared',
    message: 'Your fine of ₹15 for "AI: A Modern Approach" has been recorded. Please clear it at the library.',
    timestamp: daysAgo(3) + 'T10:00:00',
    read: true,
    icon: 'alert-circle',
  },
  {
    id: 'n4',
    studentId: 's2',
    type: 'reservation_available',
    title: 'Book Available!',
    message: '"Operating System Concepts" is now available. Your reservation is valid for 24 hours.',
    timestamp: daysAgo(0) + 'T11:00:00',
    read: false,
    icon: 'book-open',
  },
  {
    id: 'n5',
    studentId: 's3',
    type: 'fine_update',
    title: 'Fine Warning',
    message: 'Your account is BLACKLISTED due to overdue books. Return immediately to restore access.',
    timestamp: daysAgo(0) + 'T08:00:00',
    read: false,
    icon: 'alert-triangle',
  },
  {
    id: 'n6',
    studentId: 's2',
    type: 'return_reminder',
    title: 'Return Reminder',
    message: '"Database System Concepts" is due tomorrow. Please return it on time.',
    timestamp: daysAgo(0) + 'T09:00:00',
    read: false,
    icon: 'clock',
  },
];

// ─── Department Stats (for Reports) ────────────────
export const DEPARTMENT_STATS = [
  { name: 'Computer Science', issued: 55, total: 71 },
  { name: 'Electronics & Communication', issued: 4, total: 22 },
  { name: 'Mechanical Engineering', issued: 16, total: 24 },
  { name: 'Information Science', issued: 16, total: 28 },
  { name: 'Civil Engineering', issued: 17, total: 20 },
  { name: 'Electrical Engineering', issued: 13, total: 23 },
];

// ─── Most Borrowed Books ──────────────────────────
export const MOST_BORROWED = [
  { bookId: 'b7', title: 'Artificial Intelligence', author: 'Stuart Russell', times: 25 },
  { bookId: 'b2', title: 'Clean Code', author: 'Robert C. Martin', times: 20 },
  { bookId: 'b6', title: 'Structural Analysis', author: 'R.C. Hibbeler', times: 17 },
  { bookId: 'b4', title: 'Machine Design', author: 'R.S. Khurmi', times: 16 },
  { bookId: 'b5', title: 'Database Management Systems', author: 'Raghu Ramakrishnan', times: 16 },
];

// ─── Curated Books ───────────────────────────────────
export const CURATED_BOOKS = [
  { ...BOOKS[0], recommended: true }, // Algorithms
  { ...BOOKS[4], recommended: true }, // Database
  { ...BOOKS[6], recommended: true }, // AI
];

// ─── Library Announcements ───────────────────────────
export const ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'New Study Rooms Available',
    time: '10:30 AM',
    icon: 'time-outline',
  },
  {
    id: 'a2',
    title: 'Extended Library Hours for Finals',
    time: 'Yesterday',
    icon: 'calendar-outline',
  },
  {
    id: 'a3',
    title: 'Author Talk: Dr. Emily Carter',
    time: '2 days ago',
    icon: 'mic-outline',
  },
];

// ─── Genre List ────────────────────────────────────
export const GENRES = [
  'Computer Science',
  'Software Engineering',
  'Mathematics',
  'Electronics',
  'Mechanical',
  'Civil',
  'Physics',
  'Chemistry',
];

// ─── Department List ───────────────────────────────
export const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Information Science',
  'Civil Engineering',
  'Electrical Engineering',
];
