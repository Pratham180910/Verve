import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCircle2, Clock, Info, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { activityAPI, leadAPI, memberDashboardAPI } from '../services/api';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bellContainerRef = useRef(null);

  const storageKey = user?.id ? `verve_last_read_activity_${user.id}` : 'verve_last_read_activity';

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userRole = (user.role || '').toLowerCase();
      let res;

      if (userRole === 'admin') {
        res = await activityAPI.getActivities({ limit: 15 });
      } else if (userRole === 'project_lead' || userRole === 'lead') {
        res = await leadAPI.getActivities({ days: '30' });
      } else {
        res = await memberDashboardAPI.getActivities({ days: '30' });
      }

      const list = res?.activities || res?.data?.activities || [];
      setNotifications(list);

      // Check unread against localStorage
      const lastRead = localStorage.getItem(storageKey);
      if (list.length > 0) {
        if (!lastRead) {
          setHasUnread(true);
        } else {
          const latestItemTime = new Date(list[0].created_at).getTime();
          const lastReadTime = new Date(lastRead).getTime();
          setHasUnread(latestItemTime > lastReadTime);
        }
      } else {
        setHasUnread(false);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, storageKey]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = () => {
    if (notifications.length > 0) {
      localStorage.setItem(storageKey, new Date().toISOString());
    }
    setHasUnread(false);
  };

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      markAllAsRead();
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={bellContainerRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors relative focus:outline-none"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <>
          {/* Backdrop for click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Card */}
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
            {/* Header */}
            <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Mark as read
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100/80">
              {loading && notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">No new notifications</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">You're completely up to date.</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const userName = item.user?.name || 'System';
                  return (
                    <div
                      key={item.id}
                      className="px-4 py-3 hover:bg-slate-50/80 transition-colors flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-800 leading-snug break-words">
                          <span className="font-semibold text-slate-900">{userName}</span>{' '}
                          {item.description || item.action}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
