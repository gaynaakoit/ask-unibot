/**
 * Announcement Clarity Checker View
 * Pre-screening tool for programme organizers to stress-test updates before broadcast.
 */

import React, { useState } from 'react';
import {
  FileCheck2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { AnnouncementClarityCheck } from '../../../types';
import { geminiService } from '../../../services/geminiService';

export const AdminClarityView: React.FC = () => {
  const sampleVagueDraft = `Hey everyone, reminder that we have a live sync this week to go over the prototype concepts. Please be on time and bring your questions!`;

  const [draft, setDraft] = useState(sampleVagueDraft);
  const [result, setResult] = useState<AnnouncementClarityCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!draft.trim()) return;
    setIsLoading(true);
    try {
      const evaluation = await geminiService.checkAnnouncementClarity(draft);
      setResult(evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyImproved = () => {
    if (result?.improvedDraft) {
      navigator.clipboard.writeText(result.improvedDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div id="admin-clarity-view" className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            <FileCheck2 className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Announcement Clarity Checker</h2>
        </div>
        <p className="text-xs text-slate-700">
          Evaluates announcement drafts against 9 structural criteria to ensure zero ambiguity before broadcasting to WhatsApp.
        </p>
      </div>

      {/* Editor & Action Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Draft Announcement Text
          </label>
          <button
            onClick={() => setDraft(sampleVagueDraft)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Load Sample Vague Draft</span>
          </button>
        </div>

        <textarea
          id="input-clarity-draft"
          rows={5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste or write your draft announcement..."
          className="w-full p-4 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-normal"
        />

        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-700 font-medium">
            Checks audience, date, time, timezone, meeting link, action, deadline, purpose, and prerequisites.
          </span>
          <button
            id="btn-run-clarity-check"
            onClick={handleAnalyze}
            disabled={isLoading || !draft.trim()}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{isLoading ? 'Inspecting Draft...' : 'Run Clarity Check'}</span>
          </button>
        </div>
      </div>

      {/* Evaluation Results */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          {/* Score Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Clarity Benchmark Result
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Cohort Readiness Evaluation
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-900">{result.score}/100</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  {result.score >= 80 ? 'Ready to Send' : 'Needs Essential Details'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center font-bold text-sm bg-slate-50 text-slate-800">
                {result.score}%
              </div>
            </div>
          </div>

          {/* Present vs Missing Elements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Present Elements */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Detected Elements ({result.presentElements.length})
              </h4>
              {result.presentElements.length > 0 ? (
                <ul className="space-y-1 text-xs text-emerald-950 capitalize">
                  {result.presentElements.map((el, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      {el}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-800 italic">No structural criteria found.</p>
              )}
            </div>

            {/* Missing Elements */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Missing Key Elements ({result.missingElements.length})
              </h4>
              {result.missingElements.length > 0 ? (
                <ul className="space-y-1 text-xs text-amber-950 capitalize">
                  {result.missingElements.map((el, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      {el}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-800 font-medium">All 9 structural criteria detected!</p>
              )}
            </div>
          </div>

          {/* Concrete Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recommendations to Prevent Follow-up Confusion:
              </h4>
              <div className="space-y-1.5">
                {result.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 flex items-start gap-2"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Polished / Auto-Generated Replacement Announcement */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Polished Ready-to-Send Version
                </h4>
              </div>

              <button
                id="btn-copy-improved-clarity"
                onClick={handleCopyImproved}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy for WhatsApp Broadcast</span>
                  </>
                )}
              </button>
            </div>

            <pre className="text-xs font-mono text-slate-200 bg-slate-950/80 p-4 rounded-xl border border-white/10 whitespace-pre-wrap leading-relaxed">
              {result.improvedDraft}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
