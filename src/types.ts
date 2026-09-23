/**
 * Types for Ask UniBot — METI UniPods AI Innovation Programme
 */

export type SourceType =
  | 'official_announcement'
  | 'official_whatsapp'
  | 'mit_learn'
  | 'wadhwani'
  | 'official_mit'
  | 'mit'
  | 'organiser_update'
  | 'meeting_note'
  | 'decision'
  | 'programme_document'
  | 'verified_programme_material'
  | 'other';

export type SourceStatus =
  | 'current'
  | 'superseded'
  | 'pending_review'
  | 'expiring_soon';

export type TrustLevel =
  | 'official'
  | 'verified'
  | 'organiser_confirmed'
  | 'pending';

export type WhatDidIMissPeriod =
  | 'today'
  | 'yesterday'
  | '3_days'
  | 'last_7_days'
  | 'last_meeting'
  | 'week'
  | 'all'
  | 'custom';

/**
 * KnowledgeSource entity (Section 4)
 * Fully compatible with existing Source interface
 */
export interface KnowledgeSource {
  id: string;
  title: string;
  type: SourceType;
  publisher?: string;
  author?: string; // alias for publisher
  url?: string;
  content: string;
  summary?: string;
  publishedAt?: string;
  date: string; // alias/display date e.g. "21 Sep 2026"
  effectiveFrom?: string;
  expiresAt?: string;
  status: SourceStatus;
  trustLevel?: TrustLevel;
  approved: boolean;
  tags: string[];
  version?: number | string;
  supersedesSourceId?: string;
  supersedes?: string; // alias for supersedesSourceId
  supersededBy?: string;
  authorityNote?: string;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Keep Source interface as an alias to KnowledgeSource for seamless compatibility
export type Source = KnowledgeSource;

/**
 * KnowledgeChunk entity (Section 5)
 */
export interface KnowledgeChunk {
  id: string;
  sourceId: string;
  text: string;
  title: string;
  section?: string;
  tags: string[];
  publishedAt?: string;
  effectiveFrom?: string;
  expiresAt?: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  trustLevel?: TrustLevel;
  approved?: boolean;
}

export type ConfidenceState =
  | 'CONFIRMED'
  | 'NEEDS_ADMIN_CONFIRMATION'
  | 'NOT_FOUND';

export interface FreshnessInfo {
  status: 'current' | 'aging' | 'expired' | 'unknown';
  reason: string;
}

export interface ConflictInfo {
  detected: boolean;
  resolved: boolean;
  topic?: string;
  conflictingSourceIds?: string[];
  summary?: string;
  resolutionNote?: string;
}

export interface SourceEvidenceItem {
  id: string;
  title: string;
  publisher?: string;
  author?: string;
  url?: string;
  relevance: number;
  evidence: string;
  date?: string;
  status?: SourceStatus;
  type?: SourceType;
  trustLevel?: TrustLevel;
}

/**
 * Structured AI Response (Section 9)
 */
export interface AiResponse {
  answer: string;
  confidence: ConfidenceState;
  sources: Source[]; // Approved evidence sources
  evidenceItems?: SourceEvidenceItem[]; // Detailed evidence snippets
  nextStep: string | null;
  needsHuman: boolean;
  conflict?: ConflictInfo | null;
  conflictSummary?: string; // backwards compatibility
  relatedActions?: ActionItem[];
  freshness?: FreshnessInfo;
  explanationSimple?: string;
  timestamp?: string;
  groundingMethod?: 'gemini-3.8-flash' | 'deterministic-rag';
}

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface ActionItem {
  id: string;
  title: string;
  dueDate: string; // e.g., "24 Sep 2026"
  status: ActionStatus;
  sourceTitle: string;
  sourceId?: string;
  resourceLink?: string;
  resourceName?: string;
  priority?: 'high' | 'normal' | 'optional';
  notes?: string;
}

export interface MeetingDecision {
  id: string;
  topic?: string;
  title: string;
  decision?: string; // alias for title/decision statement
  date: string;
  sourceId?: string;
  status?: 'active' | 'superseded' | 'pending_confirmation';
  supersedesPrevious?: boolean;
  supersedesDecisionId?: string;
  supersedesNote?: string;
  impact?: string;
  effectiveFrom?: string;
  confirmedBy?: string;
  notes?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // "21 September 2026"
  time: string; // "10:00 WAT"
  status: 'completed' | 'upcoming';
  whatWasDiscussed: string[];
  decisions: MeetingDecision[];
  actionItems: {
    title: string;
    assignee: string;
    deadline: string;
  }[];
  resources: {
    title: string;
    url: string;
    type: 'slides' | 'recording' | 'template' | 'doc';
  }[];
  nextSession: string;
  sourceId: string;
  sourceTitle: string;
}

export interface DecisionTimelineItem {
  id: string;
  date: string;
  type: 'official_update' | 'meeting' | 'decision_confirmed' | 'participant_action';
  title: string;
  description: string;
  supersedesNote?: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  priority: 'high' | 'normal';
  sourceTitle: string;
  sourceId: string;
  requiredAction?: string;
  deadline?: string;
  category: 'schedule' | 'curriculum' | 'hackathon' | 'logistics';
}

export interface RecurringQuestion {
  id: string;
  question: string;
  frequency: number;
  lastAsked: string;
  status: 'answered' | 'needs_clarification' | 'conflicting' | 'CONFIRMED' | 'NEEDS_ADMIN_CONFIRMATION';
  suggestedClarification: string;
  officialAnswer?: string;
  topic?: string;
  suggestedAnswer?: string;
}

export interface ConfusionAlert {
  id: string;
  topic: string;
  participantCount: number;
  reason: string;
  sources: Source[];
  status: 'needs_admin_confirmation' | 'resolved' | 'active';
  resolutionNote?: string;
}

export interface AnnouncementClarityCheck {
  score: number; // 0 to 100
  presentElements: string[];
  missingElements: string[];
  recommendations: string[];
  improvedDraft?: string;
}

export interface HumanHandoverTicket {
  id: string;
  question: string;
  participantId?: string;
  participantContext?: string;
  detectedConflict?: string;
  conflictOrMissing?: string;
  evidence?: string | SourceEvidenceItem[];
  sourcesChecked: string[];
  recommendedAdmin: string;
  assignedTo?: string;
  adminResponse?: string;
  resolutionNote?: string;
  status: 'open' | 'confirmed' | 'corrected' | 'superseded' | 'in_review' | 'resolved';
  createdAt?: string;
  timestamp: string;
  resolvedAt?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalResponses: number;
  totalParticipants: number;
  userVotedId?: string;
  closesAt: string;
}

export interface ReminderStep {
  label: string; // e.g. "7 days before", "1 day before", "Event day"
  daysBefore: number;
  dateStr: string;
  timeWAT: string;
  status: 'sent' | 'scheduled';
  message: string;
}

export interface EventReminder {
  id: string;
  eventTitle: string;
  eventDate: string;
  timeWAT: string;
  purpose: string;
  audience: string;
  linkVenue: string;
  preparation: string;
  schedule: ReminderStep[];
}

export interface Recap {
  id: string;
  type: 'daily' | 'weekly';
  title: string;
  date: string;
  announcements: string[];
  events: string[];
  keyDiscussions: string[];
  actions: string[];
  links: { title: string; url: string }[];
  completedMilestones?: string[];
}

export interface ParticipantProfile {
  name: string;
  cohort: string;
  role: string;
  learningTrack: string;
  interests: string[];
  reminderPreferences: {
    dailyRecap: boolean;
    weeklyRecap: boolean;
    eventReminders: boolean;
  };
}

export interface UserProfile {
  name: string;
  email: string;
  cohort: string;
  unipod: string;
  track: string;
  team: string;
  role: string;
  preferences: {
    smartSilenceActive: boolean;
    plainLanguageExplanationPreferred: boolean;
    digestFrequency: 'daily' | 'weekly' | 'none';
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'unibot' | 'participant_other';
  senderName?: string;
  text?: string;
  response?: AiResponse;
  timestamp: string;
  isSimulatedSilence?: boolean;
}

export type ActiveTab =
  | 'dashboard'
  | 'ask'
  | 'what-did-i-miss'
  | 'meetings'
  | 'actions'
  | 'sources'
  | 'recaps'
  | 'reminders'
  | 'whatsapp-sim'
  | 'profile'
  // Admin tabs
  | 'admin-overview'
  | 'admin-questions'
  | 'admin-confusion'
  | 'admin-clarity'
  | 'admin-sources'
  | 'admin-handover'
  | 'admin-meetings';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  scheduledFor?: string | null;
  createdAt: string;
}
