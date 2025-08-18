export const AUSTRALIA_TIMEZONE = 'Australia/Sydney';

/**
 * Helper function to get current Date object in Australian timezone
 */
export function getCurrentAustralianDate(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: AUSTRALIA_TIMEZONE }));
}

/**
 * Get the current date in Australian timezone as YYYY-MM-DD string
 */
export function getCurrentDateInAustralia(): string {
  const australianDate = getCurrentAustralianDate();
  return australianDate.toISOString().split('T')[0];
}

/**
 * Format date string for full display (e.g., "Monday, 17 August 2024")
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date string for short display (e.g., "Mon, 17 Aug 2024")
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if a date string represents today in Australian timezone
 */
export function isToday(dateString: string): boolean {
  const today = getCurrentDateInAustralia();
  return dateString === today;
}

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart;
}

/**
 * Get the end of the week (Saturday) for a given week start date
 */
export function getWeekEnd(weekStart: Date): Date {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Get a date N days ago from current Australian date
 */
export function getDateNDaysAgo(days: number): Date {
  const australianNow = getCurrentAustralianDate();
  australianNow.setDate(australianNow.getDate() - days);
  return australianNow;
}

/**
 * Get a date N months ago from current Australian date
 */
export function getDateNMonthsAgo(months: number): Date {
  const australianNow = getCurrentAustralianDate();
  australianNow.setMonth(australianNow.getMonth() - months);
  return australianNow;
}

/**
 * Convert a date string to YYYY-MM-DD format
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if two date strings represent the same date
 */
export function isSameDate(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Get the day of week for a date string (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateString: string): number {
  return new Date(dateString).getDay();
}