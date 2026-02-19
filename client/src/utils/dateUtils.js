/**
 * Formats a date string or Date object for display.
 * Handles ISO strings by parsing just the date portion to avoid timezone shifts.
 *
 * @param {string|Date} dateValue - ISO string or Date object
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDisplayDate = (dateValue, options = {}) => {
  if (!dateValue) return '';

  // If it's an ISO string, extract just the date part to avoid timezone issues
  if (typeof dateValue === 'string') {
    // Handle ISO format: "2025-01-20T00:00:00.000Z" -> "2025-01-20"
    const datePart = dateValue.split('T')[0];
    // Parse as local date by using the date parts directly
    const [year, month, day] = datePart.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    });
  }

  // If it's already a Date object, use it directly
  return dateValue.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
};

/**
 * Formats a date for datetime display (includes time).
 * Use this for countdowns and time-sensitive displays.
 *
 * @param {string|Date} dateValue
 * @param {object} options
 * @returns {string}
 */
export const formatDisplayDateTime = (dateValue, options = {}) => {
  if (!dateValue) return '';

  const date = new Date(dateValue);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  });
};

/**
 * Converts a date input value (YYYY-MM-DD) to an ISO string for storage.
 * Uses noon UTC to avoid any date-shifting regardless of timezone.
 *
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {boolean} isEndDate - If true, sets time to end of day
 * @returns {string} ISO string
 */
export const dateInputToISO = (dateString, isEndDate = false) => {
  if (!dateString) return '';

  // Use noon UTC to avoid any timezone-related date shifts
  // For end dates, use 23:59:59 UTC
  const time = isEndDate ? 'T23:59:59.000Z' : 'T12:00:00.000Z';
  return `${dateString}${time}`;
};

/**
 * Extracts YYYY-MM-DD from an ISO string or Date for form inputs.
 *
 * @param {string|Date} dateValue
 * @returns {string} YYYY-MM-DD format
 */
export const toDateInputValue = (dateValue) => {
  if (!dateValue) return '';

  if (typeof dateValue === 'string') {
    // Extract just the date portion from ISO string
    return dateValue.split('T')[0];
  }

  // If Date object, format as YYYY-MM-DD
  return dateValue.toISOString().split('T')[0];
};

/**
 * Gets today's date in YYYY-MM-DD format for min date attributes.
 * @returns {string}
 */
export const getTodayInputValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
};

// src/utils/dateUtils.js

/**
 * Convert an ISO string (from DB/GraphQL) into a value suitable for
 * <input type="datetime-local">  →  "2025-06-01T18:00"
 * Falls back gracefully if the value is null/undefined.
 */
export function toDateTimeInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/**
 * Convert a datetime-local input value ("2025-06-01T18:00") into a UTC ISO
 * string for storage.  The browser interprets datetime-local as the user's
 * *local* time, so `new Date(s).toISOString()` correctly converts to UTC.
 */
export function dateTimeInputToISO(localDateTimeString) {
  if (!localDateTimeString) return null;
  return new Date(localDateTimeString).toISOString();
}

export function getTodayDateTimeInputValue() {
  return toDateTimeInputValue(new Date().toISOString());
}

/**
 * Returns the viewer's IANA timezone name, e.g. "America/Los_Angeles".
 * Used to label datetime pickers so admins know what timezone they're entering.
 */
export function getViewerTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
