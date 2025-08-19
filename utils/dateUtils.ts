export const AUSTRALIA_TIMEZONE = 'Australia/Sydney';

/**
 * Helper function to get current Date object in Australian timezone
 */
export function getCurrentAustralianDate(): Date {
  const now = new Date();
  // Use Intl.DateTimeFormat to get the date components in Australian timezone
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: AUSTRALIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // Month is 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Get the current date in Australian timezone as YYYY-MM-DD string
 */
export function getCurrentDateInAustralia(): string {
  const now = new Date();
  // Use Intl.DateTimeFormat to get just the date part in Australian timezone
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives us YYYY-MM-DD format
    timeZone: AUSTRALIA_TIMEZONE
  });
  
  return formatter.format(now);
}

/**
 * Format date string for full display (e.g., "Monday, 17 August 2024")
 */
export function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format date string for short display (e.g., "Mon, 17 Aug 2024")
 */
export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Check if a date string represents today in Australian timezone
 */
export function isToday(dateString: string): boolean {
  try {
    const today = getCurrentDateInAustralia();
    return dateString === today;
  } catch (error) {
    return false;
  }
}

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  if (isNaN(date.getTime())) {
    return new Date();
  }
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart;
}

/**
 * Get the end of the week (Saturday) for a given week start date
 */
export function getWeekEnd(weekStart: Date): Date {
  if (isNaN(weekStart.getTime())) {
    return new Date();
  }
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Get a date N days ago from current Australian date
 */
export function getDateNDaysAgo(days: number): Date {
  try {
    const australianNow = getCurrentAustralianDate();
    const result = new Date(australianNow);
    result.setDate(australianNow.getDate() - days);
    return result;
  } catch (error) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() - days);
    return fallback;
  }
}

/**
 * Get a date N months ago from current Australian date
 */
export function getDateNMonthsAgo(months: number): Date {
  try {
    const australianNow = getCurrentAustralianDate();
    const result = new Date(australianNow);
    
    // Handle month rollover properly
    const newMonth = australianNow.getMonth() - months;
    const newYear = australianNow.getFullYear() + Math.floor(newMonth / 12);
    const adjustedMonth = ((newMonth % 12) + 12) % 12;
    
    result.setFullYear(newYear);
    result.setMonth(adjustedMonth);
    
    // Handle cases where the day doesn't exist in the target month (e.g., Jan 31 -> Feb 31)
    if (result.getMonth() !== adjustedMonth) {
      result.setDate(0); // Sets to last day of previous month
    }
    
    return result;
  } catch (error) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() - months);
    return fallback;
  }
}

/**
 * Convert a date string to YYYY-MM-DD format
 */
export function toDateString(date: Date): string {
  try {
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Check if two date strings represent the same date
 */
export function isSameDate(date1: string, date2: string): boolean {
  try {
    return date1 === date2;
  } catch (error) {
    return false;
  }
}

/**
 * Get the day of week for a date string (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateString: string): number {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 0;
    }
    return date.getDay();
  } catch (error) {
    return 0;
  }
}