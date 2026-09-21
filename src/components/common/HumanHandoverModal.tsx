/**
 * Human Handover Modal Component
 * Smooth escalation flow when AI lacks ground truth or uncovers ambiguous policy.
 */

import React, { useState } from 'react';
import { X, Send, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';
import { HumanHandoverTicket } from '../../types';

interface HumanHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticket: Partial<HumanHandoverTicket>) => void;
  initialQuestion?: string;
  sourcesChecked?: string[];
  conflictOrMissing?: string;
  participantName?: string;
}

export const HumanHandoverModal: React.FC<HumanHandoverModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialQuestion = '',
  sourcesChecked = ['UniPods Announcement #12', 'MIT Learn Module 4', 'Meeting Notes 21 Sep'],
  conflictOrMissing = 'Approved programme documents do not address this specific policy query.',
  participantName = 'Awa Diop (UniPods AI Cohort 2026)',
}) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [adminTarget, setAdminTarget] = useState('Dr. Aminata Touré (Lead Facilitator)');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      question,
      sourcesChecked,
      conflictOrMissing,
      participantContext: participantName,
      recommendedAdmin: adminTarget,
      status: 'open',
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1600);
  };

  return (
    <div
      id="modal-human-handover"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">
                Human Organiser Handover
              </h3>
              <p className="text-xs text-slate-700 mt-1">
                Escalate uncertain or unconfirmed questions to the UniPods team
              </p>
            </div>
          </div>

          <button
            id="btn-close-handover"
            onClick={onClose}
            className="text-slate-700 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Ticket Dispatched to Organisers</h4>
            <p className="text-xs text-slate-700 max-w-xs mx-auto">
              Your query has been added to the UniPods Admin Command Center queue. Dr. Aminata Touré or Eng. Kwame Mensah will respond.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Participant Query
              </label>
              <textarea
                id="input-handover-question"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Describe your question or policy clarification..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                required
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Sources Checked:</span>
                <span className="text-[11px] text-slate-700 font-medium">3 approved files</span>
              </div>
              <ul className="text-[11px] text-slate-700 list-disc pl-4 space-y-0.5">
                {sourcesChecked.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>

              <div className="pt-2 border-t border-slate-200">
                <span className="font-semibold text-amber-900">Flagged Issue:</span>{' '}
                <span className="text-amber-800 text-[11px]">{conflictOrMissing}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Participant Context
                </label>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium">
                  {participantName}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recommended Organiser
                </label>
                <select
                  id="select-handover-admin"
                  value={adminTarget}
                  onChange={(e) => setAdminTarget(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Dr. Aminata Touré (Lead Facilitator)">
                    Dr. Aminata Touré (Lead Facilitator)
                  </option>
                  <option value="Eng. Kwame Mensah (Academic Director)">
                    Eng. Kwame Mensah (Academic Director)
                  </option>
                  <option value="Secretariat Rapporteur (Dakar Desk)">
                    Secretariat Desk (Dakar)
                  </option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                id="btn-submit-handover"
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Organiser</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
