/**
 * Admin Confusion Detector View
 * Automatically identifies ambiguity or conflicting announcements across the cohort.
 */

import React, { useState } from 'react';
import { AlertTriangle, GitCompare, CheckCircle2, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';
import { ConfusionAlert, Source } from '../../../types';
import { ConfusionAlertCard } from '../../common/ConfusionAlertCard';

interface AdminConfusionViewProps {
  alerts: ConfusionAlert[];
  onResolveConfusion: (alert: ConfusionAlert) => void;
  onViewSourceModal: (source: Source) => void;
}

export const AdminConfusionView: React.FC<AdminConfusionViewProps> = ({
  alerts,
  onResolveConfusion,
  onViewSourceModal,
}) => {
  const [selectedAlert, setSelectedAlert] = useState<ConfusionAlert | null>(alerts[0] || null);

  return (
    <div id="admin-confusion-view" className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Confusion Detector</h2>
        </div>
        <p className="text-xs text-slate-700">
          Identifies cohort-wide knowledge friction before misunderstandings compound. Compare conflicting sources and lock the official ground truth.
        </p>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <ConfusionAlertCard
            key={alert.id}
            alert={alert}
            onResolveConflict={onResolveConfusion}
            onReviewConflict={(a) => setSelectedAlert(a)}
          />
        ))}
      </div>

      {/* Side-by-Side Detailed Comparison Modal / Drawer */}
      {selectedAlert && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5 uppercase tracking-wide">
                Side-by-Side Source Forensics
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Conflict Breakdown: {selectedAlert.topic}
              </h3>
            </div>

            {selectedAlert.status !== 'resolved' && (
              <button
                id="btn-resolve-sidebyside"
                onClick={() => onResolveConfusion(selectedAlert)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Confirm 29 Sep & Lock
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earlier Source */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Historical / Preliminary Notice</span>
                <span className="text-slate-700">18 Sep 2026</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                Milestone 2 Briefing Document
              </h4>
              <div className="p-3 rounded-lg bg-white border border-amber-200 text-xs text-slate-800 italic">
                "Prototype concepts must be submitted by Sunday, 27 September 2026 at 23:59 WAT for mentor review."
              </div>
              <p className="text-[11px] text-amber-800">
                Notice: Dispatched prior to the Dakar field validation extension request.
              </p>
            </div>

            {/* Newer Clarifying Source */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">Latest Organiser Clarification</span>
                <span className="text-slate-700">21 Sep 2026</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                Secretariat Broadcast Notice #14
              </h4>
              <div className="p-3 rounded-lg bg-white border border-emerald-200 text-xs text-slate-800 italic">
                "Official extension: To support field interviews, the prototype concept deadline is moved to Tuesday, 29 September 2026 at 23:59 WAT."
              </div>
              <p className="text-[11px] text-emerald-800">
                Author: Dr. Aminata Touré (Lead Facilitator) — Highest Authority Level.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <h5 className="font-bold text-slate-900">Recommended Resolution Action:</h5>
            <p>
              Locking the resolution marks the 18 Sep document as <strong>superseded</strong> in the Knowledge Retrieval index. Subsequent participant queries will immediately return <strong>CONFIRMED (29 Sep 2026)</strong> and explain that 27 Sep was superseded.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
