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
