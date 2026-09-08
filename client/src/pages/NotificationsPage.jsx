import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/formatters';
import {
  Bell,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('All');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Notification Preferences state
  const [preferences, setPreferences] = useState({
    certExpiry: true,
    workloadBurnout: true,
    aiRecommendations: true,
    systemSync: false
  });

  const categories = ['All', 'urgent', 'assignment', 'approval', 'system'];

  const filtered = notifications.filter((notif) => {
    if (activeCategory !== 'All' && notif.type !== activeCategory) return false;
    if (showUnreadOnly && notif.read) return false;
    return true;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Critical</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Urgent</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">Standard</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>District Communications</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Notifications Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Operational Alerts & Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time feed for teacher schedule overrides, certification renewals, AI forecast notices, and SIS reconciliation.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-sky-600" />
            <span>Mark All {unreadCount} as Read</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Notifications Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    activeCategory === cat
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
              />
              <span>Unread alerts only</span>
            </label>
          </div>

          {/* Notifications List */}
          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                No notifications match your current filter criteria.
              </div>
            ) : (
              filtered.map((notif) => {
                const id = notif.id || notif._id;
                return (
                  <div
                    key={id}
                    className={`bg-white p-4 rounded-xl border transition-all ${
                      notif.read ? 'border-slate-200 opacity-80' : 'border-sky-300 shadow-xs ring-1 ring-sky-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {notif.severity === 'critical' ? (
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          ) : notif.severity === 'high' ? (
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                          ) : (
                            <Info className="w-5 h-5 text-sky-500 shrink-0" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {getSeverityBadge(notif.severity)}
                            <h3 className="text-xs font-bold text-slate-900">{notif.title}</h3>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{notif.message}</p>
                          <div className="text-[10px] text-slate-400 mt-2">
                            Dispatched: {formatDateTime(notif.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {notif.linkUrl && (
                          <button
                            onClick={() => {
                              markAsRead(id);
                              navigate(notif.linkUrl);
                            }}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            title="Mark as Read"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Role Notification Preferences Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-sky-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Notification Delivery Preferences
              </h2>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Configure which operational event categories generate urgent in-app banners and manager alert dispatches.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <label className="flex items-start justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-800">State Credential Expiry Alerts</div>
                  <div className="text-[10px] text-slate-500">Alerts for teaching licenses expiring in &lt;60 days</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.certExpiry}
                  onChange={(e) => setPreferences({ ...preferences, certExpiry: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500 mt-0.5"
                />
              </label>

              <label className="flex items-start justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-800">Teacher Overload (&gt;100%) Warnings</div>
                  <div className="text-[10px] text-slate-500">Trigger warnings when weekly timetable exceeds 40 hrs</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.workloadBurnout}
                  onChange={(e) => setPreferences({ ...preferences, workloadBurnout: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500 mt-0.5"
                />
              </label>

              <label className="flex items-start justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-800">AI Recommendation Runs</div>
                  <div className="text-[10px] text-slate-500">Notify when candidate ranking completes</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.aiRecommendations}
                  onChange={(e) => setPreferences({ ...preferences, aiRecommendations: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500 mt-0.5"
                />
              </label>

              <label className="flex items-start justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-800">SIS Data Reconciliation Logs</div>
                  <div className="text-[10px] text-slate-500">Nightly PowerSchool attendance & enrolment sync</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.systemSync}
                  onChange={(e) => setPreferences({ ...preferences, systemSync: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500 mt-0.5"
                />
              </label>
            </div>

            <button
              onClick={() => alert('Notification delivery preferences updated successfully.')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
