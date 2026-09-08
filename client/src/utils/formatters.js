export const ROLE_CONFIG = {
  HRAdmin: {
    label: 'HR Administrator',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'District Governance, RBAC, System Settings, Full Audit Access'
  },
  WorkforcePlanner: {
    label: 'Workforce Planner',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Academic Scheduling, Capacity Forecasting, Assignment Modeling'
  },
  TeamLead: {
    label: 'Team Lead / Dept Head',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Departmental Review, Candidate Approvals, Teacher Support'
  },
  Employee: {
    label: 'Educator / Staff',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Personal Timetable, Assigned Classes, PD & Skill Profile'
  }
};

export const RISK_CONFIG = {
  Critical: {
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    dot: 'bg-rose-500'
  },
  'Critical Deficit': {
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    dot: 'bg-rose-500'
  },
  High: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500'
  },
  'Moderate Deficit': {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500'
  },
  Moderate: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-500'
  },
  Low: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  'Safe / Balanced': {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  Balanced: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500'
  }
};

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getUtilizationColor(util) {
  if (util >= 105) return 'text-rose-600 bg-rose-50 border-rose-200';
  if (util >= 95) return 'text-amber-600 bg-amber-50 border-amber-200';
  if (util < 70) return 'text-blue-600 bg-blue-50 border-blue-200';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200';
}
