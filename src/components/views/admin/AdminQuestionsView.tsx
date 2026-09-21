/**
 * Recurring Questions View
 * Analytics on most frequent participant questions to prioritize official communications.
 */

import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, AlertTriangle, MessageSquare, Plus, Check } from 'lucide-react';
import { RecurringQuestion } from '../../../types';

interface AdminQuestionsViewProps {
  questions: RecurringQuestion[];
  onAddOfficialAnswer?: (questionId: string, answer: string) => void;
}

export const AdminQuestionsView: React.FC<AdminQuestionsViewProps> = ({ questions }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'needs_admin' | 'confirmed'>('all');
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  const filtered = questions.filter((q) => {
    if (activeTab === 'needs_admin') return q.status === 'NEEDS_ADMIN_CONFIRMATION';
    if (activeTab === 'confirmed') return q.status === 'CONFIRMED';
    return true;
  });

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => [...prev, id]);
  };

  return (
    <div id="admin-questions-view" className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            <HelpCircle className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Cohort Recurring Questions</h2>
        </div>
        <p className="text-xs text-slate-700">
          Ranked log of participant queries asking for clarification across WhatsApp and Ask UniBot.
        </p>

        {/* Filter Tabs */}
        <div className="mt-4 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('needs_admin')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'needs_admin'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Needs Confirmation
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Confirmed
          </button>
        </div>
      </div>

      {/* Questions Feed */}
      <div className="space-y-3">
        {filtered.map((q) => {
          const isResolved = resolvedIds.includes(q.id);

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs space-y-3 transition-colors ${
                q.status === 'NEEDS_ADMIN_CONFIRMATION'
                  ? 'border-amber-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
                      Asked by {q.frequency} participants
                    </span>
                    <span className="text-xs text-slate-700">Last asked: {q.lastAsked}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{q.question}</h3>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    q.status === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : q.status === 'NEEDS_ADMIN_CONFIRMATION'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {q.status === 'CONFIRMED'
                    ? 'Confirmed Ground Truth'
                    : q.status === 'NEEDS_ADMIN_CONFIRMATION'
                    ? 'Needs Admin Action'
                    : 'Unconfirmed / Not Found'}
                </span>
              </div>

              {q.suggestedAnswer && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    Current Grounded Response:
                  </span>
                  <p className="leading-relaxed">{q.suggestedAnswer}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-700">
                  Associated Topic: <strong className="text-slate-800">{q.topic}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResolve(q.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                      isResolved
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isResolved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved</span>
                      </>
                    ) : (
                      <span>Mark Addressed</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
