/**
 * Centralized Language Resolution Service (Phase 6.2)
 * METI UniPods AI Innovation Programme 2026
 *
 * Enforces strict language resolution priority:
 * Web:
 *   1. Explicit user-selected UI language
 *   2. Stored user preferred_language
 *   3. Application default (en)
 *
 * WhatsApp:
 *   1. Explicit command preference (/language xx)
 *   2. Stored user preferred_language
 *   3. Detected language of current message
 *   4. Group language preference (if applicable)
 *   5. Application default (en)
 */

import { DEFAULT_LANGUAGE, LanguageResolutionInput, SUPPORTED_LANGUAGES, SupportedLanguage } from './types';
import { detectLanguage } from './languageDetector';

/**
 * Validates if a string is a supported language code
 */
export function isSupportedLanguage(lang?: string | null): lang is SupportedLanguage {
  if (!lang) return false;
  return Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES, lang.toLowerCase().trim());
}

/**
 * Normalizes any string to a supported language or null
 */
export function normalizeLanguage(lang?: string | null): SupportedLanguage | null {
  if (!lang) return null;
  const clean = lang.toLowerCase().trim();
  if (isSupportedLanguage(clean)) {
    return clean;
  }
  // Common aliases
  if (clean === 'français' || clean === 'francais' || clean === 'french') return 'fr';
  if (clean === 'english' || clean === 'anglais') return 'en';
  if (clean === 'português' || clean === 'portugues' || clean === 'portuguese') return 'pt';
  if (clean === 'arabic' || clean === 'arabe' || clean === 'العربية') return 'ar';

  return null;
}

/**
 * Resolves the active language based on context and priority hierarchy
 */
export function resolveLanguage(input: LanguageResolutionInput): SupportedLanguage {
  const { channel = 'WEB' } = input;

  if (channel === 'WEB') {
    // 1. Explicit user-selected UI language
    const explicit = normalizeLanguage(input.explicitLanguage);
    if (explicit) return explicit;

    // 2. Stored user preferred_language
    const userPref = normalizeLanguage(input.userPreferredLanguage);
    if (userPref) return userPref;

    // 3. Application default
    return DEFAULT_LANGUAGE;
  }

  // WHATSAPP CHANNEL
  // 1. Explicit command preference (e.g. /language fr)
  const explicit = normalizeLanguage(input.explicitLanguage);
  if (explicit) return explicit;

  // 2. Detected language of current message (for immediate response)
  const detected = normalizeLanguage(input.detectedMessageLanguage);
  if (detected) return detected;

  // 3. Stored user preferred_language (if message language ambiguous or command)
  const userPref = normalizeLanguage(input.userPreferredLanguage);
  if (userPref) return userPref;

  // 4. Group language preference (where applicable)
  const groupPref = normalizeLanguage(input.groupLanguage);
  if (groupPref) return groupPref;

  // 5. Default
  return DEFAULT_LANGUAGE;
}

/**
 * Quick helper for WhatsApp message processing
 */
export function resolveWhatsAppMessageLanguage(params: {
  messageText?: string | null;
  userPreferredLanguage?: SupportedLanguage | null;
  groupLanguage?: SupportedLanguage | null;
  explicitCommandLang?: SupportedLanguage | null;
}): SupportedLanguage {
  const detected = params.messageText ? detectLanguage(params.messageText) : null;

  return resolveLanguage({
    channel: 'WHATSAPP',
    explicitLanguage: params.explicitCommandLang,
    userPreferredLanguage: params.userPreferredLanguage,
    detectedMessageLanguage: detected,
    groupLanguage: params.groupLanguage,
  });
}
