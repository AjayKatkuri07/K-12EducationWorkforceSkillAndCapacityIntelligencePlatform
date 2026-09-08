import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Grid,
  GitCompare,
  Cpu,
  Scale,
  TrendingUp,
  FileText,
  Bell,
  UserCheck,
  ShieldAlert,
  GraduationCap,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { role } = useAuth();

  const navSections = [
    {
      title: 'OPERATIONS & CAPACITY',
      items: [
        {
          name: 'Capacity Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          roles: ['Employee', 'TeamLead', 'WorkforcePlanner', 'HRAdmin'],
          badge: 'Live'
        },
        {
          name: 'Worker Profiles',
          path: '/workers',
          icon: Users,
          roles: ['Employee', 'TeamLead', 'WorkforcePlanner', 'HRAdmin']
        },
        {
          name: 'Skill Matrix & Staffing',
          path: '/skill-matrix',
          icon: Grid,
          roles: ['TeamLead', 'WorkforcePlanner', 'HRAdmin']
        },
        {
          name: 'Assignment Comparison',
          path: '/assignment-comparison',
          icon: GitCompare,
          roles: ['TeamLead', 'WorkforcePlanner', 'HRAdmin'],
          badge: 'Match'
        }
      ]
    },
    {
      title: 'AI INTELLIGENCE & GOVERNANCE',
      items: [
        {
          name: 'Skill Intelligence & Forecast',
          path: '/skill-intelligence',
          icon: Cpu,
          roles: ['WorkforcePlanner', 'HRAdmin', 'TeamLead'],
          badge: 'Gemini'
        },
        {
          name: 'Fairness & Evidence Review',
          path: '/fairness-review',
          icon: Scale,
          roles: ['WorkforcePlanner', 'HRAdmin', 'TeamLead'],
          badge: 'Audit'
        },
        {
          name: 'Learning, Mobility & Outcomes',
          path: '/learning-mobility',
          icon: TrendingUp,
          roles: ['Employee', 'TeamLead', 'WorkforcePlanner', 'HRAdmin']
        }
      ]
    },
    {
      title: 'GOVERNANCE & SYSTEM',
      items: [
        {
          name: 'Reports & Analytics',
          path: '/reports',
          icon: FileText,
          roles: ['WorkforcePlanner', 'HRAdmin', 'TeamLead']
        },
        {
          name: 'Notifications Center',
          path: '/notifications',
          icon: Bell,
          roles: ['Employee', 'TeamLead', 'WorkforcePlanner', 'HRAdmin']
        },
        {
          name: 'User & Role Governance',
          path: '/users-roles',
          icon: UserCheck,
          roles: ['HRAdmin']
        },
        {
          name: 'Audit Trail & Settings',
          path: '/audit-settings',
          icon: ShieldAlert,
          roles: ['HRAdmin', 'WorkforcePlanner']
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-sky-400" />
            <span className="font-bold text-white text-base">EduStaff IQ</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* District Meta Header in Sidebar */}
        <div className="p-4 border-b border-slate-800 hidden lg:block">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            District Environment
          </div>
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span className="font-medium">Term 1 (2026-27)</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Sync
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const isAllowed = item.roles.includes(role || 'Employee');
                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-sky-600 text-white shadow-xs'
                            : isAllowed
                            ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-400 opacity-70'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI & Governance Status Footer */}
        <div className="p-3 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-sky-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Decision Support</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Human-in-the-loop enabled. All material staffing allocations require authorized review.
          </p>
        </div>
      </aside>
    </>
  );
}
