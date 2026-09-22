/**
 * Recaps & Briefs View
 * Delivers "Today's UniPods Brief" and "This Week in UniPods" digests.
 * Fetches data strictly from Supabase via /api/recaps.
 */

import React, { useState, useEffect } from 'react';
import { Newspaper, Copy, Check, Calendar, Loader2 } from 'lucide-react';
import { Recap } from '../../types';

interface RecapsViewProps {
  recaps?: Recap[];
}

export const RecapsView: React.FC<RecapsViewProps> = ({ recaps: propRecaps }) => {
  const [recaps, setRecaps] = useState<Recap[]>(propRecaps || []);
  const [loading, setLoading] = useState<boolean>(!propRecaps || propRecaps.length === 0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (propRecaps && propRecaps.length > 0) {
      setRecaps(propRecaps);
      setLoading(false);
      return;
    }

    let isMounted = true;
    fetch('/api/recaps')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted) {
          setRecaps(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch recaps:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propRecaps]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="recaps-view" className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            <Newspaper className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Daily & Weekly Recaps</h2>
        </div>
        <p className="text-xs text-slate-700">
          Curated executive summaries synthesized directly from Supabase verified programme decisions and milestones.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Loading recaps from Supabase...</span>
        </div>
      ) : recaps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <p className="text-sm">No recaps available yet in Supabase.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recaps.map((recap) => {
            const isCopied = copiedId === recap.id;
            const formattedSummary = `📢 ${recap.title} (${recap.date})\n\n` +
              `ANNOUNCEMENTS:\n${recap.announcements.map((a) => `• ${a}`).join('\n')}\n\n` +
              `KEY DISCUSSIONS & DECISIONS:\n${recap.keyDiscussions.map((d) => `• ${d}`).join('\n')}\n\n` +
              `REQUIRED ACTIONS:\n${recap.actions.map((act) => `• ${act}`).join('\n')}\n\n` +
              `— Verified by Ask UniBot`;

            return (
              <div
                key={recap.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 uppercase tracking-wide">
                        {recap.type === 'daily' ? "Today's Brief" : 'Weekly Digest'}
                      </span>
                      <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-700" />
                        {recap.date}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{recap.title}</h3>
                  </div>

                  <button
                    id={`btn-copy-recap-${recap.id}`}
                    onClick={() => handleCopy(recap.id, formattedSummary)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied for WhatsApp</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-700" />
                        <span>Copy for Group Chat</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Announcements */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Announcements & Milestones
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 pl-3">
                    {recap.announcements.map((a, idx) => (
                      <li key={idx} className="list-disc pl-1 leading-relaxed">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Discussions */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Key Discussions & Decisions
                  </h4>
                  <div className="space-y-1.5">
                    {recap.keyDiscussions.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Action Items
                  </h4>
                  <div className="space-y-1 text-xs text-slate-700">
                    {recap.actions.map((act, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
