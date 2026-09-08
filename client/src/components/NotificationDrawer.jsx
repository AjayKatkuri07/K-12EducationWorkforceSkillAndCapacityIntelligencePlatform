import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/formatters';
import { X, CheckCheck, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';

export default function NotificationDrawer() {
  const { notifications, unreadCount, panelOpen, closePanel, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  if (!panelOpen) return null;

  const handleNavigate = (linkUrl, notifId) => {
    markAsRead(notifId);
    closePanel();
    if (linkUrl) {
      navigate(linkUrl);
    }
  };

  const getSeverityIcon = (sev) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={closePanel} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">District Alerts & Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Live operational events, approvals, and credential warnings</p>
            </div>
            <button onClick={closePanel} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs bg-white">
            <span className="text-slate-500 font-medium">{notifications.length} Total Alerts</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active notifications at this time.
              </div>
            ) : (
              notifications.map((notif) => {
                const id = notif.id || notif._id;
                return (
                  <div
                    key={id}
                    className={`p-3 rounded-lg transition-colors ${
                      notif.read ? 'bg-white hover:bg-slate-50' : 'bg-sky-50/50 hover:bg-sky-50 border-l-3 border-sky-600'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{getSeverityIcon(notif.severity)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-xs font-semibold ${notif.read ? 'text-slate-800' : 'text-slate-900'}`}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatDateTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{notif.message}</p>

                        <div className="flex items-center justify-between pt-1">
                          {notif.linkUrl && (
                            <button
                              onClick={() => handleNavigate(notif.linkUrl, id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700"
                            >
                              <span>View Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(id)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-medium ml-auto"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer link to full notification page */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
            <button
              onClick={() => {
                closePanel();
                navigate('/notifications');
              }}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Open Full Notifications & Preferences Center →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
