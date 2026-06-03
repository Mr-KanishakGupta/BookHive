/**
 * Generates a unique book code based on year, genre, innerGenre, and copy count.
 * Format: YEAR-GENRE-INNERGENRE-COPYCOUNT
 * E.g., 2024-CS-ALG-001
 */
const generateBookCode = (year, genre, innerGenre, copyCount) => {
  const formatText = (text, len) => text.toUpperCase().substring(0, len).padEnd(len, 'X');
  const formattedYear = year.toString();
  const formattedGenre = formatText(genre, 2);
  const formattedInnerGenre = formatText(innerGenre, 3);
  const formattedCount = copyCount.toString().padStart(3, '0');
  
  return `${formattedYear}-${formattedGenre}-${formattedInnerGenre}-${formattedCount}`;
};

module.exports = {
  generateBookCode,
};
