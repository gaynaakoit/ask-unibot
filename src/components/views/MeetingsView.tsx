/**
 * Meeting Memory View
 * Structured archive of session outcomes, decisions, and evolutionary timeline.
 */

import React, { useState } from 'react';
import { CalendarDays, GitCommit, Calendar, Filter, Sparkles } from 'lucide-react';
import { Meeting, DecisionTimelineItem, Source } from '../../types';
import { MeetingCard } from '../common/MeetingCard';
import { DecisionTimeline } from '../common/DecisionTimeline';

interface MeetingsViewProps {
  meetings: Meeting[];
  timeline: DecisionTimelineItem[];
  onViewSourceModal: (source: Source) => void;
  allSources: Source[];
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  timeline,
  onViewSourceModal,
  allSources,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'timeline'>('cards');

  const handleViewSourceById = (sourceId: string) => {
    const src = allSources.find((s) => s.id === sourceId);
    if (src) {
      onViewSourceModal(src);
    }
  };

  return (
    <div id="meetings-view" className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
              <CalendarDays className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Meeting Memory</h2>
          </div>
          <p className="text-xs text-slate-700">
            Never lose what was agreed. Track verified decisions, action assignments, and session recordings.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            id="btn-meetings-tab-cards"
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'cards'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Session Cards ({meetings.length})
          </button>
          <button
            id="btn-meetings-tab-timeline"
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'timeline'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Decision Timeline
          </button>
        </div>
      </div>

      {activeTab === 'cards' ? (
        <div className="space-y-4">
          {meetings.map((m, idx) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              defaultExpanded={idx === 0}
              onViewSource={handleViewSourceById}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Programme Decision Evolution</h3>
            <p className="text-xs text-slate-700">
              Chronological log of notices, session agreements, and superseding modifications.
            </p>
          </div>
          <DecisionTimeline items={timeline} />
        </div>
      )}
    </div>
  );
};
