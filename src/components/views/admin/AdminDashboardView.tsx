/**
 * Admin Command Center Overview
 * Executive dashboard for UniPods programme directors and secretariat.
 */

import React from 'react';
import {
  Users,
  MessageSquare,
  AlertTriangle,
  Inbox,
  ShieldCheck,
  FileCheck2,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ConfusionAlert, RecurringQuestion, HumanHandoverTicket, ActiveTab } from '../../../types';
import { ConfusionAlertCard } from '../../common/ConfusionAlertCard';

interface AdminDashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  confusionAlerts: ConfusionAlert[];
  recurringQuestions: RecurringQuestion[];
  handoverTickets: HumanHandoverTicket[];
  onResolveConfusion: (alert: ConfusionAlert) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigate,
  confusionAlerts,
  recurringQuestions,
  handoverTickets,
  onResolveConfusion,
}) => {
  const openAlerts = confusionAlerts.filter((a) => a.status === 'active');
  const openTickets = handoverTickets.filter((t) => t.status === 'open');

  return (
    <div id="admin-dashboard-view" className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-full px-3 py-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              UniPods Secretariat Command
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Admin Command Center
          </h1>
          <p className="text-sm text-slate-300 font-normal max-w-xl">
            Monitor cohort comprehension, detect conflicting announcements, resolve participant friction, and pre-screen official updates.
          </p>
        </div>
      </div>

      {/* 4 Stat Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-semibold">Cohort Members</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">62</div>
          <span className="text-[11px] text-emerald-700 font-medium">3 Active Tracks</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-semibold">Queries Answered</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">87</div>
          <span className="text-[11px] text-emerald-700 font-medium">96% Grounded Accuracy</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-semibold">Confusion Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{openAlerts.length}</div>
          <span className="text-[11px] text-amber-800 font-medium">
            {openAlerts.length > 0 ? 'Action Recommended' : 'All Clear'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-semibold">Handover Tickets</span>
            <Inbox className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{openTickets.length}</div>
          <span className="text-[11px] text-rose-700 font-medium">Needs Human Review</span>
        </div>
      </div>

      {/* Priority Section: Confusion Detector Widget */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900">
              Active Confusion Detector
            </h2>
          </div>
          <button
            onClick={() => onNavigate('admin-confusion')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
          >
            <span>View All ({confusionAlerts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {confusionAlerts.map((alert) => (
          <ConfusionAlertCard
            key={alert.id}
            alert={alert}
            onResolveConflict={onResolveConfusion}
            onReviewConflict={() => onNavigate('admin-confusion')}
          />
        ))}
      </div>

      {/* Admin Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recurring Questions Quick Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Top Recurring Inquiries</h3>
            <button
              onClick={() => onNavigate('admin-questions')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              See all
            </button>
          </div>

          <div className="space-y-2">
            {recurringQuestions.slice(0, 3).map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-900">{q.question}</p>
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    Asked by {q.frequency} participants • Status: {q.status}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 whitespace-nowrap">
                  {q.frequency}x
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Announcement Clarity Checker Tool Banner */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <FileCheck2 className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Pre-Broadcast Inspection
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Announcement Clarity Checker
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Test draft announcements against 9 clarity factors (audience, date, time, timezone, links, deadlines, actions) before blasting WhatsApp groups.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <span className="text-[11px] text-emerald-300 font-semibold">Prevents 80% of repetitive questions</span>
            <button
              onClick={() => onNavigate('admin-clarity')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xs transition-colors"
            >
              Launch Checker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
