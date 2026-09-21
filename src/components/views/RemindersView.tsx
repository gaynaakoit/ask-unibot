/**
 * Event Reminders View
 * Countdown schedules (7 days, 3 days, 1 day, Day-of) grounded in verified deadlines.
 */

import React from 'react';
import { Bell, Calendar, Clock, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { INITIAL_REMINDERS } from '../../data/demoData';

export const RemindersView: React.FC = () => {
  return (
    <div id="reminders-view" className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            <Bell className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Event & Milestone Reminders</h2>
        </div>
        <p className="text-xs text-slate-700">
          Non-intrusive countdown schedule for crucial programme milestones and live evaluation syncs.
        </p>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {INITIAL_REMINDERS.map((rem) => {
          const scheduleSteps = [
            { label: '7 Days Before', active: rem.scheduledDaysBefore.includes(7) },
            { label: '3 Days Before', active: rem.scheduledDaysBefore.includes(3) },
            { label: '1 Day Before', active: rem.scheduledDaysBefore.includes(1) },
            { label: 'Day of Event', active: rem.scheduledDaysBefore.includes(0) },
          ];

          return (
            <div
              key={rem.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-2 py-0.5 uppercase tracking-wide">
                      {rem.daysUntil === 0 ? 'Happening Today' : `${rem.daysUntil} Days Remaining`}
                    </span>
                    <span className="text-xs text-slate-700 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-700" />
                      {rem.targetDate}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{rem.title}</h3>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-800">
                  {rem.type === 'meeting' ? 'Live Session' : 'Deliverable Deadline'}
                </span>
              </div>

              {/* Progress Milestones Cadence */}
              <div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Notification Schedule
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {scheduleSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold ${
                        step.active
                          ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {step.active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{step.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                <span>Verified against official UniPods announcements</span>
                <span className="font-semibold text-blue-700 hover:underline cursor-pointer">
                  Add to Google Calendar
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
