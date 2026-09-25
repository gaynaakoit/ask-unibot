/**
 * Locale-Aware Formatter Service (Phase 6.2)
 * METI UniPods AI Innovation Programme 2026
 *
 * Provides locale-aware date, time, and number formatting,
 * and text direction handling (RTL for Arabic).
 */

import { SUPPORTED_LANGUAGES, SupportedLanguage, TextDirection } from './types';

/**
 * Returns text direction ('ltr' or 'rtl') for a supported language
 */
export function getDirection(lang: SupportedLanguage): TextDirection {
  return SUPPORTED_LANGUAGES[lang]?.direction || 'ltr';
}

/**
 * Returns BCP 47 locale code for a supported language
 */
export function getLocale(lang: SupportedLanguage): string {
  return SUPPORTED_LANGUAGES[lang]?.locale || 'en-GB';
}

/**
 * Formats a date string or Date object in the target language locale
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  lang: SupportedLanguage = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      // If unparseable string, return original string safely
      return typeof dateInput === 'string' ? dateInput : '';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...options,
    };

    return new Intl.DateTimeFormat(getLocale(lang), defaultOptions).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats time (e.g. 15:00 WAT / GMT)
 */
export function formatTime(
  dateOrTime: string | Date | null | undefined,
  lang: SupportedLanguage = 'en'
): string {
  if (!dateOrTime) return '';

  if (typeof dateOrTime === 'string' && /^\d{1,2}:\d{2}/.test(dateOrTime)) {
    // Already a time string like "15:00 WAT"
    return dateOrTime;
  }

  try {
    const date = typeof dateOrTime === 'string' ? new Date(dateOrTime) : dateOrTime;
    if (isNaN(date.getTime())) {
      return String(dateOrTime);
    }

    return new Intl.DateTimeFormat(getLocale(lang), {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return String(dateOrTime);
  }
}

/**
 * Formats numbers in the target language locale
 */
export function formatNumber(
  num: number,
  lang: SupportedLanguage = 'en',
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(getLocale(lang), options).format(num);
  } catch {
    return String(num);
  }
}
