import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { ROLE_CONFIG } from '../utils/formatters';

export default function RoleGate({ allowedRoles = [], children }) {
  const { role, switchRole } = useAuth();

  if (!allowedRoles.includes(role || 'Employee')) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-card text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted by Role Governance</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your current active role is <span className="font-semibold text-slate-900">{ROLE_CONFIG[role]?.label || role}</span>.
          This operational page requires one of the following permissions:
          <span className="font-medium text-sky-700 ml-1">[{allowedRoles.join(', ')}]</span>.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block text-left mb-6 max-w-md w-full">
          <div className="text-xs font-semibold text-slate-700 mb-2">Demo / Evaluation Role Switcher:</div>
          <div className="grid grid-cols-2 gap-2">
            {allowedRoles.map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 flex items-center justify-between transition-colors shadow-2xs"
              >
                <span>Switch to {r}</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
