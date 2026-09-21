/**
 * Decision Timeline Component
 * Visually illustrates how programme decisions evolve, solidify, and supersede previous notices.
 */

import React from 'react';
import { CheckCircle2, Clock, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import { DecisionTimelineItem } from '../../types';

interface DecisionTimelineProps {
  items: DecisionTimelineItem[];
}

export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({ items }) => {
  const getTypeBadge = (type: DecisionTimelineItem['type']) => {
    switch (type) {
      case 'decision_confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Decision Confirmed
          </span>
        );
      case 'official_update':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-100 border border-blue-300 rounded px-2 py-0.5">
            <Calendar className="w-3 h-3 text-blue-700" />
            Official Update
          </span>
        );
      case 'meeting':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-800 bg-indigo-100 border border-indigo-300 rounded px-2 py-0.5">
            <Clock className="w-3 h-3 text-indigo-700" />
            Meeting Sync
          </span>
        );
      case 'participant_action':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded px-2 py-0.5">
            <ArrowRight className="w-3 h-3 text-amber-700" />
            Participant Action
          </span>
        );
    }
  };

  return (
    <div id="decision-timeline-container" className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {items.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          {/* Timeline Node Dot */}
          <div
            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
              item.type === 'decision_confirmed'
                ? 'bg-emerald-600 ring-emerald-300'
                : item.type === 'official_update'
                ? 'bg-blue-600 ring-blue-300'
                : 'bg-slate-400 ring-slate-200'
            }`}
          />

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-semibold text-slate-700">{item.date}</span>
              {getTypeBadge(item.type)}
            </div>

            <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
            <p className="text-xs text-slate-700 leading-relaxed">{item.description}</p>

            {item.supersedesNote && (
              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{item.supersedesNote}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
