/**
 * Ask UniBot — Application Root
 * Trusted group memory and personal participation companion
 * for the METI UniPods AI Innovation Programme.
 *
 * Exclusively driven by live Supabase PostgreSQL data.
 */

import React, { useState, useEffect } from 'react';
import {
  Source,
  ActionItem,
  Meeting,
  ConfusionAlert,
  HumanHandoverTicket,
  RecurringQuestion,
  Poll,
  UserProfile,
  ActiveTab,
  DecisionTimelineItem,
  Announcement,
} from './types';

import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { SourceModal } from './components/common/SourceModal';
import { HumanHandoverModal } from './components/common/HumanHandoverModal';

import { DashboardView } from './components/views/DashboardView';
import { AskUniBotView } from './components/views/AskUniBotView';
import { WhatDidIMissView } from './components/views/WhatDidIMissView';
import { MeetingsView } from './components/views/MeetingsView';
import { ActionsView } from './components/views/ActionsView';
import { SourcesView } from './components/views/SourcesView';
import { WhatsAppSimView } from './components/views/WhatsAppSimView';
import { RecapsView } from './components/views/RecapsView';
import { RemindersView } from './components/views/RemindersView';
import { ProfileView } from './components/views/ProfileView';

import { AdminDashboardView } from './components/views/admin/AdminDashboardView';
import { AdminConfusionView } from './components/views/admin/AdminConfusionView';
import { AdminQuestionsView } from './components/views/admin/AdminQuestionsView';
import { AdminClarityView } from './components/views/admin/AdminClarityView';
import { AdminHandoverView } from './components/views/admin/AdminHandoverView';
import { AdminSourcesView } from './components/views/admin/AdminSourcesView';

import { defaultKnowledgeService } from './services/knowledgeService';
import { defaultKnowledgeRepository } from './services/knowledgeRepository';
import { decisionService } from './services/decisionService';
import { defaultHandoverService } from './services/handoverService';

const DEFAULT_USER: UserProfile = {
  name: 'Awa Diop',
  email: 'awa.diop@unipods.example.org',
  cohort: 'UniPods AI Cohort 2026',
  unipod: 'UCAD Dakar UniPod Innovation Center',
  track: 'Computer Vision & Natural Language for Agriculture',
  team: 'SunuAgri AI (Team #14)',
  role: 'Participant / AI Solutions Track',
  preferences: {
    smartSilenceActive: true,
    plainLanguageExplanationPreferred: true,
    digestFrequency: 'daily',
  },
};

const DEFAULT_POLL: Poll = {
  id: 'poll-m2',
  question: 'Which Milestone 2 component needs the most mentor assistance?',
  options: [
    { id: 'opt-1', text: 'RAG Architecture & Embeddings', votes: 24 },
    { id: 'opt-2', text: 'Field Customer Discovery Interviews', votes: 19 },
    { id: 'opt-3', text: 'Cloud Infrastructure & Vertex AI Grants', votes: 11 },
    { id: 'opt-4', text: 'Pitch Deck & Business Model Rubric', votes: 8 },
  ],
  totalResponses: 62,
  totalParticipants: 180,
  closesAt: '23 Sep 2026 at 18:00 WAT',
};

const FALLBACK_MEETING: Meeting = {
  id: 'meet-placeholder',
  title: 'UniPods Programme Briefing',
  date: 'September 2026',
  time: '10:00 WAT',
  status: 'completed',
  whatWasDiscussed: ['Orientation and programme sync'],
  decisions: [],
  actionItems: [],
  resources: [],
  nextSession: 'Microsoft Teams',
  sourceId: '',
  sourceTitle: '',
};

const FALLBACK_ANNOUNCEMENT: Announcement = {
  id: 'ann-placeholder',
  title: 'UniPods AI Innovation Programme',
  date: 'September 2026',
  summary: 'Live updates from Supabase.',
  content: 'Programme updates loaded directly from Supabase knowledge base.',
  priority: 'normal',
  sourceTitle: 'UniPods Directorate',
  sourceId: '',
  category: 'schedule',
};

export const App: React.FC = () => {
  // Navigation & Role Mode State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Application Data States (Strictly hydrated from Supabase)
  const [sources, setSources] = useState<Source[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [confusionAlerts, setConfusionAlerts] = useState<ConfusionAlert[]>([]);
  const [handoverTickets, setHandoverTickets] = useState<HumanHandoverTicket[]>([]);
  const [recurringQuestions, setRecurringQuestions] = useState<RecurringQuestion[]>([]);
  const [poll, setPoll] = useState<Poll>(DEFAULT_POLL);
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [decisionTimeline, setDecisionTimeline] = useState<DecisionTimelineItem[]>([]);

  // Hydrate persistent state from Supabase
  useEffect(() => {
    // 1. Sources
    defaultKnowledgeRepository.getSources().then((repoSources) => {
      if (repoSources && repoSources.length > 0) {
        setSources(repoSources);
        defaultKnowledgeService.setSources(repoSources);
      }
    }).catch((err) => console.warn('Sources hydration error:', err));

    // 2. Decisions & Decision Timeline
    defaultKnowledgeRepository.getDecisions().then((repoDecisions) => {
      if (repoDecisions && repoDecisions.length > 0) {
        setDecisionTimeline(
          repoDecisions.map((d) => ({
            id: `dt-${d.id}`,
            date: d.date || '21 Sep 2026',
            type: d.supersedesPrevious ? 'decision_confirmed' : 'official_update',
            title: d.title,
            description: d.decision || d.notes || d.title,
            supersedesNote: d.supersedesNote,
          }))
        );
      }
    }).catch((err) => console.warn('Decisions hydration error:', err));

    // 3. Meetings
    defaultKnowledgeRepository.getMeetings().then((repoMeetings) => {
      if (repoMeetings && repoMeetings.length > 0) {
        setMeetings(repoMeetings);
      }
    }).catch((err) => console.warn('Meetings hydration error:', err));

    // 4. Actions
    defaultKnowledgeRepository.getActions().then((repoActions) => {
      if (repoActions && repoActions.length > 0) {
        setActions(repoActions);
      }
    }).catch((err) => console.warn('Actions hydration error:', err));

    // 5. Handover Tickets
    defaultKnowledgeRepository.getHandoverTickets().then((repoTickets) => {
      if (repoTickets && repoTickets.length > 0) {
        setHandoverTickets(repoTickets);
        defaultHandoverService.setTickets(repoTickets);
      }
    }).catch((err) => console.warn('Handover tickets hydration error:', err));

    // 6. Confusion Alerts
    defaultKnowledgeRepository.getConfusionAlerts().then((repoAlerts) => {
      if (repoAlerts && repoAlerts.length > 0) {
        setConfusionAlerts(repoAlerts);
      }
    }).catch((err) => console.warn('Confusion alerts hydration error:', err));

    // 7. Recurring Questions
    defaultKnowledgeRepository.getRecurringQuestions().then((repoQuestions) => {
      if (repoQuestions && repoQuestions.length > 0) {
        setRecurringQuestions(repoQuestions);
      }
    }).catch((err) => console.warn('Recurring questions hydration error:', err));

    // 8. User Profile
    defaultKnowledgeRepository.getUserProfile().then((profile) => {
      if (profile) {
        setUser(profile);
      }
    }).catch((err) => console.warn('User profile hydration error:', err));

    decisionService.loadFromRepository().catch((err) => console.warn('Decision service hydration error:', err));
  }, []);

  // Compute latest announcement dynamically from Supabase sources
  const latestAnnouncement: Announcement | undefined = sources.length > 0
    ? {
        id: sources[0].id,
        title: sources[0].title,
        date: sources[0].date,
        summary: sources[0].summary || sources[0].content.slice(0, 150) + '...',
        content: sources[0].content,
        priority: 'high',
        sourceTitle: sources[0].title,
        sourceId: sources[0].id,
        requiredAction: 'Review official notification and sync with team lead',
        category: 'schedule',
      }
    : undefined;

  // Deep-link / Chat trigger query
  const [prefilledQuery, setPrefilledQuery] = useState<string>('');

  // Modals
  const [selectedSourceModal, setSelectedSourceModal] = useState<Source | null>(null);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverData, setHandoverData] = useState<{
    question: string;
    sourcesChecked: string[];
    conflict: string;
  }>({
    question: '',
    sourcesChecked: [],
    conflict: '',
  });

  // Action handlers connected to Supabase
  const handleToggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((act) => {
        if (act.id === id) {
          const nextStatus = act.status === 'completed' ? 'pending' : 'completed';
          defaultKnowledgeRepository.updateActionStatus(id, nextStatus).catch(console.warn);
          return {
            ...act,
            status: nextStatus,
          };
        }
        return act;
      })
    );
  };

  const handleVotePoll = (pollId: string, optionId: string) => {
    setPoll((prev) => ({
      ...prev,
      userVotedId: optionId,
    }));
  };

  const handleToggleRole = () => {
    const nextMode = !isAdminMode;
    setIsAdminMode(nextMode);
    setActiveTab(nextMode ? 'admin-overview' : 'dashboard');
  };

  const handleOpenHandoverModal = (
    initialQuestion: string,
    sourcesChecked: string[],
    conflict: string
  ) => {
    setHandoverData({ question: initialQuestion, sourcesChecked, conflict });
    setHandoverModalOpen(true);
  };

  const handleCreateHandoverTicket = (ticketData: Partial<HumanHandoverTicket>) => {
    const newTicket: HumanHandoverTicket = {
      id: `ticket-${Date.now()}`,
      question: ticketData.question || handoverData.question,
      participantContext: `${user.name} (${user.cohort})`,
      recommendedAdmin: ticketData.recommendedAdmin || 'Dr. Aminata Touré (Lead Facilitator)',
      sourcesChecked: ticketData.sourcesChecked || handoverData.sourcesChecked,
      conflictOrMissing: ticketData.conflictOrMissing || handoverData.conflict,
      status: 'open',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WAT',
      createdAt: new Date().toISOString(),
    };
    setHandoverTickets((prev) => [newTicket, ...prev]);
    defaultKnowledgeRepository.saveHandoverTicket(newTicket).catch(console.warn);
  };

  const handleResolveHandoverTicket = (ticketId: string, resolution: string) => {
    setHandoverTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'confirmed' as const,
              resolutionNote: resolution,
              adminResponse: resolution,
            }
          : t
      )
    );

    defaultKnowledgeRepository.updateHandoverTicket(ticketId, {
      status: 'confirmed',
      resolutionNote: resolution,
      adminResponse: resolution,
    }).catch(console.warn);

    // Create a new verified source so Ask UniBot immediately grounds future queries on this resolution
    const ticket = handoverTickets.find((t) => t.id === ticketId);
    const newSource: Source = {
      id: `src-resolution-${Date.now()}`,
      title: `Organiser Directive: ${ticket?.question.slice(0, 45) || 'Clarification'}`,
      content: resolution,
      type: 'organiser_update',
      date: '21 Sep 2026',
      author: 'Dr. Aminata Touré (Lead Facilitator)',
      publisher: 'METI UniPods Secretariat',
      approved: true,
      status: 'current',
      trustLevel: 'organiser_confirmed',
      tags: ['organiser_directive', 'admin_resolution', 'official'],
    };

    const updatedSources = [newSource, ...sources];
    setSources(updatedSources);
    defaultKnowledgeService.setSources(updatedSources);
    defaultKnowledgeRepository.saveSource(newSource).catch((err) => console.warn('Save resolution source error:', err));
    decisionService.resolveConflict(
      ticket?.question.slice(0, 45) || 'Admin Directive',
      resolution,
      'Dr. Aminata Touré (Lead Facilitator)'
    );

    // Add decision timeline entry
    const newTimelineItem: DecisionTimelineItem = {
      id: `dt-res-${Date.now()}`,
      date: '21 Sep 2026',
      title: `Clarification Confirmed: ${ticket?.question.slice(0, 40) || 'Query'}`,
      description: resolution,
      type: 'decision_confirmed',
      supersedesNote: 'Confirmed by Lead Facilitator to resolve ambiguity.',
    };
    setDecisionTimeline((prev) => [newTimelineItem, ...prev]);
  };

  // Resolution of Conflicting Announcements (Persisted to Supabase)
  const handleResolveConfusion = (alert: ConfusionAlert) => {
    // 1. Mark alert as resolved
    setConfusionAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id
          ? {
              ...a,
              status: 'resolved' as const,
              resolutionNote:
                'Confirmed Tuesday, 29 September 2026 at 23:59 WAT as the official locked deadline. Marked 18 Sep preliminary notice as superseded.',
            }
          : a
      )
    );

    // 2. Update Sources knowledge base: mark 18 Sep as superseded
    const updatedSources = sources.map((s) => {
      if (s.id === 'src-4') {
        return { ...s, status: 'superseded' as const, supersededBy: 'src-2' };
      }
      if (s.id === 'src-2') {
        return { ...s, status: 'current' as const, supersedes: 'src-4' };
      }
      return s;
    });

    setSources(updatedSources);
    defaultKnowledgeService.setSources(updatedSources);

    // Persist resolution to Supabase database
    defaultKnowledgeService.resolveAdminConflict({
      topic: 'Prototype Submission Deadline',
      confirmedDecisionText:
        'Official concept submission locked to Tuesday, 29 September 2026 at 23:59 WAT by Eng. Kwame Mensah and Dr. Aminata Touré.',
      confirmedBy: 'Eng. Kwame Mensah and Dr. Aminata Touré',
      supersedesDecisionId: 'dec-proto-27',
      newSourceId: 'src-2',
    });

    // 3. Update recurring questions status
    setRecurringQuestions((prev) =>
      prev.map((q) =>
        q.question.toLowerCase().includes('deadline')
          ? {
              ...q,
              status: 'answered' as const,
              suggestedAnswer:
                'Official deadline is Tuesday, 29 September 2026 at 23:59 WAT. Preliminary 27 Sep date is superseded.',
            }
          : q
      )
    );

    // 4. Update Decision Timeline
    const conflictResolutionTimeline: DecisionTimelineItem = {
      id: `dt-conflict-${Date.now()}`,
      date: '21 Sep 2026 (Now)',
      title: 'Prototype Submission Deadline Locked',
      description:
        'Official concept submission locked to Tuesday, 29 September 2026 at 23:59 WAT by Eng. Kwame Mensah and Dr. Aminata Touré.',
      type: 'decision_confirmed',
      supersedesNote: 'Supersedes preliminary 27 September date previously announced in 18 Sep briefing.',
    };
    setDecisionTimeline((prev) => [conflictResolutionTimeline, ...prev]);
  };

  // Source Management Actions
  const handleToggleSourceApproval = (sourceId: string) => {
    const updated = sources.map((s) => (s.id === sourceId ? { ...s, approved: !s.approved } : s));
    setSources(updated);
    defaultKnowledgeService.setSources(updated);
    const updatedSource = updated.find((s) => s.id === sourceId);
    if (updatedSource) defaultKnowledgeRepository.saveSource(updatedSource).catch(console.warn);
  };

  const handleMarkSourceSuperseded = (sourceId: string) => {
    const updated = sources.map((s) =>
      s.id === sourceId ? { ...s, status: 'superseded' as const } : s
    );
    setSources(updated);
    defaultKnowledgeService.setSources(updated);
    const updatedSource = updated.find((s) => s.id === sourceId);
    if (updatedSource) defaultKnowledgeRepository.saveSource(updatedSource).catch(console.warn);
  };

  const handleAddSource = (newSourceData: Omit<Source, 'id'>) => {
    const newSource: Source = {
      id: `src-${Date.now()}`,
      ...newSourceData,
    };
    const updated = [newSource, ...sources];
    setSources(updated);
    defaultKnowledgeService.setSources(updated);
    defaultKnowledgeRepository.saveSource(newSource).catch(console.warn);
  };

  const pendingActionsCount = actions.filter((a) => a.status === 'pending').length;
  const openConfusionCount = confusionAlerts.filter((a) => a.status !== 'resolved').length;
  const openHandoverCount = handoverTickets.filter((t) => t.status === 'open' || t.status === 'in_review').length;

  return (
    <div id="ask-unibot-app" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        isAdminMode={isAdminMode}
        onToggleRole={handleToggleRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingActionsCount={pendingActionsCount}
          openConfusionCount={openConfusionCount}
          openHandoverCount={openHandoverCount}
          isAdminMode={isAdminMode}
        />

        {/* Content View Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          {/* PARTICIPANT VIEWS */}
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={setActiveTab}
              onAskQuestion={(q) => {
                setPrefilledQuery(q);
                setActiveTab('ask');
              }}
              nextMeeting={meetings[0] || FALLBACK_MEETING}
              priorityAction={actions[0]}
              latestAnnouncement={latestAnnouncement || FALLBACK_ANNOUNCEMENT}
              poll={poll}
              onVotePoll={handleVotePoll}
              onToggleAction={handleToggleAction}
              onViewSourceModal={setSelectedSourceModal}
              allSources={sources}
            />
          )}

          {activeTab === 'ask' && (
            <AskUniBotView
              initialQuery={prefilledQuery}
              allSources={sources}
              onOpenHandoverModal={handleOpenHandoverModal}
              onViewSourceModal={setSelectedSourceModal}
              onNavigateToActions={() => setActiveTab('actions')}
            />
          )}

          {activeTab === 'what-did-i-miss' && (
            <WhatDidIMissView
              onViewSourceModal={setSelectedSourceModal}
              onToggleAction={handleToggleAction}
              onNavigateToAsk={(q) => {
                setPrefilledQuery(q);
                setActiveTab('ask');
              }}
              actions={actions}
              meetings={meetings}
              sources={sources}
            />
          )}

          {activeTab === 'meetings' && (
            <MeetingsView
              meetings={meetings}
              timeline={decisionTimeline}
              onViewSourceModal={setSelectedSourceModal}
              allSources={sources}
            />
          )}

          {activeTab === 'actions' && (
            <ActionsView
              actions={actions}
              onToggleComplete={handleToggleAction}
              onViewSourceModal={setSelectedSourceModal}
              allSources={sources}
            />
          )}

          {activeTab === 'sources' && (
            <SourcesView
              sources={sources}
              onViewSourceModal={setSelectedSourceModal}
            />
          )}

          {activeTab === 'whatsapp-sim' && <WhatsAppSimView />}

          {activeTab === 'recaps' && <RecapsView />}

          {activeTab === 'reminders' && <RemindersView />}

          {activeTab === 'profile' && (
            <ProfileView
              user={user}
              onUpdateUser={(updated: Partial<UserProfile>) => setUser((prev: UserProfile) => ({ ...prev, ...updated }))}
            />
          )}

          {/* ADMIN COMMAND CENTER VIEWS */}
          {activeTab === 'admin-overview' && (
            <AdminDashboardView
              onNavigate={setActiveTab}
              confusionAlerts={confusionAlerts}
              recurringQuestions={recurringQuestions}
              handoverTickets={handoverTickets}
              onResolveConfusion={handleResolveConfusion}
            />
          )}

          {activeTab === 'admin-confusion' && (
            <AdminConfusionView
              alerts={confusionAlerts}
              onResolveConfusion={handleResolveConfusion}
              onViewSourceModal={setSelectedSourceModal}
            />
          )}

          {activeTab === 'admin-questions' && (
            <AdminQuestionsView questions={recurringQuestions} />
          )}

          {activeTab === 'admin-clarity' && <AdminClarityView />}

          {activeTab === 'admin-handover' && (
            <AdminHandoverView
              tickets={handoverTickets}
              onResolveTicket={handleResolveHandoverTicket}
            />
          )}

          {activeTab === 'admin-sources' && (
            <AdminSourcesView
              sources={sources}
              onToggleApproval={handleToggleSourceApproval}
              onMarkSuperseded={handleMarkSourceSuperseded}
              onAddSource={handleAddSource}
            />
          )}

          {activeTab === 'admin-meetings' && (
            <MeetingsView
              meetings={meetings}
              timeline={decisionTimeline}
              onViewSourceModal={setSelectedSourceModal}
              allSources={sources}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingActionsCount={pendingActionsCount}
        isAdminMode={isAdminMode}
        onToggleRole={handleToggleRole}
      />

      {/* Modals */}
      <SourceModal
        source={selectedSourceModal}
        onClose={() => setSelectedSourceModal(null)}
      />

      <HumanHandoverModal
        isOpen={handoverModalOpen}
        onClose={() => setHandoverModalOpen(false)}
        onSubmit={handleCreateHandoverTicket}
        initialQuestion={handoverData.question}
        sourcesChecked={handoverData.sourcesChecked}
        conflictOrMissing={handoverData.conflict}
        participantName={`${user.name} (${user.cohort})`}
      />
    </div>
  );
};

export default App;
