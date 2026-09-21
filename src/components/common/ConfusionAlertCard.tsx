/**
 * Confusion Alert Component
 * Highlights cohort-wide friction points where conflicting messages or obsolete notices
 * have generated repeated participant queries.
 */

import React from 'react';
import { AlertTriangle, Users, GitCompare, CheckCircle2 } from 'lucide-react';
import { ConfusionAlert, Source } from '../../types';

interface ConfusionAlertCardProps {
  alert: ConfusionAlert;
  onReviewConflict?: (alert: ConfusionAlert) => void;
  onResolveConflict?: (alert: ConfusionAlert) => void;
  onViewSource?: (source: Source) => void;
}

export const ConfusionAlertCard: React.FC<ConfusionAlertCardProps> = ({
  alert,
  onReviewConflict,
  onResolveConflict,
}) => {
  const isResolved = alert.status === 'resolved';

  return (
    <div
      id={`confusion-alert-${alert.id}`}
      className={`rounded-2xl border transition-all ${
        isResolved
          ? 'border-emerald-200 bg-emerald-50/40'
          : 'border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 shadow-xs'
      } p-5`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wide ${
              isResolved
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {isResolved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                RESOLVED BY ADMIN
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                HIGH CONFUSION DETECTED
              </>
            )}
          </span>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5">
            <Users className="w-3.5 h-3.5 text-slate-700" />
            {alert.participantCount} participants asked
          </span>
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-1.5">{alert.topic}</h3>

      <div className="text-xs text-slate-700 mb-3 space-y-1">
        <p>
          <span className="font-semibold text-slate-900">Root Cause:</span> {alert.reason}
        </p>
        {alert.resolutionNote && (
          <p className="text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-medium">
            <span className="font-bold">Official Resolution:</span> {alert.resolutionNote}
          </p>
        )}
      </div>

      {/* Conflicting Sources Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 space-y-2">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
          Conflicting Sources in Knowledge Base
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {alert.sources.map((src) => (
            <div
              key={src.id}
              className={`p-2.5 rounded-lg border ${
                src.status === 'superseded'
                  ? 'border-amber-200 bg-amber-50/50'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span>{src.date}</span>
                <span className={`capitalize ${src.status === 'superseded' ? 'text-amber-800' : 'text-emerald-800'}`}>
                  {src.status}
                </span>
              </div>
              <p className="font-semibold text-slate-900 line-clamp-1">{src.title}</p>
              <p className="text-slate-700 text-[11px] line-clamp-2 mt-1 italic">
                "{src.content}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {onReviewConflict && (
          <button
            id={`btn-review-conflict-${alert.id}`}
            onClick={() => onReviewConflict(alert)}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
          >
            Review Conflict Details
          </button>
        )}

        {!isResolved && onResolveConflict && (
          <button
            id={`btn-resolve-conflict-${alert.id}`}
            onClick={() => onResolveConflict(alert)}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
          >
            Confirm 29 Sep & Lock Source
          </button>
        )}
      </div>
    </div>
  );
};
