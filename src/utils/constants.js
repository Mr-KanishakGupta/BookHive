/**
 * BookHive — Application Constants
 * Centralized configuration for all magic numbers and business rules.
 */

module.exports = {
  // ─── Borrow Rules ──────────────────────────────────────
  MAX_BORROWED_BOOKS: 5,
  BORROW_DURATION_DAYS: 7,
  MAX_EXTENSIONS: 2,
  EXTENSION_DAYS: 7,

  // ─── Reservation Rules ─────────────────────────────────
  RESERVATION_EXPIRY_HOURS: 24,

  // ─── Fine Rules ────────────────────────────────────────
  FINE_PER_DAY_INITIAL: 5,           // ₹5/day for first 5 days
  FINE_INITIAL_PERIOD_DAYS: 5,       // Days before escalated fine
  FINE_PERCENTAGE_AFTER: 0.05,       // 5% of book cost per day after initial period
  BLACKLIST_THRESHOLD_DAYS: 5,       // Days overdue before blacklisting

  // ─── Pagination Defaults ───────────────────────────────
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,

  // ─── BorrowRecord Statuses ─────────────────────────────
  BORROW_STATUS: {
    PENDING: 'PENDING',
    BORROWED: 'BORROWED',
    RETURNED: 'RETURNED',
    OVERDUE: 'OVERDUE',
    REJECTED: 'REJECTED',
  },

  // ─── Reservation Statuses ──────────────────────────────
  RESERVATION_STATUS: {
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    COMPLETED: 'COMPLETED',
  },

  // ─── Notification Types ────────────────────────────────
  NOTIFICATION_TYPE: {
    ISSUE_APPROVED: 'issue_approved',
    ISSUE_REJECTED: 'issue_rejected',
    RETURN_REMINDER: 'return_reminder',
    FINE_UPDATE: 'fine_update',
    RESERVATION_AVAILABLE: 'reservation_available',
    SYSTEM: 'system',
  },
};
