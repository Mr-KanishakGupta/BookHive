/**
 * BookHive — Application Constants
 * Centralized configuration for all magic numbers and business rules.
 */

// ─── Borrow Rules ──────────────────────────────────────
export const MAX_BORROWED_BOOKS = 5;
export const BORROW_DURATION_DAYS = 7;
export const MAX_EXTENSIONS = 2;
export const EXTENSION_DAYS = 7;

// ─── Reservation Rules ─────────────────────────────────
export const RESERVATION_EXPIRY_HOURS = 24;

// ─── Fine Rules ────────────────────────────────────────
export const FINE_PER_DAY_INITIAL = 5;           // ₹5/day for first 5 days
export const FINE_INITIAL_PERIOD_DAYS = 5;       // Days before escalated fine
export const FINE_PERCENTAGE_AFTER = 0.05;       // 5% of book cost per day after initial period
export const BLACKLIST_THRESHOLD_DAYS = 5;       // Days overdue before blacklisting

// ─── Pagination Defaults ───────────────────────────────
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

// ─── BorrowRecord Statuses ─────────────────────────────
export const BORROW_STATUS = {
  PENDING: 'PENDING',
  BORROWED: 'BORROWED',
  RETURNED: 'RETURNED',
  OVERDUE: 'OVERDUE',
  REJECTED: 'REJECTED',
};

// ─── Reservation Statuses ──────────────────────────────
export const RESERVATION_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  COMPLETED: 'COMPLETED',
};

// ─── Notification Types ────────────────────────────────
export const NOTIFICATION_TYPE = {
  ISSUE_APPROVED: 'issue_approved',
  ISSUE_REJECTED: 'issue_rejected',
  RETURN_REMINDER: 'return_reminder',
  FINE_UPDATE: 'fine_update',
  RESERVATION_AVAILABLE: 'reservation_available',
  SYSTEM: 'system',
};
