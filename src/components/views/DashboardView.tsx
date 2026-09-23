/**
 * Participant Dashboard View
 * Primary landing overview for participants in the UniPods AI Innovation Programme.
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { Meeting, ActionItem, Announcement, Poll, Source, ActiveTab } from '../../types';
import { PollCard } from '../common/PollCard';
import { ActionCard } from '../common/ActionCard';
import { EvidenceCard } from '../common/EvidenceCard';

interface DashboardViewProps {
  userName?: string;
  onNavigate: (tab: ActiveTab) => void;
  onAskQuestion: (q: string) => void;
  nextMeeting: Meeting;
  priorityAction?: ActionItem;
  latestAnnouncement: Announcement;
  poll: Poll;
  onVotePoll: (pollId: string, optionId: string) => void;
  onToggleAction: (id: string) => void;
  onViewSourceModal: (source: Source) => void;
  allSources: Source[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userName = 'Participant',
  onNavigate,
  onAskQuestion,
  nextMeeting,
  priorityAction,
  latestAnnouncement,
  poll,
  onVotePoll,
  onToggleAction,
  onViewSourceModal,
  allSources,
}) => {
  const [quickInput, setQuickInput] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onAskQuestion(quickInput.trim());
      onNavigate('ask');
    }
  };

  const handleSuggestedClick = (question: string) => {
    onAskQuestion(question);
    onNavigate('ask');
  };

  const announcementSource = allSources.find((s) => s.id === latestAnnouncement.sourceId);

  return (
    <div id="participant-dashboard" className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-900/40 relative overflow-hidden">
        {/* Subtle decorative radial accent */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-full px-3 py-0.5">
              UniPods AI Innovation Programme 2026
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-white">
            Good morning, {userName}
          </h1>
          <p className="text-sm text-blue-100/90 font-normal max-w-xl">
            Stay informed. Know what matters. Take the next step.
          </p>

          {/* Quick Ask Input inside hero */}
          <form onSubmit={handleQuickSubmit} className="mt-6 max-w-2xl">
            <div className="relative flex items-center bg-white rounded-2xl shadow-md border border-white/20 p-1.5 focus-within:ring-2 focus-within:ring-emerald-400">
              <input
                id="input-dashboard-ask"
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Ask UniBot anything you missed, meetings, or deadlines..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
              <button
                id="btn-dashboard-submit-ask"
                type="submit"
                aria-label="Ask UniBot"
                className="p-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Quick suggested chips */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-xs text-blue-100">
              <span className="font-semibold text-white/80 whitespace-nowrap">Suggested:</span>
              {[
                'What did I miss today?',
                'When is the next live session?',
                'When is the prototype deadline?',
                'Summarise the last meeting',
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestedClick(q)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] border border-white/15 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* Signature 3-Hero Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: NEXT SESSION */}
        <div
          id="card-next-session"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              Next Session
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-2 mb-1">
              UniPods AI Innovation Session
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-700 mt-2">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Tuesday, 22 September
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                10:00 WAT
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-2 line-clamp-2">
              Milestone 2 practical evaluation and interactive breakout coaching with MIT mentors on MS Teams.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              id="btn-view-session-details"
              onClick={() => onNavigate('meetings')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
            >
              <span>View details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="https://teams.microsoft.com/l/meetup-join/unipods-2026-room1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Join MS Teams
            </a>
          </div>
        </div>

        {/* CARD 2: ACTION REQUIRED */}
        <div
          id="card-action-required"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              Action Required
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-2 mb-1">
              {priorityAction ? priorityAction.title : 'Complete MIT Learn module 4'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-700 mt-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-semibold text-slate-900">
                Deadline: {priorityAction ? priorityAction.dueDate : '24 September 2026, 18:00 WAT'}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-2 line-clamp-2">
              Interactive lab notebook on Context-Aware Retrieval and multilingual African agricultural prompts.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              id="btn-open-actions-page"
              onClick={() => onNavigate('actions')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
            >
              <span>Open all actions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {priorityAction?.resourceLink && (
              <a
                href={priorityAction.resourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
              >
                <span>Launch</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* CARD 3: WHAT DID I MISS (Signature Hook) */}
        <div
          id="card-what-did-i-miss"
          className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-700" />
                What Did I Miss?
              </span>
              <span className="text-[11px] font-bold text-emerald-800">3 new updates</span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mt-2 mb-1">
              Catch up on today's verified updates
            </h3>
            <p className="text-xs text-slate-700 mt-1">
              No scrolling through 400 WhatsApp messages. Get a crisp bullet breakdown of decisions, deadline extensions, and next steps.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-700">Updated 21 Sep 2026</span>
            <button
              id="btn-catch-me-up"
              onClick={() => onNavigate('what-did-i-miss')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <span>Catch me up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Latest Verified Update & Personal Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Latest Verified Update + Meeting Memory Snapshot */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Verified Announcement */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Latest Verified Programme Announcement
                </h3>
              </div>
              <span className="text-xs text-slate-700 font-medium">
                {latestAnnouncement.date}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-3">
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                {latestAnnouncement.title}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {latestAnnouncement.content}
              </p>

              {latestAnnouncement.requiredAction && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Next Step: {latestAnnouncement.requiredAction}
                  </span>
                  {latestAnnouncement.deadline && (
                    <span className="text-slate-700 font-medium">
                      By {latestAnnouncement.deadline}
                    </span>
                  )}
                </div>
              )}
            </div>

            {announcementSource && (
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="truncate">
                  Source: <strong className="text-slate-800">{announcementSource.title}</strong>
                </span>
                <button
                  id="btn-announcement-view-source"
                  onClick={() => onViewSourceModal(announcementSource)}
                  className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 flex-shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Inspect Source</span>
                </button>
              </div>
            )}
          </div>

          {/* Recent Meeting Memory Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Meeting Memory
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {nextMeeting.title}
                </h3>
              </div>
              <button
                id="btn-goto-meetings"
                onClick={() => onNavigate('meetings')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
              >
                <span>View Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-800">Key Decisions Made:</div>
              {nextMeeting.decisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-2"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{dec.title}</p>
                    {dec.supersedesNote && (
                      <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                        {dec.supersedesNote}
                      </p>
                    )}
                  </div>
                  {dec.supersedesPrevious && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 whitespace-nowrap flex-shrink-0">
                      Supersedes previous
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Priority Actions & Cohort Pulse Poll */}
        <div className="space-y-6">
          {/* Action List Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Pending Actions</h3>
              <button
                id="btn-view-all-actions"
                onClick={() => onNavigate('actions')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                View all
              </button>
            </div>

            {priorityAction ? (
              <ActionCard
                action={priorityAction}
                onToggleComplete={onToggleAction}
                compact
              />
            ) : (
              <p className="text-xs text-slate-700 italic">No pending actions right now.</p>
            )}
          </div>

          {/* Cohort Pulse Poll */}
          <PollCard poll={poll} onVote={onVotePoll} />
        </div>
      </div>
    </div>
  );
};
