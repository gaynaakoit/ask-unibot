/**
 * Action Card Component
 * Personal participation action tracker for individual participants.
 */

import React from 'react';
import { Calendar, CheckCircle2, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { ActionItem, ActionStatus } from '../../types';

interface ActionCardProps {
  action: ActionItem;
  onToggleComplete?: (id: string) => void;
  onViewSource?: (sourceId?: string) => void;
  compact?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  onToggleComplete,
  onViewSource,
  compact = false,
}) => {
  const getStatusBadge = (status: ActionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-full px-2.5 py-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-300 rounded-full px-2.5 py-0.5">
            <Clock className="w-3 h-3 text-blue-600" />
            In Progress
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-300 rounded-full px-2.5 py-0.5">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Overdue
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-full px-2.5 py-0.5">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
    }
  };

  const isCompleted = action.status === 'completed';

  return (
    <div
      id={`action-card-${action.id}`}
      className={`rounded-xl border transition-all ${
        isCompleted
          ? 'border-slate-200 bg-slate-50/70 opacity-80'
          : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {onToggleComplete && (
            <button
              id={`btn-toggle-action-${action.id}`}
              onClick={() => onToggleComplete(action.id)}
              aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 hover:border-slate-400 bg-white'
              }`}
            >
              {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {getStatusBadge(action.status)}
              {action.priority === 'high' && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 uppercase tracking-wide">
                  High Priority
                </span>
              )}
            </div>

            <h4
              className={`text-sm font-semibold text-slate-900 leading-snug ${
                isCompleted ? 'line-through text-slate-700' : ''
              }`}
            >
              {action.title}
            </h4>

            {action.notes && (
              <p className="text-xs text-slate-700 mt-1">{action.notes}</p>
            )}

            <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-700 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-700" />
                Due: {action.dueDate}
              </span>

              {action.sourceTitle && (
                <button
                  id={`btn-view-source-action-${action.id}`}
                  onClick={() => onViewSource && onViewSource(action.sourceId)}
                  className="text-slate-700 hover:text-blue-700 underline truncate max-w-[220px]"
                >
                  Source: {action.sourceTitle}
                </button>
              )}
            </div>
          </div>
        </div>

        {action.resourceLink && (
          <a
            id={`btn-open-action-resource-${action.id}`}
            href={action.resourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
          >
            <span>{action.resourceName || 'Open Resource'}</span>
            <ExternalLink className="w-3 h-3 text-blue-700" />
          </a>
        )}
      </div>
    </div>
  );
};
