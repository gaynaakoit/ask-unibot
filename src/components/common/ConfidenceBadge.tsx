/**
 * Confidence Badge Component
 * Accessible, clear indicator for AI answer confidence states.
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { ConfidenceState } from '../../types';

interface ConfidenceBadgeProps {
  confidence: ConfidenceState;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  size = 'md',
  showDescription = false,
}) => {
  if (confidence === 'CONFIRMED') {
    return (
      <div className="inline-flex flex-col gap-1">
        <span
          id="badge-confidence-confirmed"
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-emerald-50 border-emerald-300 text-emerald-800 ${
            size === 'sm'
              ? 'px-2.5 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-4 py-1.5 text-sm'
              : 'px-3 py-1 text-xs'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>CONFIRMED</span>
        </span>
        {showDescription && (
          <span className="text-[11px] text-emerald-700">
            Verified by current approved UniPods programme documentation
          </span>
        )}
      </div>
    );
  }

  if (confidence === 'NEEDS_ADMIN_CONFIRMATION') {
    return (
      <div className="inline-flex flex-col gap-1">
        <span
          id="badge-confidence-needs-admin"
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-amber-50 border-amber-300 text-amber-900 ${
            size === 'sm'
              ? 'px-2.5 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-4 py-1.5 text-sm'
              : 'px-3 py-1 text-xs'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>NEEDS ADMIN CONFIRMATION</span>
        </span>
        {showDescription && (
          <span className="text-[11px] text-amber-800">
            Conflicting information detected across recent announcements
          </span>
        )}
      </div>
    );
  }

  // NOT_FOUND
  return (
    <div className="inline-flex flex-col gap-1">
      <span
        id="badge-confidence-not-found"
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-rose-50 border-rose-300 text-rose-800 ${
          size === 'sm'
            ? 'px-2.5 py-0.5 text-xs'
            : size === 'lg'
            ? 'px-4 py-1.5 text-sm'
            : 'px-3 py-1 text-xs'
        }`}
      >
        <HelpCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
        <span>NOT FOUND IN OFFICIAL UPDATES</span>
      </span>
      {showDescription && (
        <span className="text-[11px] text-rose-700">
          No approved UniPods source confirms this. Ask UniBot does not hallucinate.
        </span>
      )}
    </div>
  );
};
