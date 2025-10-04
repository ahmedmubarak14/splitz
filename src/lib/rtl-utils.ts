/**
 * RTL/LTR Utility Functions
 * Helper functions for handling bidirectional text layouts
 */

import { useTranslation } from 'react-i18next';

/**
 * Check if current language is RTL
 */
export const useIsRTL = (): boolean => {
  const { i18n } = useTranslation();
  return i18n.language === 'ar';
};

/**
 * Get direction string for current language
 */
export const useDirection = (): 'rtl' | 'ltr' => {
  const { i18n } = useTranslation();
  return i18n.language === 'ar' ? 'rtl' : 'ltr';
};

/**
 * Conditional class based on RTL
 */
export const rtlClass = (isRTL: boolean, rtlClass: string, ltrClass: string): string => {
  return isRTL ? rtlClass : ltrClass;
};

/**
 * Mirror padding/margin classes for RTL
 */
export const rtlSpacing = (isRTL: boolean, spacing: string): string => {
  if (!isRTL) return spacing;
  
  // Map left to right and vice versa
  return spacing
    .replace(/\bpl-/g, 'TEMP-')
    .replace(/\bpr-/g, 'pl-')
    .replace(/TEMP-/g, 'pr-')
    .replace(/\bml-/g, 'TEMP-')
    .replace(/\bmr-/g, 'ml-')
    .replace(/TEMP-/g, 'mr-');
};

/**
 * Get text alignment class based on direction
 */
export const rtlTextAlign = (isRTL: boolean, align: 'left' | 'right' | 'center' = 'left'): string => {
  if (align === 'center') return 'text-center';
  if (align === 'left') return isRTL ? 'text-right' : 'text-left';
  if (align === 'right') return isRTL ? 'text-left' : 'text-right';
  return '';
};

/**
 * Get flex direction class for RTL
 */
export const rtlFlex = (isRTL: boolean, direction: 'row' | 'col' = 'row'): string => {
  if (direction === 'col') return 'flex-col';
  return isRTL ? 'flex-row-reverse' : 'flex-row';
};

/**
 * Get dropdown alignment for RTL
 */
export const rtlAlign = (isRTL: boolean, align: 'start' | 'end' | 'center' = 'end'): 'start' | 'end' | 'center' => {
  if (align === 'center') return 'center';
  if (align === 'start') return isRTL ? 'end' : 'start';
  if (align === 'end') return isRTL ? 'start' : 'end';
  return 'end';
};
