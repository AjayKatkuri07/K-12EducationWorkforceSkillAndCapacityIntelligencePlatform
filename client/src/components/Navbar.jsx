import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ROLE_CONFIG } from '../utils/formatters';
import { Bell, GraduationCap, ShieldCheck, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, role, switchRole, logout } = useAuth();
  const { unreadCount, togglePanel } = useNotifications();

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole && newRole !== role) {
      await switchRole(newRole);
    }
  };

  const roleMeta = ROLE_CONFIG[role] || { label: role, badgeClass: 'bg-slate-100 text-slate-800' };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-xs">
      {/* Left: Brand & Mobile toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          title="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">EduStaff IQ</span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                K-12 District Platform
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 font-medium">Oakridge Public Schools Academic Network</p>
          </div>
        </div>
      </div>

      {/* Right: Quick Role Switcher, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Switcher Pill */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden md:inline">Simulate Role:</span>
          </span>
          <select
            value={role || 'Employee'}
            onChange={handleRoleChange}
            className="bg-transparent text-xs font-semibold text-slate-800 border-none focus:ring-0 cursor-pointer pr-5 py-0"
          >
            <option value="Employee">Employee (Teacher/Counsellor)</option>
            <option value="TeamLead">Team Lead (Dept Head)</option>
            <option value="WorkforcePlanner">Workforce Planner (Scheduling)</option>
            <option value="HRAdmin">HR Admin (Full Governance)</option>
          </select>
        </div>

        {/* Notifications Button */}
        <button
          onClick={togglePanel}
          className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Open Notifications Panel"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Card & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt={user?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">{user?.name}</div>
            <div className="text-[10px] text-slate-500 truncate max-w-[130px]">{roleMeta.label}</div>
          </div>
          <button
            onClick={logout}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
            title="Sign Out"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
