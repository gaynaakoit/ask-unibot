/**
 * Group Message Classifier (Ask UniBot Phase 5)
 * METI UniPods AI Innovation Programme 2026
 *
 * Responsibilities:
 * - Deterministic classification of WhatsApp group messages
 * - Categories:
 *   ANNOUNCEMENT, DECISION, DEADLINE, EVENT, ACTION, QUESTION,
 *   ANSWER, RESOURCE, CLARIFICATION, FEEDBACK, GENERAL_CHAT, UNKNOWN
 * - Direct question detection (@Ask UniBot, mentions, or slash commands)
 * - Smart Silence enforcement:
 *   Spontaneous chatter, feedback, announcements, and general chat are silenced
 *   Direct questions and slash commands are actively processed
 * - Fully deterministic with optional Gemini semantic enhancement fallback
 */

import { GroupMessageCategory, GroupMessageClassification } from '../types.js';
import { whatsappCommandService } from './whatsappCommandService.js';

export class GroupMessageClassifier {
  /**
   * Deterministically classifies group messages based on syntax, intent markers, and phrasing.
   */
  public classify(text: string, senderRole: string = 'MEMBER'): GroupMessageClassification {
    const trimmed = (text || '').trim();
    const lower = trimmed.toLowerCase();

    // 1. Check if message is a slash command
    const parsedCmd = whatsappCommandService.parseCommand(trimmed);
    if (parsedCmd.isCommand && parsedCmd.command) {
      return {
        category: 'QUESTION',
        confidence: 'HIGH',
        isDirectQuestionToBot: true,
        isCommand: true,
        commandName: parsedCmd.command,
        shouldSilence: false,
        reason: `Command /${parsedCmd.command} detected`,
      };
    }

    // 2. Check if explicitly addressed to Ask UniBot
    const isDirectlyAddressed =
      lower.includes('@ask unibot') ||
      lower.includes('@unibot') ||
      lower.includes('ask unibot') ||
      lower.startsWith('unibot') ||
      lower.startsWith('@bot');

    // 3. DEADLINE markers
    const deadlineKeywords = [
      'deadline',
      'date limite',
      'date butoir',
      'échéance',
      'echeance',
      'due date',
      'soumission avant',
      'à soumettre avant',
      'before 23:59',
      'avant 23h59',
      'avant minuit',
    ];
    const hasDeadline = deadlineKeywords.some((kw) => lower.includes(kw));

    // 4. ANNOUNCEMENT markers
    const announcementKeywords = [
      'annonce',
      'announcement',
      'rappel officiel',
      'official reminder',
      'important :',
      'attention :',
      'veuillez noter',
      'please note',
      'avis à tous',
      'chers participants',
      'dear cohort',
      'broadcast',
    ];
    const hasAnnouncement = announcementKeywords.some((kw) => lower.includes(kw));

    // 5. DECISION markers
    const decisionKeywords = [
      'décision',
      'decision',
      'décidé',
      'decide',
      'validé par',
      'valide par',
      'approuvé par',
      'arbitré',
      'comité a tranché',
      'retenu pour',
      'resolution',
    ];
    const hasDecision = decisionKeywords.some((kw) => lower.includes(kw));

    // 6. EVENT markers
    const eventKeywords = [
      'session interactive',
      'live session',
      'webinar',
      'atelier',
      'workshop',
      'réunion',
      'reunion',
      'meeting',
      'ms teams',
      'google meet',
      'sur zoom',
      'en présentiel',
    ];
    const hasEvent = eventKeywords.some((kw) => lower.includes(kw));

    // 7. ACTION markers
    const actionKeywords = [
      'action requise',
      'action item',
      'à faire :',
      'a faire :',
      'devoir :',
      'livrable :',
      'chaque équipe doit',
      'chaque participant doit',
      'tâche :',
      'tache :',
      'todo',
    ];
    const hasAction = actionKeywords.some((kw) => lower.includes(kw));

    // 8. QUESTION markers
    const questionMarkers = [
      '?',
      'est-ce que',
      'comment',
      'pourquoi',
      'quand',
      'qui peut',
      'où trouver',
      'ou trouver',
      'quel est',
      'quelle est',
      'what is',
      'when is',
      'how to',
      'can we',
      'is it',
    ];
    const hasQuestionMark = trimmed.includes('?');
    const startsWithQuestionWord = questionMarkers.some((qm) => lower.startsWith(qm) || lower.includes(` ${qm}`));

    // 9. FEEDBACK markers
    const feedbackKeywords = [
      'feedback',
      'retour',
      'avis',
      'mon avis',
      'je pense que',
      'à mon sens',
      'suggestion',
      'remarque',
    ];
    const hasFeedback = feedbackKeywords.some((kw) => lower.includes(kw));

    // 10. RESOURCE markers
    const resourceKeywords = [
      'http://',
      'https://',
      'drive.google.com',
      'github.com',
      'notion.so',
      'slides',
      'support de cours',
      'documentation officielle',
    ];
    const hasResource = resourceKeywords.some((kw) => lower.includes(kw));

    // 11. GENERAL CHAT (Salutations, polite chatter, emojis)
    const chatPhrases = [
      'bonjour',
      'bonsoir',
      'salut',
      'hello',
      'hi',
      'merci',
      'merci beaucoup',
      'thanks',
      'thank you',
      'bonne journée',
      'bonne journee',
      'bonne soirée',
      'super',
      'cool',
      'top',
      'parfait',
      'd\'accord',
      'noté',
      'bien reçu',
      'ok',
      '👍',
      '🙏',
      '👏',
      '😊',
    ];
    const isPureChat =
      chatPhrases.some((cp) => lower === cp || lower.startsWith(`${cp} `) || lower.endsWith(` ${cp}`)) &&
      trimmed.length < 80 &&
      !hasDeadline &&
      !hasDecision;

    // --- Classification Resolution Logic ---

    // Direct question to Ask UniBot
    if (isDirectlyAddressed || (hasQuestionMark && isDirectlyAddressed)) {
      return {
        category: 'QUESTION',
        confidence: 'HIGH',
        isDirectQuestionToBot: true,
        isCommand: false,
        shouldSilence: false,
        reason: 'Direct question addressed to Ask UniBot',
      };
    }

    // Question among participants (not directly to bot)
    if (hasQuestionMark && (startsWithQuestionWord || lower.startsWith('est-ce') || lower.startsWith('did '))) {
      return {
        category: 'QUESTION',
        confidence: 'MEDIUM',
        isDirectQuestionToBot: false,
        isCommand: false,
        // Smart Silence: Do not interrupt group questions unless addressed to bot or an admin triggers it
        shouldSilence: true,
        reason: 'Participant peer question in group conversation',
      };
    }

    // Deadlines
    if (hasDeadline) {
      const isPrivilegedSender = ['ADMIN', 'FACILITATOR', 'ORGANIZER'].includes(senderRole.toUpperCase());
      return {
        category: 'DEADLINE',
        confidence: isPrivilegedSender ? 'HIGH' : 'MEDIUM',
        isDirectQuestionToBot: false,
        isCommand: false,
        shouldSilence: true, // Memory is extracted silently; bot stays quiet
        reason: 'Submission or project deadline announcement',
      };
    }

    // Decisions
    if (hasDecision) {
      const isPrivilegedSender = ['ADMIN', 'FACILITATOR', 'ORGANIZER'].includes(senderRole.toUpperCase());
      return {
        category: 'DECISION',
        confidence: isPrivilegedSender ? 'HIGH' : 'MEDIUM',
        isDirectQuestionToBot: false,
        isCommand: false,
        shouldSilence: true, // Extracted silently
        reason: 'Programme decision or committee consensus',
      };
    }

    // Official announcements
    if (hasAnnouncement) {
      return {
        category: 'ANNOUNCEMENT',
        confidence: 'HIGH',
        isDirectQuestionToBot: false,
        isCommand: false,
        shouldSilence: true, // Extracted silently
        reason: 'Programme announcement broadcast',
      };
    }

    // Events / Sessions
    if (hasEvent) {
      return {
        category: 'EVENT',
        confidence: 'HIGH',
        isDirectQuestionToBot: false,
        isCommand: false,
        shouldSilence: true, // Extracted silently
        reason: 'Upcoming live session or workshop notification',
      };
    }

    // Actions
    if (hasAction) {
      return {
        category: 'ACTION',
        confidence: 'HIGH',
        isDirectQuestionToBot: false,
        isCommand: false,
        shouldSilence: true,
        reason: 'Action item or task assigned to cohort',
      };
    }

    // Resources
    if (hasResource) {
      return {
        category: 'RESOURCE',
        confidence: 'MEDIUM',
        isDirectQuestionToBot: false,
        isCommand: false,
        shouldSilence: true,
        reason: 'Shared link, slides, or repository',
      };
    }

    // Feedback
    if (hasFeedback) {
      return {
        category: 'FEEDBACK',
        confidence: 'MEDIUM',
        isDirectQuestionToBot: false,
        isCommand: false,
        shouldSilence: true,
        reason: 'Participant feedback or commentary',
      };
    }

    // General Chat
    if (isPureChat || trimmed.length < 35) {
      return {
        category: 'GENERAL_CHAT',
        confidence: 'HIGH',
        isDirectQuestionToBot: false,
        isCommand: false,
        shouldSilence: true,
        reason: 'Conversational courtesy or pleasantry',
      };
    }

    // Fallback: General chat with lower confidence
    return {
      category: 'GENERAL_CHAT',
      confidence: 'LOW',
      isDirectQuestionToBot: false,
      isCommand: false,
      shouldSilence: true,
      reason: 'General conversational text',
    };
  }
}

export const groupMessageClassifier = new GroupMessageClassifier();
