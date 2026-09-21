/**
 * Evidence Card Component
 * Transparently displays the verifiable source behind every factual answer.
 */

import React from 'react';
import { FileText, ExternalLink, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { Source } from '../../types';

interface EvidenceCardProps {
  source: Source;
  onOpenDetails?: (source: Source) => void;
  compact?: boolean;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  source,
  onOpenDetails,
  compact = false,
}) => {
  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'organiser_update':
        return 'Organiser Update';
      case 'official_whatsapp':
        return 'Official WhatsApp Broadcast';
      case 'mit_learn':
        return 'MIT Learn Curriculum';
      case 'wadhwani':
        return 'Wadhwani Foundation';
      case 'meeting_note':
        return 'Meeting Minutes';
      case 'verified_programme_material':
        return 'Verified Programme Material';
      default:
        return 'Official Source';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'superseded':
        return 'bg-amber-50 text-amber-700 border-amber-200 line-through';
      case 'expiring_soon':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      id={`evidence-card-${source.id}`}
      className={`rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:border-slate-300 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5">
            <FileText className="w-3 h-3 text-blue-600" />
            {getSourceTypeLabel(source.type)}
          </span>
          <span
            className={`text-[11px] font-medium border rounded-md px-2 py-0.5 capitalize ${getStatusColor(
              source.status
            )}`}
          >
            {source.status === 'superseded' ? 'Superseded' : source.status}
          </span>
          {source.isDemo && (
            <span className="text-[10px] text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
              Demo source
            </span>
          )}
        </div>
        <span className="text-xs text-slate-700 font-medium whitespace-nowrap flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {source.date}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-1.5">
        {source.title}
      </h4>

      <p className="text-xs text-slate-600 line-clamp-3 mb-3 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        "{(source as any).evidence || source.content}"
      </p>

      <div className="flex items-center justify-between text-xs text-slate-700 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="truncate max-w-[200px]">{source.author}</span>
        </div>

        {onOpenDetails ? (
          <button
            id={`btn-source-details-${source.id}`}
            onClick={() => onOpenDetails(source)}
            className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1"
          >
            <span>View Source</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        ) : source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1"
          >
            <span>Open Link</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : null}
      </div>

      {source.supersedes && (
        <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0 text-amber-600" />
          <span>Supersedes earlier announcement from 18 Sep 2026</span>
        </div>
      )}
    </div>
  );
};
