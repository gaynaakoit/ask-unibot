/**
 * App Navbar Component
 * Features the brand, Smart Silence state, Role switcher (Participant / Admin),
 * and Demo Tour Trigger for judges.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  VolumeX,
  Volume2,
  HelpCircle,
  ArrowRightLeft,
  Info,
  Layers,
  X,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface NavbarProps {
  isAdminMode: boolean;
  onToggleRole: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  smartSilenceEnabled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdminMode,
  onToggleRole,
  activeTab,
  onSelectTab,
  smartSilenceEnabled = true,
}) => {
  const [showSilenceInfo, setShowSilenceInfo] = useState(false);
  const [showDemoTour, setShowDemoTour] = useState(false);

  return (
    <>
      <header
        id="app-header"
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo and Programme Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab(isAdminMode ? 'admin-overview' : 'dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-blue-950 transition-colors">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                    Ask UniBot
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                    METI UniPods
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 hidden sm:block font-medium">
                  Trusted Group Memory & Personal Companion
                </p>
              </div>
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Smart Silence Indicator */}
            <div className="relative">
              <button
                id="btn-smart-silence-info"
                onClick={() => setShowSilenceInfo(!showSilenceInfo)}
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                title="Click to learn about Smart Silence"
              >
                {smartSilenceEnabled ? (
                  <VolumeX className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-slate-700" />
                )}
                <span>Smart Silence is ON</span>
                <Info className="w-3 h-3 text-emerald-600 opacity-60" />
              </button>

              {/* Smart Silence Info Popover */}
              {showSilenceInfo && (
                <div className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl bg-white border border-slate-200 shadow-lg z-50 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <VolumeX className="w-4 h-4" />
                      Smart Silence
                    </span>
                    <button
                      onClick={() => setShowSilenceInfo(false)}
                      className="text-slate-700 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="leading-relaxed">
                    Ask UniBot stays quiet unless you call it, message it privately, or ask an official programme question. It never interrupts normal WhatsApp conversation or peer troubleshooting.
                  </p>
                  <button
                    onClick={() => {
                      setShowSilenceInfo(false);
                      onSelectTab('whatsapp-sim');
                    }}
                    className="w-full text-center font-semibold text-blue-700 hover:underline pt-1 text-[11px]"
                  >
                    View WhatsApp Simulator →
                  </button>
                </div>
              )}
            </div>

            {/* Quick Demo Walkthrough Guide Button for Judges */}
            <button
              id="btn-demo-tour"
              onClick={() => setShowDemoTour(true)}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 text-indigo-800 hover:bg-indigo-100 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Judge Demo Tour</span>
            </button>

            {/* Role Switcher Pill (Participant / Admin) */}
            <button
              id="btn-toggle-role"
              onClick={onToggleRole}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                isAdminMode
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isAdminMode ? 'Admin Command' : 'Participant (Awa Diop)'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Demo Tour Modal for Hackathon Judges */}
      {showDemoTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                  METI UniPods AI Innovation
                </span>
                <h3 className="text-base font-bold">Ask UniBot — 30-Second Judge Tour</h3>
              </div>
              <button
                onClick={() => setShowDemoTour(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-3.5 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">
                Follow this recommended 7-step evaluation flow to experience the full depth of Ask UniBot:
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    step: 1,
                    title: 'Participant Dashboard',
                    desc: 'See upcoming sessions, personal actions, and quick catch-up cards.',
                    action: () => {
                      onSelectTab('dashboard');
                      setShowDemoTour(false);
                    },
                  },
                  {
                    step: 2,
                    title: 'What Did I Miss?',
                    desc: 'Open the signature catch-up interface. View structured announcements, meetings, and next steps.',
                    action: () => {
                      onSelectTab('what-did-i-miss');
                      setShowDemoTour(false);
                    },
                  },
                  {
                    step: 3,
                    title: 'Ask UniBot (Grounded Q&A)',
                    desc: 'Try asking "When is the next live session?" (CONFIRMED) vs "When is the prototype deadline?" (CONFIRMATION / Conflict).',
                    action: () => {
                      onSelectTab('ask');
                      setShowDemoTour(false);
                    },
                  },
                  {
                    step: 4,
                    title: 'Smart Silence WhatsApp Simulator',
                    desc: 'Witness how UniBot ignores conversational chatter and only answers when called.',
                    action: () => {
                      onSelectTab('whatsapp-sim');
                      setShowDemoTour(false);
                    },
                  },
                  {
                    step: 5,
                    title: 'Switch to Admin Command Center',
                    desc: 'Toggle into Admin mode using the top-right button.',
                    action: () => {
                      if (!isAdminMode) onToggleRole();
                      onSelectTab('admin-overview');
                      setShowDemoTour(false);
                    },
                  },
                  {
                    step: 6,
                    title: 'Confusion Detector',
                    desc: 'Review the 18 Sep vs 21 Sep deadline conflict and 1-click resolve it.',
                    action: () => {
                      if (!isAdminMode) onToggleRole();
                      onSelectTab('admin-confusion');
                      setShowDemoTour(false);
                    },
                  },
                  {
                    step: 7,
                    title: 'Announcement Clarity Checker',
                    desc: 'Test an announcement draft to verify audience, timezone, actions, and auto-improve it.',
                    action: () => {
                      if (!isAdminMode) onToggleRole();
                      onSelectTab('admin-clarity');
                      setShowDemoTour(false);
                    },
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {item.step}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                        <p className="text-[11px] text-slate-700">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={item.action}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded-lg flex-shrink-0"
                    >
                      Jump to View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-700">Hackathon Demonstration Guide</span>
              <button
                onClick={() => setShowDemoTour(false)}
                className="px-4 py-1.5 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-950 transition-colors"
              >
                Start Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
