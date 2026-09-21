/**
 * Participant Profile View
 * Displays user enrollment details, preferences, and explicit data protection standards.
 */

import React, { useState } from 'react';
import { User, ShieldCheck, Bell, Sparkles, Check, Lock } from 'lucide-react';
import { UserProfile } from '../../types';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser }) => {
  const [saved, setSaved] = useState(false);
  const [plainPreference, setPlainPreference] = useState(user.preferences.plainLanguageExplanationPreferred);
  const [smartSilence, setSmartSilence] = useState(user.preferences.smartSilenceActive);
  const [digestFreq, setDigestFreq] = useState(user.preferences.digestFrequency);

  const handleSave = () => {
    onUpdateUser({
      preferences: {
        plainLanguageExplanationPreferred: plainPreference,
        smartSilenceActive: smartSilence,
        digestFrequency: digestFreq,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div id="profile-view" className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            <User className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Participant Profile</h2>
        </div>
        <p className="text-xs text-slate-700">
          Your enrolled UniPods programme identity and personal notification preferences.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white font-bold text-xl flex items-center justify-center shadow-xs">
            AD
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{user.name}</h3>
            <p className="text-xs text-slate-700">{user.email}</p>
            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-2 py-0.5">
              Enrolled Participant
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="font-semibold text-slate-700 block">Programme Cohort</span>
            <span className="font-bold text-slate-900 text-sm">{user.cohort}</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="font-semibold text-slate-700 block">UniPod Innovation Center</span>
            <span className="font-bold text-slate-900 text-sm">{user.unipod}</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="font-semibold text-slate-700 block">Learning Specialization Track</span>
            <span className="font-bold text-slate-900 text-sm">{user.track}</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="font-semibold text-slate-700 block">Hackathon Team Project</span>
            <span className="font-bold text-slate-900 text-sm">{user.team}</span>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Personal AI Companion Preferences</h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={smartSilence}
              onChange={(e) => setSmartSilence(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Smart Silence Protection</span>
              <span className="text-slate-700">
                Keep UniBot completely silent during casual group chat. Only respond to direct summons (@Ask UniBot).
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={plainPreference}
              onChange={(e) => setPlainPreference(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Prefer Plain-Language Simplification</span>
              <span className="text-slate-700">
                Automatically render plain, jargon-free explanations alongside official regulatory announcements.
              </span>
            </div>
          </label>

          <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">Digest Frequency</span>
              <span className="text-slate-700">Schedule for "What Did I Miss" executive briefings.</span>
            </div>
            <select
              value={digestFreq}
              onChange={(e) => setDigestFreq(e.target.value as any)}
              className="p-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
            >
              <option value="daily">Daily Brief (08:30 WAT)</option>
              <option value="weekly">Weekly Digest (Monday 08:30 WAT)</option>
              <option value="none">Manual Only</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preferences Saved</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>

      {/* Data Protection & Ethical AI Charter */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2.5 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <Lock className="w-4 h-4" />
          <span>Ask UniBot Privacy & Grounding Charter</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Ask UniBot is committed to participant safety and grounded truth. We strictly adhere to three core rules:
        </p>
        <ul className="text-slate-300 space-y-1 pl-4 list-disc">
          <li><strong>No Shaming:</strong> Individual task completion and check-ins are strictly private and never displayed publicly.</li>
          <li><strong>Zero Guesswork:</strong> Ask UniBot answers exclusively from approved sources. If unknown, it flags for human confirmation.</li>
          <li><strong>Ethical Respect:</strong> No personal attributes, genders, or demographic inferences are ever generated.</li>
        </ul>
      </div>
    </div>
  );
};
