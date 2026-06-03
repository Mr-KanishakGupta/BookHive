/**
 * Calculates fine based on business rules:
 * - First 5 days late → ₹5/day
 * - After 5 days → 5% of book cost per day
 *
 * @param {Date} dueDate - The original due date
 * @param {Date} returnDate - The actual return date (or current date if not returned)
 * @param {Number} bookCost - The original cost of the book
 * @returns {Number} Calculated fine amount
 */
const calculateFine = (dueDate, returnDate, bookCost) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  
  // Calculate days late
  const daysLate = Math.floor((returnDate.getTime() - dueDate.getTime()) / msPerDay);
  
  if (daysLate <= 0) return 0;
  
  let fine = 0;
  
  if (daysLate <= 5) {
    // ₹5 per day for up to 5 days
    fine = daysLate * 5;
  } else {
    // ₹25 for the first 5 days + 5% of book cost for each day after 5
    const daysAfterFive = daysLate - 5;
    const penaltyPerDay = bookCost * 0.05;
    fine = (5 * 5) + (daysAfterFive * penaltyPerDay);
  }
  
  return fine;
};

module.exports = {
  calculateFine,
};
