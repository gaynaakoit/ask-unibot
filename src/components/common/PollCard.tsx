/**
 * Poll Card Component
 * Transparent cohort pulse check with explicit participation ratio display.
 */

import React, { useState } from 'react';
import { BarChart3, CheckCircle2, Users } from 'lucide-react';
import { Poll } from '../../types';

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionId: string) => void;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onVote }) => {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(poll.userVotedId);
  const [hasVoted, setHasVoted] = useState<boolean>(Boolean(poll.userVotedId));

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setHasVoted(true);
    if (onVote) {
      onVote(poll.id, optionId);
    }
  };

  const total = poll.totalResponses + (hasVoted && !poll.userVotedId ? 1 : 0);

  return (
    <div
      id={`poll-card-${poll.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          Active Cohort Poll
        </span>
        <span className="text-xs text-slate-700 font-medium">Closes {poll.closesAt}</span>
      </div>

      <h3 className="text-sm font-bold text-slate-900 mb-3">{poll.question}</h3>

      <div className="space-y-2 mb-3">
        {poll.options.map((opt) => {
          const effectiveVotes = opt.votes + (hasVoted && selectedOption === opt.id && !poll.userVotedId ? 1 : 0);
          const percent = total > 0 ? Math.round((effectiveVotes / total) * 100) : 0;
          const isChosen = selectedOption === opt.id;

          return (
            <button
              key={opt.id}
              id={`poll-opt-${opt.id}`}
              onClick={() => handleSelect(opt.id)}
              className={`w-full text-left p-3 rounded-xl border relative overflow-hidden transition-all flex items-center justify-between gap-3 text-xs ${
                isChosen
                  ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
              }`}
            >
              {/* Vote Percentage Fill Bar */}
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 bg-blue-100/60 pointer-events-none transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              )}

              <span className="relative z-10 font-semibold text-slate-900 flex items-center gap-2">
                {isChosen && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                {opt.text}
              </span>

              {hasVoted && (
                <span className="relative z-10 font-bold text-slate-700">
                  {percent}% ({effectiveVotes})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Participation Attribution Note */}
      <div className="flex items-center justify-between text-xs text-slate-700 pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1 font-medium">
          <Users className="w-3.5 h-3.5 text-slate-700" />
          <span>
            {total} of {poll.totalParticipants} participants responded.
          </span>
        </div>
        <span className="text-[11px] text-slate-700 italic">
          Aggregate cohort data only
        </span>
      </div>
    </div>
  );
};
