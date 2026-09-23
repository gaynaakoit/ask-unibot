/**
 * WhatsApp Command Service (Ask UniBot Phase 4.4)
 *
 * Responsibilities:
 * - parseCommand(text)
 * - isCommand(text)
 * - handleCommand(params)
 *
 * Provides personal companion functionality for authenticated WhatsApp users:
 * - /help & /menu: Clean command directory
 * - /missed: Real recent meeting discussions & decisions from Supabase
 * - /actions: Personal actions for authenticated user from Supabase
 * - /recap: Personal progress & programme summary from Supabase
 * - /status: Participant status & WhatsApp verification without UUIDs
 * - /sources: Approved knowledge sources without sensitive metadata
 * - Unknown command fallback without sending to LLM
 *
 * Strictly enforces data isolation: unknown/blocked users are filtered before
 * calling personal commands, and authenticated queries strictly filter by userId.
 */

import {
  fetchActionsFromSupabase,
  fetchDecisionsFromSupabase,
  fetchMeetingsFromSupabase,
  fetchSourcesFromSupabase,
  fetchUserProfileFromSupabase,
} from './supabaseServer.js';

export interface WhatsAppCommandResult {
  handled: boolean;
  command?: string;
  response: string;
  requiresHuman?: boolean;
}

export interface HandleCommandParams {
  command: string;
  userId: string;
  participantName: string;
  phoneNumber: string;
}

export class WhatsAppCommandService {
  /**
   * Fast check to determine if a message is a slash command.
   * Case-insensitive, trims leading/trailing whitespace.
   * Natural language questions starting with words do NOT match.
   */
  public isCommand(text?: string | null): boolean {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return trimmed.startsWith('/') && trimmed.length > 1;
  }

  /**
   * Parses command name and raw arguments from text.
   * E.g. '  /ACTIONS ' -> { isCommand: true, command: 'actions', rawArgs: '' }
   */
  public parseCommand(text?: string | null): {
    isCommand: boolean;
    command?: string;
    rawArgs?: string;
  } {
    if (!this.isCommand(text)) {
      return { isCommand: false };
    }

    const trimmed = (text || '').trim();
    const withoutSlash = trimmed.slice(1).trim();
    const parts = withoutSlash.split(/\s+/);
    const command = parts[0].toLowerCase();
    const rawArgs = parts.slice(1).join(' ').trim();

    return {
      isCommand: true,
      command,
      rawArgs,
    };
  }

  /**
   * Routes and executes an official WhatsApp slash command.
   * STRICT SECURITY: Only called for KNOWN, authenticated participants.
   */
  public async handleCommand(params: HandleCommandParams): Promise<WhatsAppCommandResult> {
    const parsed = this.parseCommand(params.command);
    if (!parsed.isCommand || !parsed.command) {
      return {
        handled: false,
        response: this.formatUnknownCommandResponse(),
      };
    }

    const cmd = parsed.command;

    switch (cmd) {
      case 'help':
      case 'menu':
        return {
          handled: true,
          command: cmd,
          response: this.handleHelpCommand(),
        };

      case 'missed':
        return {
          handled: true,
          command: 'missed',
          response: await this.handleMissedCommand(params),
        };

      case 'actions':
        return {
          handled: true,
          command: 'actions',
          response: await this.handleActionsCommand(params),
        };

      case 'recap':
        return {
          handled: true,
          command: 'recap',
          response: await this.handleRecapCommand(params),
        };

      case 'status':
        return {
          handled: true,
          command: 'status',
          response: await this.handleStatusCommand(params),
        };

      case 'sources':
        return {
          handled: true,
          command: 'sources',
          response: await this.handleSourcesCommand(),
        };

      default:
        // Unknown command: Return friendly guidance, NEVER route to LLM
        return {
          handled: true,
          command: cmd,
          response: this.formatUnknownCommandResponse(),
        };
    }
  }

  // ---------------------------------------------------------------------------
  // 1. /help & /menu
  // ---------------------------------------------------------------------------
  public handleHelpCommand(): string {
    return (
      `🤖 Ask UniBot\n\n` +
      `Je peux vous aider à :\n\n` +
      `• /missed — Voir ce que vous avez manqué\n` +
      `• /actions — Voir vos actions\n` +
      `• /recap — Votre récapitulatif\n` +
      `• /status — Voir votre statut\n` +
      `• /sources — Voir les sources approuvées\n` +
      `• /help — Afficher cette aide\n\n` +
      `Vous pouvez aussi me poser directement une question en langage naturel.`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. /missed
  // ---------------------------------------------------------------------------
  public async handleMissedCommand(params: HandleCommandParams): Promise<string> {
    try {
      const [meetings, decisions] = await Promise.all([
        fetchMeetingsFromSupabase(),
        fetchDecisionsFromSupabase(),
      ]);

      if (!meetings || meetings.length === 0) {
        return (
          `📌 WHAT YOU MISSED\n\n` +
          `Je n'ai pas encore trouvé d'information récente à vous signaler.\n\n` +
          `Vous pouvez me poser une question directement.`
        );
      }

      // Find the most recent meeting
      const latestMeeting = meetings[0];
      const meetingDecisions = latestMeeting.decisions && latestMeeting.decisions.length > 0
        ? latestMeeting.decisions
        : decisions.filter((d) => d.status === 'active').slice(0, 2);

      const decisionBullets = meetingDecisions.length > 0
        ? meetingDecisions.slice(0, 3).map((d) => `• ${d.title || d.decision}`).join('\n')
        : '• Aucune nouvelle décision enregistrée pour cette session.';

      const takeaways = latestMeeting.whatWasDiscussed && latestMeeting.whatWasDiscussed.length > 0
        ? latestMeeting.whatWasDiscussed.slice(0, 3).map((item) => `• ${item}`).join('\n')
        : '• Révision du calendrier et alignement sur les livrables.';

      return (
        `📌 WHAT YOU MISSED\n\n` +
        `Réunion : ${latestMeeting.title}\n` +
        `Date : ${latestMeeting.date}\n\n` +
        `Décisions :\n` +
        `${decisionBullets}\n\n` +
        `À retenir :\n` +
        `${takeaways}\n\n` +
        `👉 Posez-moi une question si vous voulez plus de détails.`
      );
    } catch (err: any) {
      console.warn('[WhatsAppCommand] Error in /missed handler:', err?.message || err);
      return (
        `📌 WHAT YOU MISSED\n\n` +
        `Je n'ai pas encore trouvé d'information récente à vous signaler.\n\n` +
        `Vous pouvez me poser une question directement.`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 3. /actions
  // ---------------------------------------------------------------------------
  public async handleActionsCommand(params: HandleCommandParams): Promise<string> {
    try {
      // STRICT USER ISOLATION: query only actions belonging to params.userId
      const actions = await fetchActionsFromSupabase(params.userId);

      if (!actions || actions.length === 0) {
        return (
          `✅ MES ACTIONS\n\n` +
          `Vous n'avez actuellement aucune action enregistrée.`
        );
      }

      const formattedList = actions
        .slice(0, 5)
        .map((act, index) => {
          const statusText = act.status ? String(act.status) : 'pending';
          return `${index + 1}. ${act.title}\n   Échéance : ${act.dueDate}\n   Statut : ${statusText}`;
        })
        .join('\n\n');

      return `✅ MES ACTIONS\n\n${formattedList}`;
    } catch (err: any) {
      console.warn('[WhatsAppCommand] Error in /actions handler:', err?.message || err);
      return (
        `✅ MES ACTIONS\n\n` +
        `Vous n'avez actuellement aucune action enregistrée.`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 4. /recap
  // ---------------------------------------------------------------------------
  public async handleRecapCommand(params: HandleCommandParams): Promise<string> {
    try {
      const [decisions, meetings, actions] = await Promise.all([
        fetchDecisionsFromSupabase(),
        fetchMeetingsFromSupabase(),
        fetchActionsFromSupabase(params.userId),
      ]);

      const activeDecisions = (decisions || []).filter((d) => d.status === 'active').slice(0, 2);
      const recentMeetings = (meetings || []).slice(0, 1);
      const userActions = (actions || []).slice(0, 2);

      const hasContent = activeDecisions.length > 0 || recentMeetings.length > 0 || userActions.length > 0;

      if (!hasContent) {
        return (
          `📝 MON RÉCAP\n\n` +
          `Je n'ai pas encore suffisamment d'activité récente pour générer un récapitulatif.`
        );
      }

      const sections: string[] = ['📝 MON RÉCAP\n\nDepuis votre dernière activité :'];

      if (activeDecisions.length > 0) {
        sections.push(
          `📌 Décisions\n` +
          activeDecisions.map((d) => `• ${d.title || d.decision}`).join('\n')
        );
      }

      if (recentMeetings.length > 0) {
        sections.push(
          `📅 Réunions\n` +
          recentMeetings.map((m) => `• ${m.title} (${m.date})`).join('\n')
        );
      }

      if (userActions.length > 0) {
        sections.push(
          `✅ Actions\n` +
          userActions.map((a) => `• ${a.title} (${a.dueDate})`).join('\n')
        );
      }

      sections.push('👉 Posez-moi une question pour approfondir.');

      return sections.join('\n\n');
    } catch (err: any) {
      console.warn('[WhatsAppCommand] Error in /recap handler:', err?.message || err);
      return (
        `📝 MON RÉCAP\n\n` +
        `Je n'ai pas encore suffisamment d'activité récente pour générer un récapitulatif.`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 5. /status
  // ---------------------------------------------------------------------------
  public async handleStatusCommand(params: HandleCommandParams): Promise<string> {
    try {
      const profile = await fetchUserProfileFromSupabase(params.userId);

      const resolvedName = profile?.name || params.participantName || 'Participant';
      let track = profile?.track || 'AI';
      if (track.includes('&') || track.length > 25) {
        track = 'AI Solutions';
      }

      return (
        `👤 MON STATUT\n\n` +
        `Nom : ${resolvedName}\n` +
        `Track : ${track}\n` +
        `Compte : Actif\n` +
        `WhatsApp : Vérifié\n\n` +
        `Vous pouvez maintenant poser directement vos questions à Ask UniBot.`
      );
    } catch (err: any) {
      console.warn('[WhatsAppCommand] Error in /status handler:', err?.message || err);
      return (
        `👤 MON STATUT\n\n` +
        `Nom : ${params.participantName || 'Participant'}\n` +
        `Track : AI\n` +
        `Compte : Actif\n` +
        `WhatsApp : Vérifié\n\n` +
        `Vous pouvez maintenant poser directement vos questions à Ask UniBot.`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 6. /sources
  // ---------------------------------------------------------------------------
  public async handleSourcesCommand(): Promise<string> {
    try {
      const sources = await fetchSourcesFromSupabase();
      const approved = (sources || []).filter((s) => s.approved);

      // Collect clean official publisher / title representations
      const cleanNames: string[] = [];
      const seen = new Set<string>();

      for (const s of approved) {
        // Normalize name to friendly title without IDs
        const candidate = s.publisher || s.title;
        if (candidate && !seen.has(candidate)) {
          seen.add(candidate);
          cleanNames.push(candidate);
        }
      }

      // Default standard official programme sources if empty
      const displaySources = cleanNames.length > 0
        ? cleanNames.slice(0, 5)
        : [
            'UniPods WhatsApp',
            'Wadhwani Foundation',
            'MIT Learn',
            'MIT',
            'Programme officiel UniPods AI Innovation',
          ];

      const bullets = displaySources.map((name) => `• ${name}`).join('\n');

      return (
        `📚 SOURCES APPROUVÉES\n\n` +
        `${bullets}\n\n` +
        `Ces sources sont utilisées pour vérifier les réponses d'Ask UniBot.`
      );
    } catch (err: any) {
      console.warn('[WhatsAppCommand] Error in /sources handler:', err?.message || err);
      return (
        `📚 SOURCES APPROUVÉES\n\n` +
        `• UniPods WhatsApp\n` +
        `• Wadhwani Foundation\n` +
        `• MIT Learn\n` +
        `• MIT\n` +
        `• Programme officiel UniPods AI Innovation\n\n` +
        `Ces sources sont utilisées pour vérifier les réponses d'Ask UniBot.`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Unknown command
  // ---------------------------------------------------------------------------
  public formatUnknownCommandResponse(): string {
    return (
      `🤖 Je ne reconnais pas cette commande.\n\n` +
      `Essayez /help pour voir les commandes disponibles.\n\n` +
      `Vous pouvez aussi me poser directement votre question.`
    );
  }
}

export const whatsappCommandService = new WhatsAppCommandService();
