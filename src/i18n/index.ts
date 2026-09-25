/**
 * Centralized i18n Hub (Ask UniBot Phase 6.2)
 * METI UniPods AI Innovation Programme 2026
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, SupportedLanguage, TextDirection } from './types';
import { en, TranslationKeys } from './locales/en';
import { fr } from './locales/fr';
import { pt } from './locales/pt';
import { ar } from './locales/ar';
import { getDirection, getLocale, formatDate, formatTime, formatNumber } from './formatter';
import { detectLanguage } from './languageDetector';
import { resolveLanguage, normalizeLanguage, isSupportedLanguage, resolveWhatsAppMessageLanguage } from './languageResolver';

export * from './types';
export * from './formatter';
export * from './languageDetector';
export * from './languageResolver';

export const locales: Record<SupportedLanguage, TranslationKeys> = {
  en,
  fr,
  pt,
  ar,
};

/**
 * Resolves nested dotted key like 'navigation.dashboard' from a dictionary object.
 */
function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Translates a key with fallback to English and variable interpolation.
 * E.g. translate('dashboard.welcome', 'fr', { name: 'Awa' })
 */
export function translate(
  key: string,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
  params?: Record<string, string | number>
): string {
  const dict = locales[lang] || locales.en;
  let text = getNestedValue(dict, key);

  // Missing translation safety: Fall back to English
  if (!text && lang !== 'en') {
    text = getNestedValue(locales.en, key);
  }

  // If still missing, return key itself rather than undefined
  if (!text) {
    return key;
  }

  // Interpolate variables {name}, {count}, etc.
  if (params && typeof params === 'object') {
    return text.replace(/\{(\w+)\}/g, (_, placeholder) => {
      if (placeholder in params) {
        return String(params[placeholder]);
      }
      return `{${placeholder}}`;
    });
  }

  return text;
}

// Alias for convenience
export const t = translate;

// ==============================================================================
// REACT CONTEXT & HOOK
// ==============================================================================

interface I18nContextValue {
  language: SupportedLanguage;
  direction: TextDirection;
  locale: string;
  setLanguage: (lang: SupportedLanguage, persistToUser?: boolean) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (dateOrTime: string | Date | null | undefined) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void | Promise<void>;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
  onLanguageChange,
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(initialLanguage);

  useEffect(() => {
    if (initialLanguage && isSupportedLanguage(initialLanguage) && initialLanguage !== language) {
      setLanguageState(initialLanguage);
    }
  }, [initialLanguage]);

  // Synchronize document dir and lang attributes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dir = getDirection(language);
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
      if (dir === 'rtl') {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    }
  }, [language]);

  const setLanguage = useCallback(
    async (newLang: SupportedLanguage, persistToUser = true) => {
      if (!isSupportedLanguage(newLang)) return;
      setLanguageState(newLang);
      if (onLanguageChange && persistToUser) {
        try {
          await onLanguageChange(newLang);
        } catch (e) {
          console.warn('[I18nProvider] Failed to persist language change:', e);
        }
      }
    },
    [onLanguageChange]
  );

  const translateFn = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(key, language, params);
    },
    [language]
  );

  const formatDateFn = useCallback(
    (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
      return formatDate(date, language, options);
    },
    [language]
  );

  const formatTimeFn = useCallback(
    (dateOrTime: string | Date | null | undefined) => {
      return formatTime(dateOrTime, language);
    },
    [language]
  );

  const formatNumberFn = useCallback(
    (num: number, options?: Intl.NumberFormatOptions) => {
      return formatNumber(num, language, options);
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      direction: getDirection(language),
      locale: getLocale(language),
      setLanguage,
      t: translateFn,
      formatDate: formatDateFn,
      formatTime: formatTimeFn,
      formatNumber: formatNumberFn,
    }),
    [language, setLanguage, translateFn, formatDateFn, formatTimeFn, formatNumberFn]
  );

  return React.createElement(I18nContext.Provider, { value }, children);
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Graceful fallback outside provider
    return {
      language: DEFAULT_LANGUAGE,
      direction: 'ltr',
      locale: 'en-GB',
      setLanguage: async () => {},
      t: (key: string, params?: Record<string, string | number>) => translate(key, 'en', params),
      formatDate: (d, opts) => formatDate(d, 'en', opts),
      formatTime: (d) => formatTime(d, 'en'),
      formatNumber: (n, opts) => formatNumber(n, 'en', opts),
    };
  }
  return context;
}

export const useTranslation = useI18n;
