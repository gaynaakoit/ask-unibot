/**
 * Human Handover Queue View
 * Direct administrative escalation workflow for unconfirmed or high-ambiguity participant queries.
 */

import React, { useState } from 'react';
import { Inbox, CheckCircle2, User, ShieldAlert, Send, Check } from 'lucide-react';
import { HumanHandoverTicket } from '../../../types';

interface AdminHandoverViewProps {
  tickets: HumanHandoverTicket[];
  onResolveTicket?: (ticketId: string, resolution: string) => void;
}

export const AdminHandoverView: React.FC<AdminHandoverViewProps> = ({
  tickets,
  onResolveTicket,
}) => {
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendResolution = (ticketId: string) => {
    setResolvedIds((prev) => [...prev, ticketId]);
    if (onResolveTicket) {
      onResolveTicket(ticketId, replyText);
    }
    setActiveReplyId(null);
    setReplyText('');
  };

  return (
    <div id="admin-handover-view" className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
            <Inbox className="w-4 h-4 text-rose-700" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Human Handover Queue</h2>
        </div>
        <p className="text-xs text-slate-700">
          When Ask UniBot encounters ambiguous policy or lacks verified source evidence, queries are cleanly routed here for human intervention.
        </p>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.map((t) => {
          const isResolved = resolvedIds.includes(t.id) || t.status === 'confirmed' || (t.status as string) === 'resolved';

          return (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 transition-colors ${
                isResolved ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700">Ticket #{t.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {isResolved ? 'RESOLVED' : 'ACTION REQUIRED'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{t.question}</h3>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-700 font-medium">Assigned To:</span>
                  <p className="font-bold text-slate-900">{t.recommendedAdmin}</p>
                </div>
              </div>

              {/* Context Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Participant Context:</span>
                  <span className="font-bold text-slate-900">{t.participantContext}</span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="font-semibold text-amber-900">Flagged Issue:</span>{' '}
                  <span className="text-amber-800">{t.conflictOrMissing}</span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Sources Checked by Bot:</span>{' '}
                  <span className="text-slate-700">{t.sourcesChecked.join(', ')}</span>
                </div>
              </div>

              {/* Admin Resolution Area */}
              {activeReplyId === t.id ? (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-800">
                    Official Admin Response / Directive
                  </label>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter official programme clarification to update knowledge base and notify participant..."
                    className="w-full p-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setActiveReplyId(null)}
                      className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendResolution(t.id)}
                      className="px-4 py-1.5 text-xs font-bold bg-blue-900 text-white rounded-lg hover:bg-blue-950 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Clarification</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-700">
                    {isResolved ? 'Clarified in programme database' : 'Awaiting admin official sign-off'}
                  </span>

                  {!isResolved && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveReplyId(t.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
                      >
                        Provide Official Resolution
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
