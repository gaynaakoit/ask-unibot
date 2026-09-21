/**
 * Meeting Memory Card Component
 * Stores and renders structured memory for each programme session:
 * What was discussed, decisions, action items, resources, next session, and source.
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  Link2,
} from 'lucide-react';
import { Meeting } from '../../types';

interface MeetingCardProps {
  meeting: Meeting;
  defaultExpanded?: boolean;
  onViewSource?: (sourceId: string) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  defaultExpanded = false,
  onViewSource,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      id={`meeting-memory-card-${meeting.id}`}
      className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300"
    >
      {/* Card Header */}
      <div
        className="p-5 cursor-pointer bg-slate-50/60 hover:bg-slate-50 transition-colors border-b border-slate-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full px-2.5 py-0.5 capitalize">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                {meeting.status}
              </span>
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-700" />
                {meeting.date}
              </span>
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-700" />
                {meeting.time}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {meeting.title}
            </h3>
          </div>

          <button
            id={`btn-toggle-meeting-${meeting.id}`}
            aria-label={isExpanded ? 'Collapse meeting memory' : 'Expand meeting memory'}
            className="p-1.5 rounded-lg text-slate-700 hover:text-slate-700 hover:bg-slate-200 transition-colors flex-shrink-0"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Quick summary highlights preview when collapsed */}
        {!isExpanded && meeting.decisions.length > 0 && (
          <div className="mt-3 text-xs text-slate-700 flex items-center gap-2">
            <span className="font-semibold text-slate-700">Key Decision:</span>
            <span className="truncate">{meeting.decisions[0].title}</span>
          </div>
        )}
      </div>

      {/* Expanded Memory Content */}
      {isExpanded && (
        <div className="p-5 space-y-6">
          {/* Section 1: WHAT WAS DISCUSSED */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              What Was Discussed
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 pl-3">
              {meeting.whatWasDiscussed.map((item, idx) => (
                <li key={idx} className="list-disc pl-1 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: DECISIONS */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Decisions
            </h4>
            <div className="space-y-2">
              {meeting.decisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">{dec.title}</p>
                    {dec.supersedesPrevious && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 flex-shrink-0 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-700" />
                        Supersedes previous update
                      </span>
                    )}
                  </div>
                  {dec.supersedesNote && (
                    <p className="text-[11px] text-amber-800 font-medium mt-1">
                      {dec.supersedesNote}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-700 mt-1">
                    <span className="font-semibold">Impact:</span> {dec.impact}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: ACTION ITEMS */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Action Items
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {meeting.actionItems.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-medium text-slate-900">{act.title}</p>
                    <p className="text-[11px] text-slate-700">Assignee: {act.assignee}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap bg-slate-100 px-2 py-1 rounded">
                    Due: {act.deadline}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: RESOURCES */}
          {meeting.resources.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                Resources
              </h4>
              <div className="flex flex-wrap gap-2">
                {meeting.resources.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                  >
                    {res.type === 'recording' ? (
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{res.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: NEXT SESSION & SOURCE */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-700">
              <span className="font-bold text-slate-900">Next Session:</span>{' '}
              <span className="text-slate-700 font-medium">{meeting.nextSession}</span>
            </div>

            <button
              id={`btn-meeting-source-${meeting.id}`}
              onClick={() => onViewSource && onViewSource(meeting.sourceId)}
              className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Source: {meeting.sourceTitle}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
