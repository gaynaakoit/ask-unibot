/**
 * Desktop Sidebar Navigation Component
 */

import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  CalendarDays,
  CheckSquare,
  BookOpen,
  Newspaper,
  Bell,
  Smartphone,
  User,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  FileCheck2,
  Inbox,
  Clock,
  Layers,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isAdminMode: boolean;
  pendingActionsCount: number;
  openConfusionCount: number;
  openHandoverCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isAdminMode,
  pendingActionsCount,
  openConfusionCount,
  openHandoverCount,
}) => {
  const participantNav = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ask' as ActiveTab, label: 'Ask UniBot', icon: MessageSquare, badge: 'Grounded' },
    { id: 'what-did-i-miss' as ActiveTab, label: 'What Did I Miss', icon: Sparkles, highlight: true },
    { id: 'meetings' as ActiveTab, label: 'Meeting Memory', icon: CalendarDays },
    {
      id: 'actions' as ActiveTab,
      label: 'My Actions',
      icon: CheckSquare,
      badge: pendingActionsCount > 0 ? `${pendingActionsCount}` : undefined,
    },
    { id: 'sources' as ActiveTab, label: 'Approved Sources', icon: BookOpen },
    { id: 'recaps' as ActiveTab, label: 'Daily & Weekly Recaps', icon: Newspaper },
    { id: 'reminders' as ActiveTab, label: 'Event Reminders', icon: Bell },
    { id: 'whatsapp-sim' as ActiveTab, label: 'WhatsApp Simulator', icon: Smartphone },
    { id: 'profile' as ActiveTab, label: 'Participant Profile', icon: User },
  ];

  const adminNav = [
    { id: 'admin-overview' as ActiveTab, label: 'Command Overview', icon: LayoutDashboard },
    {
      id: 'admin-confusion' as ActiveTab,
      label: 'Confusion Detector',
      icon: AlertTriangle,
      badge: openConfusionCount > 0 ? `${openConfusionCount} High` : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    { id: 'admin-questions' as ActiveTab, label: 'Recurring Questions', icon: HelpCircle },
    { id: 'admin-clarity' as ActiveTab, label: 'Clarity Checker', icon: FileCheck2 },
    {
      id: 'admin-handover' as ActiveTab,
      label: 'Human Handover',
      icon: Inbox,
      badge: openHandoverCount > 0 ? `${openHandoverCount}` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    { id: 'admin-sources' as ActiveTab, label: 'Sources Management', icon: BookOpen },
    { id: 'admin-meetings' as ActiveTab, label: 'Meeting Management', icon: CalendarDays },
  ];

  return (
    <aside
      id="app-sidebar"
      className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white/80 backdrop-blur-xs min-h-[calc(100vh-61px)] p-4 flex-shrink-0"
    >
      {/* Role Banner inside sidebar */}
      <div className="mb-4 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {isAdminMode ? 'Admin Workspace' : 'Participant Workspace'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isAdminMode ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}
          />
        </div>
        <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">
          {isAdminMode ? 'UniPods Command Center' : 'Awa Diop (AI Track)'}
        </p>
      </div>

      <nav className="space-y-6 flex-1">
        {/* If in Admin Mode, show Admin nav first */}
        {isAdminMode ? (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Admin Command Tools
            </div>
            <div className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-emerald-400' : 'text-slate-700'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : item.badgeColor || 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Participant Navigation
            </div>
            <div className="space-y-1">
              {participantNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-900 text-white font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-emerald-400' : 'text-slate-700'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Cross-Workspace Access */}
        <div className="pt-4 border-t border-slate-100">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
            {isAdminMode ? 'Participant View' : 'Admin Operations'}
          </div>
          <button
            onClick={() =>
              onSelectTab(isAdminMode ? 'dashboard' : 'admin-overview')
            }
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Layers className="w-4 h-4 text-slate-700" />
            <span>
              {isAdminMode ? 'Switch to Participant App' : 'Open Admin Command'}
            </span>
          </button>
        </div>
      </nav>

      {/* Footer provenance */}
      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-700 px-3">
        <p className="font-semibold text-slate-700">METI UniPods AI Innovation</p>
        <p className="text-[10px]">Wadhwani Foundation & MIT</p>
      </div>
    </aside>
  );
};
