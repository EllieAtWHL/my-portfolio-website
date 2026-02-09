/**
 * Consistent date formatting utilities to prevent hydration errors
 * These functions return the same result on server and client
 */

/**
 * Format date in a consistent way across server and client
 * Uses UTC to avoid timezone differences
 */
export function formatDateConsistent(dateString: string): string {
  const date = new Date(dateString);
  
  // Use UTC methods to ensure consistency between server and client
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1; // Months are 0-indexed
  const year = date.getUTCFullYear();
  
  // Format as DD/MM/YYYY (consistent with what was showing on server)
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

/**
 * Format date with month name for better readability
 */
export function formatDateWithMonthName(dateString: string): string {
  const date = new Date(dateString);
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Format date for display in cards (short format)
 */
export function formatDateForCard(dateString: string): string {
  return formatDateConsistent(dateString);
}

/**
 * Format date for display in articles (long format)
 */
export function formatDateForArticle(dateString: string): string {
  return formatDateWithMonthName(dateString);
}
