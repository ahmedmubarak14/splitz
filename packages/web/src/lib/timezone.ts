import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

// Riyadh timezone (UTC+3)
export const TIMEZONE = 'Asia/Riyadh';

/**
 * Format a date in Riyadh timezone
 */
export const formatInRiyadh = (date: Date | string, formatStr: string = 'PPp'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TIMEZONE, formatStr);
};

/**
 * Get current date/time in Riyadh timezone
 */
export const getNowInRiyadh = (): Date => {
  return toZonedTime(new Date(), TIMEZONE);
};

/**
 * Convert UTC date to Riyadh timezone
 */
export const toRiyadhTime = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, TIMEZONE);
};

/**
 * Format date for display (short format)
 */
export const formatDateShort = (date: Date | string): string => {
  return formatInRiyadh(date, 'MMM d, yyyy');
};

/**
 * Format date with time for display
 */
export const formatDateTime = (date: Date | string): string => {
  return formatInRiyadh(date, 'MMM d, yyyy h:mm a');
};

/**
 * Format time only
 */
export const formatTimeOnly = (date: Date | string): string => {
  return formatInRiyadh(date, 'h:mm a');
};

/**
 * Check if date is today in Riyadh timezone
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const riyadhDate = toRiyadhTime(dateObj);
  const riyadhNow = getNowInRiyadh();
  
  return (
    riyadhDate.getDate() === riyadhNow.getDate() &&
    riyadhDate.getMonth() === riyadhNow.getMonth() &&
    riyadhDate.getFullYear() === riyadhNow.getFullYear()
  );
};
