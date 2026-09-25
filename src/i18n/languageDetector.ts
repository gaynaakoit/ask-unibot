/**
 * Lightweight, Deterministic Language Detector
 * METI UniPods AI Innovation Programme 2026
 *
 * Supports: en (English), fr (Français), pt (Português), ar (العربية)
 * Never invokes an external LLM solely to detect language.
 */

import { SupportedLanguage } from './types';

// Arabic character set regex (covers Arabic, Arabic Supplement, Presentation Forms)
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// French markers
const FR_KEYWORDS = [
  'bonjour', 'salut', 'merci', 'quelles', 'quelle', 'quels', 'quel', 'comment',
  'pourquoi', 'quand', 'est-ce', 'actions', 'attente', 'prochaine', 'session',
  'décision', 'décisions', 'échéance', 'date', 'limite', 'réunion', 'programme',
  'aide', 'statut', 'source', 'sources', 'résumé', 'rappel', 'rappels', 'merci',
  'sont', 'mes', 'des', 'les', 'une', 'dans', 'pour', 'avec', 'sur', 'qui'
];

const FR_ACCENTS = /[éèêëàâîïôûùçœ]/i;

// Portuguese markers
const PT_KEYWORDS = [
  'olá', 'ola', 'obrigado', 'obrigada', 'quais', 'qual', 'como', 'quando',
  'porque', 'ações', 'acoes', 'pendentes', 'próxima', 'proxima', 'sessão',
  'sessao', 'decisões', 'decisoes', 'prazo', 'prazos', 'reunião', 'reuniao',
  'programa', 'ajuda', 'estado', 'fontes', 'resumo', 'lembrete', 'lembretes',
  'são', 'sao', 'minhas', 'meus', 'uma', 'para', 'com', 'onde', 'quem'
];

const PT_ACCENTS = /[ãõáéíóúâêôç]/i;

// English markers
const EN_KEYWORDS = [
  'hello', 'hi', 'hey', 'thanks', 'thank', 'what', 'when', 'where', 'which',
  'who', 'why', 'how', 'are', 'my', 'pending', 'actions', 'action', 'next',
  'session', 'decision', 'decisions', 'deadline', 'deadlines', 'meeting',
  'meetings', 'programme', 'program', 'help', 'status', 'sources', 'source',
  'recap', 'reminders', 'reminder', 'missed', 'memory', 'is', 'the', 'for'
];

/**
 * Detects the language of a text message deterministically.
 * Returns null if the language is ambiguous or undetectable.
 */
export function detectLanguage(text?: string | null): SupportedLanguage | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }

  // 1. Arabic: high-confidence script match
  if (ARABIC_REGEX.test(trimmed)) {
    return 'ar';
  }

  // Tokenize
  const lower = trimmed.toLowerCase();
  const words = lower
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return null;
  }

  let frScore = 0;
  let ptScore = 0;
  let enScore = 0;

  // Accents count heavily
  if (FR_ACCENTS.test(lower)) {
    // Distinguish French-specific accents (like è, ê, à) vs Portuguese-specific (ã, õ)
    if (/[ãõ]/.test(lower)) {
      ptScore += 3;
    }
    if (/[éèêëàâîïôûù]/.test(lower)) {
      frScore += 2;
    }
  }

  for (const word of words) {
    if (FR_KEYWORDS.includes(word)) frScore += 2;
    if (PT_KEYWORDS.includes(word)) ptScore += 2;
    if (EN_KEYWORDS.includes(word)) enScore += 2;

    // Distinctive unigrams
    if (word === 'quelles' || word === 'mes' || word === 'sont' || word === 'attente' || word === 'prochaine') frScore += 3;
    if (word === 'quais' || word === 'minhas' || word === 'são' || word === 'acoes' || word === 'ações' || word === 'obrigado') ptScore += 3;
    if (word === 'what' || word === 'when' || word === 'pending' || word === 'deadlines' || word === 'missed') enScore += 3;
  }

  const maxScore = Math.max(frScore, ptScore, enScore);
  if (maxScore < 2) {
    return null; // Ambiguous
  }

  if (ptScore > frScore && ptScore > enScore) return 'pt';
  if (frScore > ptScore && frScore > enScore) return 'fr';
  if (enScore > frScore && enScore > ptScore) return 'en';

  return null;
}
