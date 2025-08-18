import { 
  getCurrentDateInAustralia,
  getCurrentAustralianDate,
  formatDateForDisplay, 
  formatDateShort, 
  isToday, 
  getWeekStart, 
  getWeekEnd,
  getDateNDaysAgo,
  getDateNMonthsAgo,
  toDateString,
  isSameDate,
  getDayOfWeek
} from '../dateUtils';

describe('Date Utils', () => {
  describe('getCurrentDateInAustralia', () => {
    test('should return a date string in YYYY-MM-DD format', () => {
      const date = getCurrentDateInAustralia();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatDateForDisplay', () => {
    test('should format date for Australian locale', () => {
      const formatted = formatDateForDisplay('2024-08-17');
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('formatDateShort', () => {
    test('should format date in short format for Australian locale', () => {
      const formatted = formatDateShort('2024-08-17');
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('isToday', () => {
    test('should return true for current Australian date', () => {
      const today = getCurrentDateInAustralia();
      expect(isToday(today)).toBe(true);
    });

    test('should return false for different date', () => {
      expect(isToday('2020-01-01')).toBe(false);
    });
  });

  describe('getWeekStart', () => {
    test('should return start of week (Sunday)', () => {
      const date = new Date('2024-08-17'); // Saturday
      const weekStart = getWeekStart(date);
      expect(weekStart.getDay()).toBe(0); // Sunday
    });
  });

  describe('getWeekEnd', () => {
    test('should return end of week (Saturday)', () => {
      const weekStart = new Date('2024-08-11'); // Sunday
      const weekEnd = getWeekEnd(weekStart);
      expect(weekEnd.getDay()).toBe(6); // Saturday
    });
  });

  describe('getCurrentAustralianDate', () => {
    test('should return a Date object', () => {
      const date = getCurrentAustralianDate();
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('getDateNDaysAgo', () => {
    test('should return a date N days ago', () => {
      const date = getDateNDaysAgo(7);
      expect(date).toBeInstanceOf(Date);
      
      const today = getCurrentAustralianDate();
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - 7);
      
      expect(date.getTime()).toBeCloseTo(expectedDate.getTime(), -1);
    });
  });

  describe('getDateNMonthsAgo', () => {
    test('should return a date N months ago', () => {
      const date = getDateNMonthsAgo(1);
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('toDateString', () => {
    test('should convert Date to YYYY-MM-DD format', () => {
      const date = new Date('2024-08-17T10:30:00.000Z');
      const dateString = toDateString(date);
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('isSameDate', () => {
    test('should return true for same dates', () => {
      expect(isSameDate('2024-08-17', '2024-08-17')).toBe(true);
    });

    test('should return false for different dates', () => {
      expect(isSameDate('2024-08-17', '2024-08-18')).toBe(false);
    });
  });

  describe('getDayOfWeek', () => {
    test('should return correct day of week', () => {
      const dayOfWeek = getDayOfWeek('2024-08-17'); // Saturday
      expect(dayOfWeek).toBe(6);
    });
  });
});