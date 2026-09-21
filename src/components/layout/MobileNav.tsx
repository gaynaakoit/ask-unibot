/**
 * Mobile Bottom Navigation Component
 * Optimized for 390x844px and up with >= 44px touch targets.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  CheckSquare,
  Menu,
  X,
  CalendarDays,
  BookOpen,
  Newspaper,
  Bell,
  Smartphone,
  User,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Inbox,
  HelpCircle,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingActionsCount: number;
  isAdminMode: boolean;
  onToggleRole: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  pendingActionsCount,
  isAdminMode,
  onToggleRole,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Bar */}
      <nav
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg"
      >
        <div className="flex items-center justify-around">
          {/* Home */}
          <button
            id="mobile-nav-home"
            onClick={() => handleSelect('dashboard')}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'dashboard'
                ? 'text-blue-900 font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          {/* Ask */}
          <button
            id="mobile-nav-ask"
            onClick={() => handleSelect('ask')}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'ask'
                ? 'text-blue-900 font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px]">Ask</span>
          </button>

          {/* Missed */}
          <button
            id="mobile-nav-missed"
            onClick={() => handleSelect('what-did-i-miss')}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors relative ${
              activeTab === 'what-did-i-miss'
                ? 'text-blue-900 font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px]">Missed</span>
          </button>

          {/* Actions */}
          <button
            id="mobile-nav-actions"
            onClick={() => handleSelect('actions')}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors relative ${
              activeTab === 'actions'
                ? 'text-blue-900 font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px]">Actions</span>
            {pendingActionsCount > 0 && (
              <span className="absolute top-1 right-3 w-4 h-4 bg-amber-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center">
                {pendingActionsCount}
              </span>
            )}
          </button>

          {/* More Menu Drawer Trigger */}
          <button
            id="mobile-nav-more"
            onClick={() => setIsDrawerOpen(true)}
            className="min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 py-1 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>

      {/* Slide-over More Menu Drawer */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 border-t border-slate-200 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Ask UniBot Navigation</h3>
                <p className="text-xs text-slate-700">METI UniPods AI Innovation Programme</p>
              </div>
              <button
                id="btn-close-mobile-drawer"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-full text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Mode Switcher */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  {isAdminMode ? 'Admin Workspace Active' : 'Participant Mode (Awa Diop)'}
                </span>
                <p className="text-[11px] text-slate-700">
                  {isAdminMode ? 'Manage sources & confusion' : 'View grounded student companion'}
                </p>
              </div>
              <button
                id="btn-mobile-toggle-role"
                onClick={() => {
                  onToggleRole();
                  setIsDrawerOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-blue-900 text-white rounded-lg hover:bg-blue-950"
              >
                Switch
              </button>
            </div>

            {/* Participant Links */}
            <div>
              <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Participant Sections
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'meetings' as ActiveTab, label: 'Meeting Memory', icon: CalendarDays },
                  { id: 'sources' as ActiveTab, label: 'Approved Sources', icon: BookOpen },
                  { id: 'recaps' as ActiveTab, label: 'Daily/Weekly Recaps', icon: Newspaper },
                  { id: 'reminders' as ActiveTab, label: 'Event Reminders', icon: Bell },
                  { id: 'whatsapp-sim' as ActiveTab, label: 'WhatsApp Simulator', icon: Smartphone },
                  { id: 'profile' as ActiveTab, label: 'Participant Profile', icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left min-h-[44px]"
                    >
                      <Icon className="w-4 h-4 text-blue-800 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-900">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin Links */}
            <div>
              <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Admin Command Center
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'admin-overview' as ActiveTab, label: 'Command Overview', icon: LayoutDashboard },
                  { id: 'admin-confusion' as ActiveTab, label: 'Confusion Detector', icon: AlertTriangle },
                  { id: 'admin-questions' as ActiveTab, label: 'Recurring Questions', icon: HelpCircle },
                  { id: 'admin-clarity' as ActiveTab, label: 'Clarity Checker', icon: FileCheck2 },
                  { id: 'admin-handover' as ActiveTab, label: 'Handover Queue', icon: Inbox },
                  { id: 'admin-sources' as ActiveTab, label: 'Source Management', icon: BookOpen },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left min-h-[44px]"
                    >
                      <Icon className="w-4 h-4 text-indigo-700 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-900">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
