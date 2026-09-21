/**
 * Source Details Modal
 * Full transparency inspector for knowledge base sources and citations.
 */

import React from 'react';
import { X, FileText, ShieldCheck, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { Source } from '../../types';

interface SourceModalProps {
  source: Source | null;
  onClose: () => void;
}

export const SourceModal: React.FC<SourceModalProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <div
      id="modal-source-inspector"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 capitalize">
                {source.type.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-700">{source.date}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">{source.title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-700 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <span className="font-semibold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">
              Full Verified Content
            </span>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 leading-relaxed italic text-xs sm:text-sm font-normal">
              "{source.content}"
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-semibold text-slate-700 block">Authority / Author</span>
              <span className="font-bold text-slate-900">{source.author}</span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-semibold text-slate-700 block">Approval Status</span>
              <span
                className={`font-bold capitalize ${
                  source.status === 'superseded' ? 'text-amber-800' : 'text-emerald-800'
                }`}
              >
                {source.status === 'superseded' ? 'Superseded (Obsolete)' : source.status}
              </span>
            </div>
          </div>

          {source.supersedes && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Notice of Supersession:</span>
                This announcement formally replaces and updates earlier preliminary guidance.
              </div>
            </div>
          )}

          {source.url && (
            <div className="pt-2">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
              >
                <span>Open Original Programme Portal Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-700">
          <span>Grounded Programme Memory Artifact</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
