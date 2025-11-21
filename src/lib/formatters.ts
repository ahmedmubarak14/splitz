import { formatDistanceToNow, type Locale } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// Locale map for date-fns
const localeMap: Record<string, Locale> = {
  en: enUS,
  ar: ar,
};

/**
 * Format a date to relative time (e.g., "2h ago", "30m ago")
 */
export const formatRelativeTime = (date: Date, language: string = 'en'): string => {
  const locale = localeMap[language] || enUS;
  
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale,
  });
};

/**
 * Format currency amount with proper localization
 * Uses Riyadh timezone for consistency
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'SAR',
  language: string = 'en'
): string => {
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date with proper localization and Riyadh timezone
 */
export const formatDate = (
  date: Date | string,
  language: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string => {
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Riyadh',
    calendar: 'gregory', // Always use Gregorian calendar, even for Arabic
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
};

/**
 * Safe date formatter - returns fallback if date is invalid
 */
export const safeFormatDate = (
  date: Date | string | null | undefined,
  language: string = 'en',
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '—'
): string => {
  if (!date) return fallback;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return fallback;
    return formatDate(dateObj, language, options);
  } catch (error) {
    console.warn('[formatters] Failed to format date:', error);
    return fallback;
  }
};

/**
 * Format just the number without currency symbol
 */
export const formatAmount = (
  amount: number,
  language: string = 'en'
): string => {
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
