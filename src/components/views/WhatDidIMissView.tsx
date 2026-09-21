/**
 * What Did I Miss View
 * Signature catch-up interface enabling participants to digest days of missed discussion
 * into verified, actionable executive briefs.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Filter,
} from 'lucide-react';
import { WhatDidIMissPeriod, Source, ActionItem, Meeting } from '../../types';
import { ActionCard } from '../common/ActionCard';
import { EvidenceCard } from '../common/EvidenceCard';

interface WhatDidIMissViewProps {
  onViewSourceModal: (source: Source) => void;
  onToggleAction: (id: string) => void;
  onNavigateToAsk: (q: string) => void;
  actions: ActionItem[];
  meetings: Meeting[];
  sources: Source[];
}

interface AnnouncementItem {
  tag: string;
  date: string;
  title: string;
  desc: string;
}

interface DecisionItem {
  title: string;
  badge?: string;
  desc: string;
}

interface DeadlineItem {
  label: string;
  date: string;
  detail: string;
}

interface PeriodData {
  simple: string;
  announcements: AnnouncementItem[];
  meeting: {
    title: string;
    time: string;
    summary: string;
  };
  decisions: DecisionItem[];
  deadlines: DeadlineItem[];
  nextStepTitle: string;
  nextStepDesc: string;
}

export const WhatDidIMissView: React.FC<WhatDidIMissViewProps> = ({
  onViewSourceModal,
  onToggleAction,
  onNavigateToAsk,
  actions,
  meetings,
  sources,
}) => {
  const [period, setPeriod] = useState<WhatDidIMissPeriod>('today');
  const [showSimple, setShowSimple] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [isMarkedAsRead, setIsMarkedAsRead] = useState(false);
  const [customRange, setCustomRange] = useState<'48h' | '14d' | 'all'>('48h');

  const periods: { id: WhatDidIMissPeriod; label: string }[] = [
    { id: 'today', label: 'Today (21 Sep)' },
    { id: 'yesterday', label: 'Yesterday (20 Sep)' },
    { id: '3_days', label: 'Past 3 Days' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'last_meeting', label: 'Last Meeting' },
    { id: 'custom', label: 'Custom Range' },
  ];

  // Dynamic Content per Period
  const periodContent: Record<WhatDidIMissPeriod, PeriodData> = {
    today: {
      simple: 'Our next live session is tomorrow (Tuesday) morning at 10:00 AM on Microsoft Teams. The project deadline was moved to Tuesday, 29 September so you have extra days. Finish Module 4 on MIT portal before Thursday, and note that Zoom is retired in favor of Teams.',
      announcements: [
        {
          tag: 'Announcement #12',
          date: '21 Sep 2026, 09:30 WAT',
          title: 'Next Live Interactive Session Confirmed for Tuesday, 22 Sep 10:00 WAT',
          desc: 'Agenda focuses on practical evaluation of Milestone 2 prototypes and mentor Q&A. Teams will present a 2-minute architectural walk-through in breakout rooms.',
        },
        {
          tag: 'Infrastructure Notice',
          date: '21 Sep 2026',
          title: 'All Sessions Standardized on Microsoft Teams',
          desc: 'Old Zoom room has been retired. Please use MS Teams Room (teams.microsoft.com/unipods-2026-room1).',
        },
      ],
      meeting: {
        title: 'UniPods AI Innovation Session — Milestone 2 Alignment',
        time: 'Held 21 Sep 2026 (10:00 - 11:30 WAT)',
        summary: 'Dr. Aminata Touré and Eng. Kwame Mensah reviewed prototype milestones, customer validation criteria, and distributed $250 Google Cloud & Vertex AI vouchers.',
      },
      decisions: [
        {
          title: 'Prototype Concept Submission Deadline Extended to 29 Sep 2026, 23:59 WAT',
          badge: 'Supersedes 27 Sep',
          desc: 'Approved by Programme Secretariat to accommodate teams conducting field validation interviews in rural districts.',
        },
        {
          title: 'Evaluation Rubric Weights Formally Locked',
          desc: '40% technical implementation, 35% local African context impact, 25% customer interviews.',
        },
      ],
      deadlines: [
        { label: 'Upcoming Academic Deadline', date: '24 September 2026, 18:00 WAT', detail: 'MIT Learn Module 4 Lab & Quiz submission.' },
        { label: 'Milestone 2 Final Submission', date: '29 September 2026, 23:59 WAT', detail: 'Prototype concept deck + GitHub repository link.' },
      ],
      nextStepTitle: 'Join MS Teams tomorrow at 09:55 WAT for Milestone 2 Coaching',
      nextStepDesc: 'Test your Teams access, verify your microphone, and coordinate with your co-founder on who will share the 2-minute prototype demo screen.',
    },
    yesterday: {
      simple: 'Yesterday was focused on mentor office hours and cloud credits: Google Cloud & Vertex AI vouchers ($250 per team) were sent to your team email, and Wadhwani Foundation mentors gave guidance on how to conduct your 5 field interviews.',
      announcements: [
        {
          tag: 'Organiser Dispatch',
          date: '20 Sep 2026, 16:00 WAT',
          title: '$250 Vertex AI & Google Cloud Vouchers Dispatched',
          desc: 'Credit redemption codes sent to designated team technical leads. Credits apply to Gemini Pro/Flash API calls, Cloud Run containers, and vector embeddings.',
        },
        {
          tag: 'Curriculum Guidance',
          date: '20 Sep 2026',
          title: 'Customer Discovery Protocol & Interview Rubric Published',
          desc: 'Wadhwani Foundation uploaded the 5-point customer validation questionnaire template for smallholder farmer and rural clinic testing.',
        },
      ],
      meeting: {
        title: 'Mentor Office Hours — Technical & Cloud Infrastructure Check',
        time: 'Held 20 Sep 2026 (15:00 - 16:30 WAT)',
        summary: 'Technical mentors walked through setting up Vertex AI API keys in Express backends and recommended caching strategies for offline-first prototypes.',
      },
      decisions: [
        {
          title: 'Authorised Cloud Infrastructure Providers',
          desc: 'Teams are approved to use Google Cloud / Vertex AI or local open weights without penalty in grading.',
        },
        {
          title: 'Customer Validation Sample Size Requirement',
          desc: 'Every team must document quotes from minimum 5 prospective users in their target demographic.',
        },
      ],
      deadlines: [
        { label: 'Voucher Activation Recommended By', date: '23 September 2026, 23:59 WAT', detail: 'Redeem code in Google Cloud Console billing section.' },
        { label: 'Milestone 2 Prototype Submission', date: '29 September 2026, 23:59 WAT', detail: 'Concept deck with validation quotes and GitHub repo.' },
      ],
      nextStepTitle: 'Check your team technical lead inbox for Google Cloud vouchers',
      nextStepDesc: 'Confirm voucher receipt and verify that your team has initialized the GitHub repository for Milestone 2.',
    },
    '3_days': {
      simple: 'Across the last 3 days: The cohort received Google Cloud vouchers, transitioned entirely to MS Teams, and received an official deadline extension for Milestone 2 to 29 September.',
      announcements: [
        {
          tag: 'Programme Alignment',
          date: '19-21 Sep 2026',
          title: 'Core Milestone 2 Prototyping Directive',
          desc: 'Teams finalized their regional track choices and started customer discovery with smallholder farmers and clinic operators.',
        },
        {
          tag: 'Infrastructure Update',
          date: '19 Sep 2026',
          title: 'Zoom Room Decommissioned',
          desc: 'Transition to MS Teams room completed to support dedicated breakout rooms.',
        },
      ],
      meeting: {
        title: 'Milestone 2 Alignment & Mentor Tech Check',
        time: '19-21 Sep 2026',
        summary: 'Addressed question trends, demonstrated retrieval-augmented generation architectures, and distributed $250 vouchers.',
      },
      decisions: [
        {
          title: 'Deadline Extension to 29 Sep 2026 (Supersedes 27 Sep)',
          badge: 'Supersedes 27 Sep',
          desc: 'Official extension to allow thorough field interviews.',
        },
        {
          title: 'Rubric Weight Lock',
          desc: '40% tech, 35% local African impact, 25% customer interviews.',
        },
      ],
      deadlines: [
        { label: 'MIT Learn Module 4', date: '24 September 2026, 18:00 WAT', detail: 'RAG Lab & evaluation quiz.' },
        { label: 'Milestone 2 Submission', date: '29 September 2026, 23:59 WAT', detail: 'Concept deck and GitHub repo.' },
      ],
      nextStepTitle: 'Review your 4 action items and verify MS Teams access',
      nextStepDesc: 'Make sure your prototype repository is active and co-founders are assigned tasks.',
    },
    last_7_days: {
      simple: 'Over the past 7 days: The programme transitioned from initial concept to technical prototyping. The key milestones were: migrating all calls to MS Teams, releasing MIT Module 4 on RAG systems, distributing cloud compute vouchers, and extending the Milestone 2 deadline to 29 September.',
      announcements: [
        {
          tag: 'Programme Milestone',
          date: '17-21 Sep 2026',
          title: 'Milestone 2 Prototyping Phase Fully Underway',
          desc: 'All 62 participants across 3 regional tracks have formed teams and finalized problem statements for healthcare, agritech, and education.',
        },
        {
          tag: 'Infrastructure Transition',
          date: '19 Sep 2026',
          title: 'Formal Decommissioning of Zoom in favor of MS Teams Room 1',
          desc: 'Permanent migration completed to enhance call recording quality and direct OneDrive integration.',
        },
      ],
      meeting: {
        title: 'Weekly Cohort Review & Milestone 2 Alignment (2 Sessions)',
        time: 'Past 7 Days (17 Sep & 21 Sep)',
        summary: 'Addressed question trends, demonstrated retrieval-augmented generation architectures, and standardized grading rubric criteria.',
      },
      decisions: [
        {
          title: 'Prototype Concept Deadline Extended to 29 Sep 2026 (Supersedes 27 Sep)',
          badge: 'Supersedes 27 Sep',
          desc: 'Organisers officially granted a 2-day buffer following participant requests for rural testing.',
        },
        {
          title: 'Discontinuation of Zoom Conference Links',
          desc: 'All sessions exclusively hosted on MS Teams with meeting IDs pre-published in calendar.',
        },
      ],
      deadlines: [
        { label: 'Academic Module 4 Due', date: '24 September 2026, 18:00 WAT', detail: 'Context-Aware Retrieval and Voice AI Colab notebook.' },
        { label: 'Milestone 2 Deck Submission', date: '29 September 2026, 23:59 WAT', detail: 'Executive slide deck, recorded demo, and GitHub link.' },
      ],
      nextStepTitle: 'Complete MIT Learn Module 4 and review all 4 personal actions',
      nextStepDesc: 'Ensure your co-founders are synchronized on your prototype repository before the Tuesday sync.',
    },
    last_meeting: {
      simple: 'In the last meeting (21 Sep 10:00 WAT), Dr. Aminata Touré and Eng. Kwame Mensah reviewed the prototype evaluation rubric (40% tech, 35% local impact, 25% customer validation) and confirmed the two-day deadline extension to 29 September.',
      announcements: [
        {
          tag: 'Meeting Minutes',
          date: '21 Sep 2026, 11:45 WAT',
          title: 'Official Minutes Published: Milestone 2 Alignment Sync',
          desc: '58 participants in attendance. Discussed evaluation rubric, team formation, and customer interview methodologies.',
        },
      ],
      meeting: {
        title: 'UniPods AI Innovation Session — Milestone 2 Alignment',
        time: 'Held 21 Sep 2026 (10:00 - 11:30 WAT)',
        summary: 'Detailed presentation of judging rubric breakdown, live demonstration of retrieval-augmented generation with Gemini, and announcement of cloud credits.',
      },
      decisions: [
        {
          title: '2-Minute Prototype Breakout Demos on 22 Sep',
          desc: 'Each team will present rapid screen-share walkthrough to mentor panel in private breakout channels.',
        },
        {
          title: 'Formal Confirmation of 29 Sep 23:59 WAT Submission Lock',
          desc: 'Late submissions will incur a 10% penalty per 24-hour window.',
        },
      ],
      deadlines: [
        { label: 'Next Live Session', date: '22 September 2026, 10:00 WAT', detail: 'MS Teams Room 1 breakout pitches.' },
        { label: 'Milestone 2 Submission', date: '29 September 2026, 23:59 WAT', detail: 'Evaluation deck and repository.' },
      ],
      nextStepTitle: 'Rehearse your 2-minute prototype pitch with your team co-founder',
      nextStepDesc: 'Designate who will share screens and ensure local development server runs smoothly.',
    },
    custom: {
      simple: 'Showing verified programme updates filtered by your custom range. All information is sourced directly from approved UniPods secretariat archives.',
      announcements: [
        {
          tag: 'Custom Filter Range',
          date: 'Active Window',
          title: 'All Active Notices & Milestone Advisories',
          desc: 'Showing verified communications relevant to your customized filter criteria.',
        },
        {
          tag: 'Platform Directive',
          date: 'Permanent',
          title: 'Official Channel Policy',
          desc: 'Only announcements signed by Dr. Aminata Touré or Eng. Kwame Mensah constitute official policy.',
        },
      ],
      meeting: {
        title: 'Archived Meeting Records within Window',
        time: 'Active Filter Selection',
        summary: 'Access full session recordings, chat transcripts, and decision minutes from the Meetings Memory tab.',
      },
      decisions: [
        {
          title: 'Current Active Decisions in Selected Scope',
          desc: 'Prototype deadline: 29 Sep 23:59 WAT | Platform: MS Teams | Module 4 Due: 24 Sep 18:00 WAT.',
        },
      ],
      deadlines: [
        { label: 'Nearest Milestone', date: '24 September 2026, 18:00 WAT', detail: 'MIT Learn Module 4 Lab & Quiz.' },
        { label: 'Final Milestone 2', date: '29 September 2026, 23:59 WAT', detail: 'Concept deck and code.' },
      ],
      nextStepTitle: 'Select a predefined period or adjust time criteria',
      nextStepDesc: 'Toggle between Today, Yesterday, and Last 7 Days for pre-computed executive summaries.',
    },
    week: {
      simple: 'Over the past 7 days: The programme transitioned from initial concept to technical prototyping. The key milestones were: migrating all calls to MS Teams, releasing MIT Module 4 on RAG systems, distributing cloud compute vouchers, and extending the Milestone 2 deadline to 29 September.',
      announcements: [
        {
          tag: 'Programme Milestone',
          date: '17-21 Sep 2026',
          title: 'Milestone 2 Prototyping Phase Fully Underway',
          desc: 'All 62 participants across 3 regional tracks have formed teams and finalized problem statements for healthcare, agritech, and education.',
        },
      ],
      meeting: {
        title: 'Weekly Cohort Review & Milestone 2 Alignment (2 Sessions)',
        time: 'Past 7 Days (17 Sep & 21 Sep)',
        summary: 'Addressed question trends, demonstrated retrieval-augmented generation architectures, and standardized grading rubric criteria.',
      },
      decisions: [
        {
          title: 'Prototype Concept Deadline Extended to 29 Sep 2026 (Supersedes 27 Sep)',
          badge: 'Supersedes 27 Sep',
          desc: 'Organisers officially granted a 2-day buffer following participant requests for rural testing.',
        },
      ],
      deadlines: [
        { label: 'Academic Module 4 Due', date: '24 September 2026, 18:00 WAT', detail: 'Context-Aware Retrieval and Voice AI Colab notebook.' },
        { label: 'Milestone 2 Deck Submission', date: '29 September 2026, 23:59 WAT', detail: 'Executive slide deck, recorded demo, and GitHub link.' },
      ],
      nextStepTitle: 'Complete MIT Learn Module 4 and review all 4 personal actions',
      nextStepDesc: 'Ensure your co-founders are synchronized on your prototype repository before the Tuesday sync.',
    },
    all: {
      simple: 'Complete archive overview: All verified programme decisions, schedules, and active tasks across the entire METI UniPods AI Innovation Programme.',
      announcements: [
        {
          tag: 'Programme Overview',
          date: 'Full Cohort Duration',
          title: 'All Programme Communications',
          desc: 'Search or filter through all historical updates from secretariat members.',
        },
      ],
      meeting: {
        title: 'Full Meeting Archives',
        time: 'Cohort Inception to Present',
        summary: 'All recordings, transcripts, and attendee counts are indexed in the Meeting Memory tab.',
      },
      decisions: [
        {
          title: 'All Active Policy and Grading Directives',
          desc: 'All validated guidance issued by lead facilitators Dr. Aminata Touré and Eng. Kwame Mensah.',
        },
      ],
      deadlines: [
        { label: 'Nearest Milestone', date: '24 September 2026, 18:00 WAT', detail: 'MIT Learn Module 4 Lab & Quiz.' },
        { label: 'Milestone 2 Final Submission', date: '29 September 2026, 23:59 WAT', detail: 'Prototype concept deck.' },
      ],
      nextStepTitle: 'Select an individual time period for tailored actions',
      nextStepDesc: 'Use Today or Last Meeting to view specific action items and next steps.',
    },
  };

  const currentData: PeriodData = periodContent[period] || periodContent.today;

  return (
    <div id="what-did-i-miss-view" className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-900/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-full px-3 py-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Catch-up Intelligence
            </span>
            {isMarkedAsRead && (
              <span className="text-[11px] font-bold text-white/90 bg-white/20 rounded-full px-2.5 py-0.5">
                Marked as caught up
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            What Did I Miss?
          </h1>
          <p className="text-sm text-slate-200 font-normal max-w-xl">
            Catch up without scrolling through hundreds of WhatsApp messages. Everything verified against official records.
          </p>

          {/* Period Selector Tabs */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
            {periods.map((p) => (
              <button
                key={p.id}
                id={`btn-period-${p.id}`}
                onClick={() => {
                  setPeriod(p.id);
                  setIsMarkedAsRead(false);
                }}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  period === p.id
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Bar: Explain Simply, Show Sources, Mark as Read */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between gap-3 flex-wrap shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-toggle-explain-simply"
            onClick={() => setShowSimple(!showSimple)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              showSimple
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {showSimple ? 'Showing Simple Explanation' : 'Explain simply'}
          </button>

          <button
            id="btn-toggle-catchup-sources"
            onClick={() => setShowSources(!showSources)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              showSources
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {showSources ? 'Hide Sources' : 'Show Sources'}
          </button>
        </div>

        <button
          id="btn-mark-as-read"
          onClick={() => setIsMarkedAsRead(!isMarkedAsRead)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            isMarkedAsRead
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isMarkedAsRead ? 'Caught Up' : 'Mark as Read'}</span>
        </button>
      </div>

      {/* Plain-Language Explanation Callout if toggled */}
      {showSimple && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 animate-in fade-in duration-150">
          <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Plain Language Summary ({periods.find(p => p.id === period)?.label})
          </h4>
          <p className="leading-relaxed">
            {currentData.simple}
          </p>
        </div>
      )}

      {/* Structured Sections 1 to 7 */}
      <div className="space-y-6">
        {/* SECTION 1: IMPORTANT ANNOUNCEMENTS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Important Announcements ({currentData.announcements.length})
            </h3>
          </div>

          <div className="space-y-3">
            {currentData.announcements.map((ann, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
                  <span className="font-semibold text-blue-900">{ann.tag}</span>
                  <span>{ann.date}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{ann.title}</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{ann.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: MEETINGS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Meeting Memory
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span>{currentData.meeting.title}</span>
              <span className="text-slate-700">{currentData.meeting.time}</span>
            </div>
            <p className="text-slate-700">{currentData.meeting.summary}</p>
          </div>
        </div>

        {/* SECTION 3: DECISIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Verified Decisions ({currentData.decisions.length})
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {currentData.decisions.map((dec, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{dec.title}</span>
                  {dec.badge && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 flex-shrink-0">
                      {dec.badge}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 mt-1">{dec.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: DEADLINES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              4. Deadlines & Milestones
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {currentData.deadlines.map((dl, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                  {dl.label}
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{dl.date}</p>
                <p className="text-slate-700 mt-1">{dl.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: RELEVANT RESOURCES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              5. Relevant Resources
            </h3>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {[
              { title: 'Milestone 2 Evaluation Deck (PDF)', url: 'https://unipods.noti.org/resources/m2-deck.pdf' },
              { title: 'Customer Interview Template (Wadhwani)', url: 'https://wadhwanifoundation.org/toolkit/interviews' },
              { title: 'Microsoft Teams Room 1', url: 'https://teams.microsoft.com/l/meetup-join/unipods-2026-room1' },
              { title: 'MIT Learn Portal — Module 4', url: 'https://learn.mit.edu/courses/unipods-ai-2026' },
            ].map((res, idx) => (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{res.title}</span>
                <ExternalLink className="w-3 h-3 text-slate-700" />
              </a>
            ))}
          </div>
        </div>

        {/* SECTION 6: YOUR ACTIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              6. Your Personal Actions
            </h3>
          </div>

          <div className="space-y-2.5">
            {actions.map((act) => (
              <ActionCard
                key={act.id}
                action={act}
                onToggleComplete={onToggleAction}
              />
            ))}
          </div>
        </div>

        {/* SECTION 7: MOST IMPORTANT NEXT STEP */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              7. Most Important Next Step
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            {currentData.nextStepTitle}
          </h3>
          <p className="text-xs text-blue-100/90 leading-relaxed mb-4">
            {currentData.nextStepDesc}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="https://teams.microsoft.com/l/meetup-join/unipods-2026-room1"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xs transition-colors"
            >
              Test Teams Room Link
            </a>
            <button
              onClick={() => onNavigateToAsk('What do I need to prepare for tomorrow?')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
            >
              Ask UniBot what to prepare
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 8: EVIDENCE ATTACHMENT (When show sources is enabled) */}
      {showSources && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Evidence Behind This Catch-up Brief ({sources.slice(0, 3).length} Sources)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sources.slice(0, 4).map((s) => (
              <EvidenceCard
                key={s.id}
                source={s}
                onOpenDetails={onViewSourceModal}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
