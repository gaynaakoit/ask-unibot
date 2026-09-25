/**
 * Ask UniBot — Multilingual Types (Phase 6.2)
 * METI UniPods AI Innovation Programme 2026
 */

export type SupportedLanguage = 'en' | 'fr' | 'pt' | 'ar';

export type TextDirection = 'ltr' | 'rtl';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: TextDirection;
  locale: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageMeta> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    locale: 'en-GB',
    flag: '🇬🇧',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    locale: 'fr-FR',
    flag: '🇫🇷',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    locale: 'pt-PT',
    flag: '🇵🇹',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    locale: 'ar-SA',
    flag: '🇸🇦',
  },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export interface LanguageResolutionInput {
  explicitLanguage?: SupportedLanguage | null;
  userPreferredLanguage?: SupportedLanguage | null;
  detectedMessageLanguage?: SupportedLanguage | null;
  groupLanguage?: SupportedLanguage | null;
  channel?: 'WEB' | 'WHATSAPP';
}
