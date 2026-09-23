/**
 * Notifications Popover Component (Phase 3.3)
 * Displays real user notifications loaded and persisted in Supabase.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Clock, AlertCircle, Calendar, Sparkles, X } from 'lucide-react';
import { AppNotification } from '../../types';
import { defaultKnowledgeRepository } from '../../services/knowledgeRepository';

interface NotificationsPopoverProps {
  userId?: string;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const items = await defaultKnowledgeRepository.getNotifications(userId);
      setNotifications(items);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await defaultKnowledgeRepository.updateNotificationStatus(id, true);
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(unread.map((n) => defaultKnowledgeRepository.updateNotificationStatus(n.id, true)));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        id="btn-notifications-toggle"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        aria-label="Notifications"
        className="relative p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            id="badge-unread-notifications"
            className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full ring-2 ring-white"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="popover-notifications"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  id="btn-mark-all-read"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-700 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-700">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-700">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                  className={`p-3.5 text-xs transition-colors flex items-start gap-3 cursor-pointer ${
                    n.read ? 'bg-white hover:bg-slate-50 opacity-80' : 'bg-blue-50/40 hover:bg-blue-50'
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                      n.type === 'meeting'
                        ? 'bg-blue-100 text-blue-700'
                        : n.type === 'action'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {n.type === 'meeting' ? (
                      <Calendar className="w-4 h-4" />
                    ) : n.type === 'action' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`font-semibold truncate ${n.read ? 'text-slate-700' : 'text-slate-900 font-bold'}`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-700 leading-snug line-clamp-2">
                      {n.message}
                    </p>
                    {n.scheduledFor && (
                      <span className="text-[10px] text-slate-700 mt-1 block">
                        Scheduled: {n.scheduledFor}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
