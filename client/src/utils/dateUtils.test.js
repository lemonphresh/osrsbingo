// utils/dateUtils.test.js

import {
  formatDisplayDate,
  dateInputToISO,
  toDateInputValue,
  toDateTimeInputValue,
  dateTimeInputToISO,
  getTodayInputValue,
} from './dateUtils';

// ─── formatDisplayDate ────────────────────────────────────────────────────────

describe('formatDisplayDate', () => {
  it('returns empty string for null', () => {
    expect(formatDisplayDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDisplayDate(undefined)).toBe('');
  });

  it('formats an ISO string to a readable date without timezone shifting', () => {
    // "2025-06-15" should always display as June 15 regardless of test runner timezone
    const result = formatDisplayDate('2025-06-15T00:00:00.000Z');
    expect(result).toBe('Jun 15, 2025');
  });

  it('handles a bare date string (no time component)', () => {
    expect(formatDisplayDate('2025-12-25')).toBe('Dec 25, 2025');
  });

  it('formats a Date object', () => {
    // Construct with explicit year/month/day to avoid timezone issues in the test
    const date = new Date(2025, 0, 20); // Jan 20, 2025 local time
    const result = formatDisplayDate(date);
    expect(result).toBe('Jan 20, 2025');
  });

  it('accepts custom Intl.DateTimeFormat options', () => {
    const result = formatDisplayDate('2025-06-15T00:00:00.000Z', { year: undefined });
    // Should not include year when overridden
    expect(result).not.toContain('2025');
  });
});

// ─── dateInputToISO ───────────────────────────────────────────────────────────

describe('dateInputToISO', () => {
  it('returns empty string for empty input', () => {
    expect(dateInputToISO('')).toBe('');
  });

  it('converts YYYY-MM-DD to an ISO string at noon UTC (non-end date)', () => {
    expect(dateInputToISO('2025-06-15')).toBe('2025-06-15T12:00:00.000Z');
  });

  it('converts an end date to end-of-day UTC', () => {
    expect(dateInputToISO('2025-06-15', true)).toBe('2025-06-15T23:59:59.000Z');
  });

  it('defaults isEndDate to false', () => {
    expect(dateInputToISO('2025-01-01')).toContain('T12:00:00.000Z');
  });
});

// ─── toDateInputValue ─────────────────────────────────────────────────────────

describe('toDateInputValue', () => {
  it('returns empty string for null', () => {
    expect(toDateInputValue(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(toDateInputValue('')).toBe('');
  });

  it('extracts YYYY-MM-DD from an ISO string', () => {
    expect(toDateInputValue('2025-06-15T12:00:00.000Z')).toBe('2025-06-15');
  });

  it('handles ISO strings with different times', () => {
    expect(toDateInputValue('2025-06-15T23:59:59.000Z')).toBe('2025-06-15');
  });

  it('formats a Date object as YYYY-MM-DD', () => {
    // Use a UTC date to get a predictable result
    const result = toDateInputValue(new Date('2025-06-15T12:00:00.000Z'));
    expect(result).toBe('2025-06-15');
  });
});

// ─── toDateTimeInputValue ─────────────────────────────────────────────────────

describe('toDateTimeInputValue', () => {
  it('returns empty string for null', () => {
    expect(toDateTimeInputValue(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(toDateTimeInputValue(undefined)).toBe('');
  });

  it('returns empty string for an invalid date string', () => {
    expect(toDateTimeInputValue('not-a-date')).toBe('');
  });

  it('returns a string in datetime-local format (YYYY-MM-DDTHH:MM)', () => {
    const result = toDateTimeInputValue('2025-06-15T12:00:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

// ─── dateTimeInputToISO ───────────────────────────────────────────────────────

describe('dateTimeInputToISO', () => {
  it('returns null for empty string', () => {
    expect(dateTimeInputToISO('')).toBeNull();
  });

  it('returns null for null', () => {
    expect(dateTimeInputToISO(null)).toBeNull();
  });

  it('converts a datetime-local string to an ISO string', () => {
    const result = dateTimeInputToISO('2025-06-15T12:00');
    expect(result).toMatch(/^2025-06-15T/);
    expect(result).toMatch(/\.000Z$/);
  });
});

// ─── getTodayInputValue ───────────────────────────────────────────────────────

describe('getTodayInputValue', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(getTodayInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's date", () => {
    const now = new Date();
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    expect(getTodayInputValue()).toBe(expected);
  });
});
