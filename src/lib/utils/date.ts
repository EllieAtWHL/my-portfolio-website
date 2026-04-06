export function formatDateConsistent(dateString: string): string {
  const date = new Date(dateString);
  
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

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

export function formatDateForCard(dateString: string): string {
  return formatDateWithMonthName(dateString);
}

export function formatDateForArticle(dateString: string): string {
  return formatDateWithMonthName(dateString);
}
