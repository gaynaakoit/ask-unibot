/**
 * Actions View Component
 * Personal participation task manager for cohort members.
 */

import React, { useState } from 'react';
import { CheckSquare, Filter, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ActionItem, ActionStatus, Source } from '../../types';
import { ActionCard } from '../common/ActionCard';

interface ActionsViewProps {
  actions: ActionItem[];
  onToggleComplete: (id: string) => void;
  onViewSourceModal: (source: Source) => void;
  allSources: Source[];
}

export const ActionsView: React.FC<ActionsViewProps> = ({
  actions,
  onToggleComplete,
  onViewSourceModal,
  allSources,
}) => {
  const [filter, setFilter] = useState<'all' | ActionStatus>('all');

  const filtered = actions.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const handleViewSourceById = (sourceId?: string) => {
    if (!sourceId) return;
    const src = allSources.find((s) => s.id === sourceId);
    if (src) {
      onViewSourceModal(src);
    }
  };

  const completedCount = actions.filter((a) => a.status === 'completed').length;

  return (
    <div id="actions-view" className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckSquare className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">My Actions</h2>
          </div>
          <p className="text-xs text-slate-700">
            Personal milestone actions derived from verified announcements and meeting decisions.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs flex items-center gap-3">
          <div>
            <span className="font-semibold text-slate-700">Progress:</span>{' '}
            <span className="font-bold text-slate-900">
              {completedCount} of {actions.length} Completed
            </span>
          </div>
          <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{
                width: `${actions.length > 0 ? (completedCount / actions.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: `All (${actions.length})` },
          { id: 'pending', label: 'Pending' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`btn-filter-actions-${tab.id}`}
            onClick={() => setFilter(tab.id as any)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl font-semibold transition-colors ${
              filter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((act) => (
            <ActionCard
              key={act.id}
              action={act}
              onToggleComplete={onToggleComplete}
              onViewSource={handleViewSourceById}
            />
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-700">
            No action items matching this filter.
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span>
          <strong>Participation Privacy:</strong> Individual completion checklists are private to you. Organisers only view aggregate cohort health indicators.
        </span>
      </div>
    </div>
  );
};
