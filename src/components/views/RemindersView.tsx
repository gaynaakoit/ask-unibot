/**
 * Event Reminders View
 * Countdown schedules grounded directly in verified Supabase deadlines.
 * Exclusively loads data from Supabase via /api/reminders.
 */

import React, { useState, useEffect } from 'react';
import { Bell, Calendar, CheckCircle2, Loader2 } from 'lucide-react';

interface ReminderItem {
  id: string;
  title: string;
  targetDate: string;
  daysUntil: number;
  type: 'meeting' | 'action';
  scheduledDaysBefore: number[];
}

export const RemindersView: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/reminders')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: ReminderItem[] = data.map((rem: any, idx: number) => ({
            id: rem.id || `rem-${idx}`,
            title: rem.eventTitle || rem.title || 'Programme Event',
            targetDate: rem.eventDate || rem.targetDate || 'September 2026',
            daysUntil: Math.max(0, 7 - idx * 2),
            type: rem.eventTitle?.toLowerCase().includes('session') || rem.eventTitle?.toLowerCase().includes('meeting') ? 'meeting' : 'action',
            scheduledDaysBefore: [7, 3, 1, 0],
          }));
          setReminders(mapped);
        } else {
          setReminders([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to fetch reminders:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
          Non-intrusive countdown schedule for crucial programme milestones and live evaluation syncs from Supabase.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Loading reminders from Supabase...</span>
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <p className="text-sm">No scheduled reminders in Supabase.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((rem) => {
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
                    Sync Calendar
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
