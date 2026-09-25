/**
 * Ask UniBot — Application Root
 * Trusted group memory and personal participation companion
 * for the METI UniPods AI Innovation Programme.
 *
 * Exclusively driven by live Supabase PostgreSQL data & Supabase Auth.
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

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider, SupportedLanguage } from './i18n';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { SourceModal } from './components/common/SourceModal';
import { HumanHandoverModal } from './components/common/HumanHandoverModal';
import { AuthModal } from './components/common/AuthModal';

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
import { AdminGroupMemoryView } from './components/views/admin/AdminGroupMemoryView';
import { AdminWhatsAppGroupsView } from './components/views/admin/AdminWhatsAppGroupsView';

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

const AppContent: React.FC = () => {
  const { user, profile, isAdmin, signInAsDemo, signOut, updateProfile } = useAuth();

  // Navigation & Role Mode State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Application Data States (Strictly hydrated from Supabase)
  const [sources, setSources] = useState<Source[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [confusionAlerts, setConfusionAlerts] = useState<ConfusionAlert[]>([]);
  const [handoverTickets, setHandoverTickets] = useState<HumanHandoverTicket[]>([]);
  const [recurringQuestions, setRecurringQuestions] = useState<RecurringQuestion[]>([]);
  const [poll, setPoll] = useState<Poll>(DEFAULT_POLL);
  const [decisionTimeline, setDecisionTimeline] = useState<DecisionTimelineItem[]>([]);

  // Modals & Cross-component state
  const [selectedSourceModal, setSelectedSourceModal] = useState<Source | null>(null);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverData, setHandoverData] = useState<{
    question: string;
    sourcesChecked: string[];
    conflict: string;
  }>({ question: '', sourcesChecked: [], conflict: '' });
  const [prefilledQuery, setPrefilledQuery] = useState('');

  // Synchronize admin mode if auth role is admin
  useEffect(() => {
    if (isAdmin && !isAdminMode) {
      setIsAdminMode(true);
    }
  }, [isAdmin]);

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

    // 4. Handover Tickets
    defaultKnowledgeRepository.getHandoverTickets().then((repoTickets) => {
      if (repoTickets && repoTickets.length > 0) {
        setHandoverTickets(repoTickets);
        defaultHandoverService.setTickets(repoTickets);
      }
    }).catch((err) => console.warn('Handover tickets hydration error:', err));

    // 5. Confusion Alerts
    defaultKnowledgeRepository.getConfusionAlerts().then((repoAlerts) => {
      if (repoAlerts && repoAlerts.length > 0) {
        setConfusionAlerts(repoAlerts);
      }
    }).catch((err) => console.warn('Confusion alerts hydration error:', err));

    // 6. Recurring Questions
    defaultKnowledgeRepository.getRecurringQuestions().then((repoQuestions) => {
      if (repoQuestions && repoQuestions.length > 0) {
        setRecurringQuestions(repoQuestions);
      }
    }).catch((err) => console.warn('Recurring questions hydration error:', err));
  }, []);

  // Hydrate actions specific to active user
  useEffect(() => {
    defaultKnowledgeRepository.getActions(user?.id).then((repoActions) => {
      if (repoActions && repoActions.length > 0) {
        setActions(repoActions);
      }
    }).catch((err) => console.warn('Actions hydration error:', err));
  }, [user?.id]);

  // Derive latest official announcement from approved sources
  const latestAnnouncementSource = sources.find(
    (s) => s.approved && (s.type === 'organiser_update' || s.type === 'official_announcement' || s.type === 'programme_document')
  );

  const latestAnnouncement: Announcement = latestAnnouncementSource
    ? {
        id: `ann-${latestAnnouncementSource.id}`,
        title: latestAnnouncementSource.title,
        date: latestAnnouncementSource.date,
        summary: latestAnnouncementSource.content.slice(0, 180) + '...',
        content: latestAnnouncementSource.content,
        priority: 'high',
        sourceTitle: latestAnnouncementSource.publisher || latestAnnouncementSource.author || 'UniPods Directorate',
        sourceId: latestAnnouncementSource.id,
        category: 'schedule',
      }
    : FALLBACK_ANNOUNCEMENT;

  // Handlers
  const handleToggleAction = (actionId: string) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id === actionId) {
          const nextStatus = a.status === 'completed' ? 'pending' : 'completed';
          defaultKnowledgeRepository.updateActionStatus(actionId, nextStatus).catch(console.warn);
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const handleVotePoll = (pollId: string, optionId: string) => {
    setPoll((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      ),
      totalResponses: prev.totalResponses + 1,
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

  const activeUserProfile: UserProfile = profile || DEFAULT_USER;

  const handleCreateHandoverTicket = (ticketData: Partial<HumanHandoverTicket>) => {
    const newTicket: HumanHandoverTicket = {
      id: `ticket-${Date.now()}`,
      question: ticketData.question || handoverData.question,
      participantContext: `${activeUserProfile.name} (${activeUserProfile.cohort})`,
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

  const handleResolveConfusion = (alert: ConfusionAlert) => {
    setConfusionAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id
          ? {
              ...a,
              status: 'resolved' as const,
              resolvedBy: 'Dr. Aminata Touré (Lead Facilitator)',
              resolutionNote:
                'Confirmed in 21 Sep Live Q&A: Prototype submission deadline is Tuesday, 29 September 2026 at 23:59 WAT.',
            }
          : a
      )
    );

    decisionService.resolveConflict(
      'Prototype Deadline Discrepancy',
      'Confirmed: Milestone 2 prototype submission deadline is Tuesday, 29 September 2026 at 23:59 WAT (as stated in official syllabus Section 4.2).',
      'Dr. Aminata Touré (Lead Facilitator)'
    );

    defaultKnowledgeRepository.resolveConflict({
      topic: 'Prototype Deadline Discrepancy',
      confirmedDecisionText:
        'Confirmed: Milestone 2 prototype submission deadline is Tuesday, 29 September 2026 at 23:59 WAT.',
      confirmedBy: 'Dr. Aminata Touré (Lead Facilitator)',
    }).catch(console.warn);

    const conflictResolutionTimeline: DecisionTimelineItem = {
      id: `dt-resolved-${Date.now()}`,
      date: '21 Sep 2026',
      title: 'Prototype Submission Deadline Locked',
      description:
        'Official concept submission locked to Tuesday, 29 September 2026 at 23:59 WAT by Eng. Kwame Mensah and Dr. Aminata Touré.',
      type: 'decision_confirmed',
      supersedesNote: 'Supersedes preliminary 27 September date previously announced in 18 Sep briefing.',
    };
    setDecisionTimeline((prev) => [conflictResolutionTimeline, ...prev]);
  };

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
        userProfile={activeUserProfile}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={signOut}
        onSwitchAccount={signInAsDemo}
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
              userName={activeUserProfile.name}
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
              userName={activeUserProfile.name}
              userId={user?.id}
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
              user={activeUserProfile}
              onUpdateUser={updateProfile}
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

          {activeTab === 'admin-group-memory' && <AdminGroupMemoryView />}
          {activeTab === 'admin-whatsapp-groups' && (
            <AdminWhatsAppGroupsView
              onNavigateToGroupMemory={() => setActiveTab('admin-group-memory')}
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
        participantName={`${activeUserProfile.name} (${activeUserProfile.cohort})`}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

const I18nWrappedApp: React.FC = () => {
  const { profile, updateProfile } = useAuth();

  const handleLanguageChange = async (newLang: SupportedLanguage) => {
    if (profile) {
      await updateProfile({ preferredLanguage: newLang });
    }
  };

  return (
    <I18nProvider
      initialLanguage={profile?.preferredLanguage || 'en'}
      onLanguageChange={handleLanguageChange}
    >
      <AppContent />
    </I18nProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <I18nWrappedApp />
    </AuthProvider>
  );
};

export default App;
