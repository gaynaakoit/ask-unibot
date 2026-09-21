/**
 * Ask UniBot — Application Root
 * Trusted group memory and personal participation companion
 * for the METI UniPods AI Innovation Programme.
 */

import React, { useState } from 'react';
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
} from './types';
import {
  INITIAL_SOURCES,
  INITIAL_ACTIONS,
  INITIAL_MEETINGS,
  INITIAL_CONFUSION_ALERTS,
  INITIAL_HANDOVER_TICKETS,
  INITIAL_RECURRING_QUESTIONS,
  INITIAL_POLL,
  INITIAL_USER,
  INITIAL_DECISION_TIMELINE,
  LATEST_ANNOUNCEMENT,
} from './data/demoData';

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

export const App: React.FC = () => {
  // Navigation & Role Mode State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Application Data States
  const [sources, setSources] = useState<Source[]>(INITIAL_SOURCES);
  const [actions, setActions] = useState<ActionItem[]>(INITIAL_ACTIONS);
  const [meetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [confusionAlerts, setConfusionAlerts] = useState<ConfusionAlert[]>(INITIAL_CONFUSION_ALERTS);
  const [handoverTickets, setHandoverTickets] = useState<HumanHandoverTicket[]>(INITIAL_HANDOVER_TICKETS);
  const [recurringQuestions, setRecurringQuestions] = useState<RecurringQuestion[]>(INITIAL_RECURRING_QUESTIONS);
  const [poll, setPoll] = useState<Poll>(INITIAL_POLL);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [decisionTimeline, setDecisionTimeline] = useState<DecisionTimelineItem[]>(INITIAL_DECISION_TIMELINE);

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

  // Action handlers
  const handleToggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              status: act.status === 'completed' ? 'pending' : 'completed',
            }
          : act
      )
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
      id: `TICK-${Date.now().toString().slice(-4)}`,
      question: ticketData.question || handoverData.question,
      participantContext: user.name + ` (${user.cohort})`,
      recommendedAdmin: ticketData.recommendedAdmin || 'Dr. Aminata Touré (Lead Facilitator)',
      sourcesChecked: ticketData.sourcesChecked || handoverData.sourcesChecked,
      conflictOrMissing: ticketData.conflictOrMissing || handoverData.conflict,
      status: 'open',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WAT',
    };
    setHandoverTickets((prev) => [newTicket, ...prev]);
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

  // Resolution of Conflicting Announcements (The Core Hackathon Demo Flow)
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
  };

  const handleMarkSourceSuperseded = (sourceId: string) => {
    const updated = sources.map((s) =>
      s.id === sourceId ? { ...s, status: 'superseded' as const } : s
    );
    setSources(updated);
    defaultKnowledgeService.setSources(updated);
  };

  const handleAddSource = (newSourceData: Omit<Source, 'id'>) => {
    const newSource: Source = {
      id: `src-${Date.now()}`,
      ...newSourceData,
    };
    const updated = [newSource, ...sources];
    setSources(updated);
    defaultKnowledgeService.setSources(updated);
  };

  const pendingActionsCount = actions.filter((a) => a.status === 'pending').length;
  const openConfusionCount = confusionAlerts.filter((a) => a.status === 'needs_admin_confirmation').length;
  const openHandoverCount = handoverTickets.filter((t) => t.status === 'open').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Application Bar */}
      <Navbar
        isAdminMode={isAdminMode}
        onToggleRole={handleToggleRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        smartSilenceEnabled={user.preferences.smartSilenceActive}
      />

      {/* Main Framework Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isAdminMode={isAdminMode}
          pendingActionsCount={pendingActionsCount}
          openConfusionCount={openConfusionCount}
          openHandoverCount={openHandoverCount}
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
              nextMeeting={meetings[0]}
              priorityAction={actions[0]}
              latestAnnouncement={LATEST_ANNOUNCEMENT}
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
              timeline={INITIAL_DECISION_TIMELINE}
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
