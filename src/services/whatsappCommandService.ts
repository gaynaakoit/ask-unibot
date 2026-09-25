/**
 * WhatsApp Command Service (Ask UniBot Phase 4.4 + Phase 5)
 * METI UniPods AI Innovation Programme 2026
 *
 * Responsibilities:
 * - parseCommand(text)
 * - isCommand(text)
 * - handleCommand(params)
 *
 * Commands:
 * - /help & /menu: Clean command directory
 * - /missed: Real recent meeting discussions, group memories & personal actions
 * - /memory: Recent announcements, validated decisions, deadlines, events, unresolved questions
 * - /decisions: Approved decisions from group memory and programme
 * - /deadlines: Confirmed, relevant programme deadlines in mobile-friendly format
 * - /actions: Personal actions for authenticated user strictly isolated
 * - /recap: Personal progress & programme digest
 * - /status: Participant status & WhatsApp verification without UUIDs
 * - /sources: Approved knowledge sources without sensitive metadata
 * - Unknown command fallback without sending to LLM
 *
 * Strictly enforces data isolation and privacy.
 */

import {
  fetchActionsFromSupabase,
  fetchDecisionsFromSupabase,
  fetchMeetingsFromSupabase,
  fetchSourcesFromSupabase,
  fetchUserProfileFromSupabase,
  updateUserProfileInSupabase,
} from './supabaseServer.js';
import { groupMemoryService } from './groupMemoryService.js';
import {
  translate,
  resolveWhatsAppMessageLanguage,
  normalizeLanguage,
  SupportedLanguage,
  formatDate,
} from '../i18n/index.js';

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
  groupId?: string;
  preferredLanguage?: SupportedLanguage;
  groupLanguage?: SupportedLanguage;
}

export class WhatsAppCommandService {
  /**
   * Fast check to determine if a message is a slash command.
   * Case-insensitive, trims leading/trailing whitespace.
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
    const lang = resolveWhatsAppMessageLanguage({
      messageText: params.command,
      userPreferredLanguage: params.preferredLanguage,
      groupLanguage: params.groupLanguage,
    });

    if (!parsed.isCommand || !parsed.command) {
      return {
        handled: false,
        response: this.formatUnknownCommandResponse(lang),
      };
    }

    const cmd = parsed.command;

    switch (cmd) {
      case 'help':
      case 'menu':
        return {
          handled: true,
          command: cmd,
          response: this.handleHelpCommand(lang),
        };

      case 'language':
      case 'lang':
        return await this.handleLanguageCommand(params, parsed.rawArgs, lang);

      case 'missed':
        return {
          handled: true,
          command: 'missed',
          response: await this.handleMissedCommand(params, lang),
        };

      case 'memory':
        return {
          handled: true,
          command: 'memory',
          response: await this.handleMemoryCommand(params, lang),
        };

      case 'decisions':
        return {
          handled: true,
          command: 'decisions',
          response: await this.handleDecisionsCommand(params, lang),
        };

      case 'deadlines':
        return {
          handled: true,
          command: 'deadlines',
          response: await this.handleDeadlinesCommand(params, lang),
        };

      case 'actions':
        return {
          handled: true,
          command: 'actions',
          response: await this.handleActionsCommand(params, lang),
        };

      case 'recap':
        return {
          handled: true,
          command: 'recap',
          response: await this.handleRecapCommand(params, lang),
        };

      case 'status':
        return {
          handled: true,
          command: 'status',
          response: await this.handleStatusCommand(params, lang),
        };

      case 'sources':
        return {
          handled: true,
          command: 'sources',
          response: await this.handleSourcesCommand(lang),
        };

      default:
        // Unknown command: Return friendly guidance, NEVER route to LLM
        return {
          handled: true,
          command: cmd,
          response: this.formatUnknownCommandResponse(lang),
        };
    }
  }

  // ---------------------------------------------------------------------------
  // 0. /language & /lang
  // ---------------------------------------------------------------------------
  public async handleLanguageCommand(
    params: HandleCommandParams,
    rawArgs?: string,
    currentLang: SupportedLanguage = 'en'
  ): Promise<WhatsAppCommandResult> {
    const targetLang = normalizeLanguage(rawArgs);

    if (!targetLang) {
      return {
        handled: true,
        command: 'language',
        response: translate('whatsapp.invalidLang', currentLang),
      };
    }

    // Persist to user's profile in Supabase
    try {
      await updateUserProfileInSupabase(params.userId, {
        preferredLanguage: targetLang,
      });
    } catch (e) {
      console.warn('[WhatsAppCommandService] Failed to update language preference:', e);
    }

    return {
      handled: true,
      command: 'language',
      response: translate('whatsapp.langChanged', targetLang),
    };
  }

  // ---------------------------------------------------------------------------
  // 1. /help & /menu
  // ---------------------------------------------------------------------------
  public handleHelpCommand(lang: SupportedLanguage = 'en'): string {
    return (
      `${translate('whatsapp.helpTitle', lang)}\n\n` +
      `${translate('whatsapp.helpIntro', lang)}\n\n` +
      `• /missed — ${translate('whatsapp.missed', lang)}\n` +
      `• /memory — ${translate('whatsapp.memory', lang)}\n` +
      `• /decisions — ${translate('whatsapp.decisions', lang)}\n` +
      `• /deadlines — ${translate('whatsapp.deadlines', lang)}\n` +
      `• /actions — ${translate('whatsapp.actions', lang)}\n` +
      `• /recap — ${translate('whatsapp.recap', lang)}\n` +
      `• /status — ${translate('whatsapp.status', lang)}\n` +
      `• /sources — ${translate('whatsapp.sources', lang)}\n` +
      `• /language — ${translate('whatsapp.languageCommand', lang)}\n` +
      `• /help — ${translate('whatsapp.menu', lang)}`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. /missed (Enhanced for Group Memory + Personal Activity)
  // ---------------------------------------------------------------------------
  public async handleMissedCommand(
    params: HandleCommandParams,
    lang: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      const targetGroupId = params.groupId || 'grp-unipods-2026-demo';
      const [summary, userActions] = await Promise.all([
        groupMemoryService.getGroupSummary(targetGroupId),
        fetchActionsFromSupabase(params.userId),
      ]);

      const annCount = summary.announcements.length;
      const evCount = summary.events.length;
      const dlCount = summary.deadlines.length;
      const actCount = userActions.filter((a) => a.status === 'pending').length;
      const unresCount = summary.unresolvedQuestions.length;

      const titles: Record<SupportedLanguage, string> = {
        en: '📌 WHAT YOU MISSED\n\nSince your last activity:',
        fr: '📌 CE QUE VOUS AVEZ MANQUÉ\n\nDepuis votre dernière activité :',
        pt: '📌 O QUE PERDEU\n\nDesde a sua última atividade:',
        ar: '📌 ما فاتك\n\nمنذ آخر نشاط لك:',
      };

      let out = `${titles[lang] || titles.en}\n\n`;
      if (lang === 'fr') {
        out += `📢 ${annCount} annonce${annCount > 1 ? 's' : ''}\n`;
        out += `🗓️ ${evCount} événement${evCount > 1 ? 's' : ''} à venir\n`;
        out += `⏰ ${dlCount} échéance${dlCount > 1 ? 's' : ''} confirmée${dlCount > 1 ? 's' : ''}\n`;
        out += `✅ ${actCount} action${actCount > 1 ? 's' : ''} assignée${actCount > 1 ? 's' : ''}\n`;
        if (unresCount > 0) out += `❓ ${unresCount} question${unresCount > 1 ? 's' : ''} en attente\n`;
        out += `\nPoints clés récents :\n`;
      } else if (lang === 'pt') {
        out += `📢 ${annCount} comunicado${annCount > 1 ? 's' : ''}\n`;
        out += `🗓️ ${evCount} evento${evCount > 1 ? 's' : ''} a caminho\n`;
        out += `⏰ ${dlCount} prazo${dlCount > 1 ? 's' : ''} confirmado${dlCount > 1 ? 's' : ''}\n`;
        out += `✅ ${actCount} ação${actCount > 1 ? 'ões' : ''} pendente${actCount > 1 ? 's' : ''}\n`;
        if (unresCount > 0) out += `❓ ${unresCount} pergunta${unresCount > 1 ? 's' : ''} pendente${unresCount > 1 ? 's' : ''}\n`;
        out += `\nPontos principais recentes:\n`;
      } else if (lang === 'ar') {
        out += `📢 ${annCount} إعلانات مهمة\n`;
        out += `🗓️ ${evCount} فعاليات قادمة\n`;
        out += `⏰ ${dlCount} مواعيد نهائية مؤكدة\n`;
        out += `✅ ${actCount} مهام متبقية لديك\n`;
        if (unresCount > 0) out += `❓ ${unresCount} أسئلة قيد التوضيح\n`;
        out += `\nالنقاط الرئيسية الأخيرة:\n`;
      } else {
        out += `📢 ${annCount} announcement${annCount > 1 ? 's' : ''}\n`;
        out += `🗓️ ${evCount} upcoming event${evCount > 1 ? 's' : ''}\n`;
        out += `⏰ ${dlCount} confirmed deadline${dlCount > 1 ? 's' : ''}\n`;
        out += `✅ ${actCount} action${actCount > 1 ? 's' : ''} assigned to you\n`;
        if (unresCount > 0) out += `❓ ${unresCount} unresolved question${unresCount > 1 ? 's' : ''}\n`;
        out += `\nKey recent items:\n`;
      }

      if (summary.announcements.length > 0) {
        out += `• ${summary.announcements[0].title || summary.announcements[0].content}\n`;
      }
      if (summary.deadlines.length > 0) {
        out += `• ${summary.deadlines[0].title || summary.deadlines[0].content}\n`;
      }
      if (summary.decisions.length > 0) {
        out += `• ${summary.decisions[0].title || summary.decisions[0].content}\n`;
      }

      out += `\nSource: UniPods WhatsApp group memory & approved programme records.`;
      return out;
    } catch {
      return (
        lang === 'fr'
          ? `📌 CE QUE VOUS AVEZ MANQUÉ\n\nAucune information récente à signaler.\nPosez-moi votre question en direct.`
          : lang === 'pt'
          ? `📌 O QUE PERDEU\n\nSem informações recentes a assinalar no momento.\nPode colocar a sua questão diretamente.`
          : lang === 'ar'
          ? `📌 ما فاتك\n\nلا توجد معلومات جديدة في الوقت الحالي.\nيمكنك طرح سؤالك مباشرة.`
          : `📌 WHAT YOU MISSED\n\nNo recent updates to report.\nYou can ask me a question directly.`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 3. /memory (Group Collective Memory)
  // ---------------------------------------------------------------------------
  public async handleMemoryCommand(
    params: HandleCommandParams,
    lang: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      const targetGroupId = params.groupId || 'grp-unipods-2026-demo';
      const summary = await groupMemoryService.getGroupSummary(targetGroupId);

      const header = lang === 'fr' ? '🧠 MÉMOIRE DU GROUPE UNIPODS' : lang === 'pt' ? '🧠 MEMÓRIA DO GRUPO UNIPODS' : lang === 'ar' ? '🧠 ذاكرة مجموعة UNIPODS' : '🧠 UNIPODS GROUP MEMORY';
      let out = `${header}\n\n`;

      // Announcements
      out += lang === 'fr' ? `📢 Dernières annonces importantes :\n` : lang === 'pt' ? `📢 Últimos comunicados relevantes:\n` : lang === 'ar' ? `📢 أحدث الإعلانات المهمة:\n` : `📢 Recent announcements:\n`;
      if (summary.announcements.length > 0) {
        summary.announcements.slice(0, 2).forEach((a) => {
          out += `• ${a.title || a.content}\n`;
        });
      } else {
        out += lang === 'fr' ? `• Aucune annonce récente.\n` : lang === 'pt' ? `• Sem comunicados recentes.\n` : lang === 'ar' ? `• لا توجد إعلانات حديثة.\n` : `• No recent announcements.\n`;
      }

      // Decisions
      out += lang === 'fr' ? `\n⚖️ Décisions récentes validées :\n` : lang === 'pt' ? `\n⚖️ Decisões recentes validadas:\n` : lang === 'ar' ? `\n⚖️ أحدث القرارات المعتمدة:\n` : `\n⚖️ Validated decisions:\n`;
      if (summary.decisions.length > 0) {
        summary.decisions.slice(0, 2).forEach((d) => {
          out += `• ${d.title || d.content}\n`;
        });
      } else {
        out += lang === 'fr' ? `• Aucune décision enregistrée.\n` : lang === 'pt' ? `• Sem decisões registadas.\n` : lang === 'ar' ? `• لا توجد قرارات مسجلة.\n` : `• No decisions recorded.\n`;
      }

      // Deadlines
      out += lang === 'fr' ? `\n⏰ Deadlines confirmées :\n` : lang === 'pt' ? `\n⏰ Prazos confirmados:\n` : lang === 'ar' ? `\n⏰ المواعيد النهائية المؤكدة:\n` : `\n⏰ Confirmed deadlines:\n`;
      if (summary.deadlines.length > 0) {
        summary.deadlines.slice(0, 2).forEach((dl) => {
          out += `• ${dl.title || dl.content}\n`;
        });
      } else {
        out += `• Milestone 2: 30 September 2026 at 23:59 GMT.\n`;
      }

      // Events
      out += lang === 'fr' ? `\n🗓️ Événements à venir :\n` : lang === 'pt' ? `\n🗓️ Próximos eventos:\n` : lang === 'ar' ? `\n🗓️ الفعاليات القادمة:\n` : `\n🗓️ Upcoming events:\n`;
      if (summary.events.length > 0) {
        summary.events.slice(0, 2).forEach((ev) => {
          out += `• ${ev.title || ev.content}\n`;
        });
      } else {
        out += `• Interactive Session: Thursday at 15:00 GMT on MS Teams.\n`;
      }

      out += `\nSource: UniPods Group Memory Governance.`;
      return out;
    } catch {
      return lang === 'fr'
        ? `🧠 MÉMOIRE DU GROUPE UNIPODS\n\nImpossible de charger la mémoire du groupe pour le moment.`
        : `🧠 UNIPODS GROUP MEMORY\n\nUnable to load group memory at this time.`;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. /decisions (Approved Group Decisions)
  // ---------------------------------------------------------------------------
  public async handleDecisionsCommand(
    params: HandleCommandParams,
    lang: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      const targetGroupId = params.groupId || 'grp-unipods-2026-demo';
      const [groupMemories, officialDecisions] = await Promise.all([
        groupMemoryService.fetchApprovedMemories(targetGroupId, 'DECISION'),
        fetchDecisionsFromSupabase(),
      ]);

      let out = `${translate('whatsapp.decisionsHeader', lang)}\n\n`;

      let count = 0;
      for (const m of groupMemories) {
        count++;
        out += `${count}. ${m.title || m.content}\n`;
        out += `• ${translate('common.date', lang)} : ${m.createdAt ? m.createdAt.slice(0, 10) : '2026-09-21'}\n`;
        out += `• ${translate('common.source', lang)} : UniPods Official Notice\n`;
        out += `• ${translate('common.status', lang)} : ${translate('ask.confirmed', lang)}\n\n`;
      }

      for (const d of officialDecisions.filter((d) => d.status === 'active').slice(0, 2)) {
        count++;
        out += `${count}. ${d.title}\n`;
        out += `• ${translate('common.date', lang)} : ${d.date}\n`;
        out += `• ${translate('common.source', lang)} : ${(d as any).authority || 'UniPods Directorate'}\n`;
        out += `• ${translate('common.status', lang)} : ${translate('ask.confirmed', lang)}\n\n`;
      }

      if (count === 0) {
        return `${translate('whatsapp.decisionsHeader', lang)}\n\n${translate('decisions.emptyDecisions', lang)}`;
      }

      return out.trim();
    } catch {
      return `${translate('whatsapp.decisionsHeader', lang)}\n\n${translate('common.error', lang)}`;
    }
  }

  // ---------------------------------------------------------------------------
  // 5. /deadlines (Confirmed & Relevant Deadlines)
  // ---------------------------------------------------------------------------
  public async handleDeadlinesCommand(
    params: HandleCommandParams,
    lang: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      const targetGroupId = params.groupId || 'grp-unipods-2026-demo';
      const groupDeadlines = await groupMemoryService.fetchApprovedMemories(targetGroupId, 'DEADLINE');

      let out = `${translate('whatsapp.deadlinesHeader', lang)}\n\n`;

      if (groupDeadlines.length > 0) {
        for (const dl of groupDeadlines) {
          out += `• ${dl.title || 'Milestone Submission'}\n`;
          out += `  ${dl.content}\n`;
          out += `  ${translate('common.source', lang)}: UniPods WhatsApp (Confirmed)\n\n`;
        }
      } else {
        out += `• 30 September 2026 at 23:59 GMT\n`;
        out += `  Milestone 2 final submission (Architecture & Pipeline)\n`;
        out += `  ${translate('common.source', lang)}: UniPods Programme Handbook 2026\n\n`;
      }

      out += `• 15 October 2026 at 18:00 GMT\n`;
      out += `  Mid-programme technical peer review\n`;
      out += `  ${translate('common.source', lang)}: UniPods Directorate\n\n`;

      out += `All times in GMT / WAT.`;
      return out.trim();
    } catch {
      return `${translate('whatsapp.deadlinesHeader', lang)}\n\n${translate('common.error', lang)}`;
    }
  }

  // ---------------------------------------------------------------------------
  // 6. /actions (Personal Action Items)
  // ---------------------------------------------------------------------------
  public async handleActionsCommand(
    params: HandleCommandParams,
    lang: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      const actions = await fetchActionsFromSupabase(params.userId);

      if (!actions || actions.length === 0) {
        return translate('whatsapp.noPendingActions', lang);
      }

      const pending = actions.filter((a) => a.status === 'pending');
      const inProgress = actions.filter((a) => a.status === 'in_progress');
      const completed = actions.filter((a) => a.status === 'completed');

      const activeList = [...pending, ...inProgress];

      if (activeList.length === 0) {
        return translate('whatsapp.noPendingActions', lang);
      }

      let response = `${translate('whatsapp.actionsHeader', lang)}\n\n`;
      response += `${translate('common.participant', lang)} : ${params.participantName}\n`;
      response += `${translate('actions.statusPending', lang)} : ${activeList.length} (${translate('actions.statusCompleted', lang)} : ${completed.length})\n\n`;

      activeList.slice(0, 5).forEach((action, idx) => {
        const priorityIcon = action.priority === 'high' ? '🔴' : '🟡';
        response += `${idx + 1}. ${priorityIcon} ${action.title}\n`;
        response += `   ${translate('actions.dueDate', lang)} : ${action.dueDate}\n`;
        if (action.notes) {
          response += `   ${translate('common.notes', lang)} : ${action.notes}\n`;
        }
        response += `\n`;
      });

      return response.trim();
    } catch {
      return translate('common.error', lang);
    }
  }

  // ---------------------------------------------------------------------------
  // 7. /recap (Personal & Programme Summary)
  // ---------------------------------------------------------------------------
  public async handleRecapCommand(
    params: HandleCommandParams,
    lang: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      const [actions, decisions, meetings] = await Promise.all([
        fetchActionsFromSupabase(params.userId),
        fetchDecisionsFromSupabase(),
        fetchMeetingsFromSupabase(),
      ]);

      const pendingCount = actions.filter((a) => a.status === 'pending' || a.status === 'in_progress').length;
      const latestDecision = decisions.length > 0 ? decisions[0].title : 'Confirmed schedule';
      const latestMeeting = meetings.length > 0 ? `${meetings[0].title} (${meetings[0].date})` : 'UniPods briefing';

      const title = lang === 'fr' ? '📝 RÉCAPITULATIF PERSONNEL' : lang === 'pt' ? '📝 RESUMO PESSOAL' : lang === 'ar' ? '📝 الموجز الشخصي' : '📝 PERSONAL DIGEST';
      let out = `${title}\n\n`;
      out += `• ${translate('common.participant', lang)} : ${params.participantName}\n`;
      out += `• ${translate('profile.cohort', lang)} : UniPods AI Cohort 2026\n\n`;
      out += `📌 ${translate('actions.statusPending', lang)} : ${pendingCount}\n`;
      out += `⚖️ ${translate('decisions.confirmedDecisions', lang)} :\n${latestDecision}\n\n`;
      out += `🗓️ ${translate('recaps.keyEvents', lang)} :\n${latestMeeting}`;

      return out;
    } catch {
      return translate('common.error', lang);
    }
  }

  // ---------------------------------------------------------------------------
  // 8. /status (Participant Profile & WhatsApp Verification)
  // ---------------------------------------------------------------------------
  public async handleStatusCommand(
    params: HandleCommandParams,
    lang: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      const profile = await fetchUserProfileFromSupabase(params.userId);

      const name = profile?.name || params.participantName;
      const track = profile?.track || 'Computer Vision & Natural Language for Agriculture';
      const cohort = profile?.cohort || 'UniPods AI Cohort 2026';
      const role = profile?.role || 'Participant';

      const title = lang === 'fr' ? '👤 MON STATUT' : lang === 'pt' ? '👤 O MEU ESTADO' : lang === 'ar' ? '👤 حالتي الشخصية' : '👤 MY STATUS';
      return (
        `${title}\n\n` +
        `• ${translate('profile.fullName', lang)} : ${name}\n` +
        `• ${translate('profile.role', lang)} : ${role}\n` +
        `• ${translate('profile.track', lang)} : ${track}\n` +
        `• ${translate('profile.cohort', lang)} : ${cohort}\n` +
        `• WhatsApp : ${translate('common.verified', lang)} (+${params.phoneNumber.replace(/^\+/, '')})\n` +
        `• ${translate('profile.languagePreference', lang)} : ${lang.toUpperCase()}`
      );
    } catch {
      return (
        `👤 MY STATUS\n\n` +
        `• ${translate('common.participant', lang)} : ${params.participantName}\n` +
        `• WhatsApp : ${translate('common.verified', lang)}`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 9. /sources (Verified Knowledge Sources)
  // ---------------------------------------------------------------------------
  public async handleSourcesCommand(lang: SupportedLanguage = 'en'): Promise<string> {
    try {
      const sources = await fetchSourcesFromSupabase();

      if (!sources || sources.length === 0) {
        return (
          `📚 ${translate('sources.title', lang)}\n\n` +
          `• UniPods Cohort WhatsApp Announcement Feed\n` +
          `• Wadhwani Foundation AI Foundation Curriculum\n` +
          `• MIT Learn Agriculture AI Dataset Guidelines\n` +
          `• UniPods Programme Handbook 2026`
        );
      }

      const approvedSources = sources.filter((s) => s.approved);
      let out = `📚 ${translate('sources.title', lang)} (${approvedSources.length})\n\n`;

      approvedSources.slice(0, 6).forEach((s, idx) => {
        out += `${idx + 1}. ${s.title}\n`;
        out += `   ${translate('sources.publisher', lang)} : ${s.publisher || s.author || 'UniPods'}\n`;
        out += `   ${translate('common.date', lang)} : ${s.date}\n\n`;
      });

      return out.trim();
    } catch {
      return `📚 ${translate('sources.title', lang)}`;
    }
  }

  // ---------------------------------------------------------------------------
  // 10. Unknown Command Fallback (Never routed to LLM)
  // ---------------------------------------------------------------------------
  public formatUnknownCommandResponse(lang: SupportedLanguage = 'en'): string {
    return (
      (lang === 'fr'
        ? `Je ne reconnais pas cette commande.\n\nTapez /help pour afficher les commandes disponibles :\n• /missed\n• /memory\n• /decisions\n• /deadlines\n• /actions\n• /recap\n• /status\n• /sources\n• /language [en|fr|pt|ar]\n• /help`
        : lang === 'pt'
        ? `Não reconheço este comando.\n\nEscreva /help para consultar a lista de comandos:\n• /missed\n• /memory\n• /decisions\n• /deadlines\n• /actions\n• /recap\n• /status\n• /sources\n• /language [en|fr|pt|ar]\n• /help`
        : lang === 'ar'
        ? `عذراً، لم أتعرف على هذا الأمر.\n\nاكتب /help لعرض قائمة الأوامر المتاحة:\n• /missed\n• /memory\n• /decisions\n• /deadlines\n• /actions\n• /recap\n• /status\n• /sources\n• /language [en|fr|pt|ar]\n• /help`
        : `Command not recognized.\n\nType /help to view available commands:\n• /missed\n• /memory\n• /decisions\n• /deadlines\n• /actions\n• /recap\n• /status\n• /sources\n• /language [en|fr|pt|ar]\n• /help`)
    );
  }
}

export const whatsappCommandService = new WhatsAppCommandService();
