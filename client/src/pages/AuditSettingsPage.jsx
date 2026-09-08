import React, { useState, useEffect } from 'react';
import { auditAPI, seedAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RoleGate from '../components/RoleGate';
import { formatDateTime } from '../utils/formatters';
import {
  ShieldAlert,
  Sliders,
  Search,
  Filter,
  Lock,
  Cpu,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AuditSettingsPage() {
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'settings'

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');

  // System Settings State
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadAuditLogs();
    loadSystemConfig();
  }, [selectedAction, selectedRole]);

  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await auditAPI.getLogs({
        action: selectedAction,
        actorRole: selectedRole,
        search
      });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('[AuditSettings] Error loading logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadSystemConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await auditAPI.getConfig();
      if (res.data.success) {
        setConfig(res.data.data);
      }
    } catch (err) {
      console.error('[AuditSettings] Error loading config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const res = await auditAPI.updateConfig(config);
      if (res.data.success) {
        setConfig(res.data.data);
        setFeedback('System configuration updated and recorded to immutable audit log.');
        loadAuditLogs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset database to pristine initial K-12 sample dataset? Any live edits will be restored to clean state.')) {
      return;
    }

    try {
      setResettingData(true);
      await seedAPI.resetDatabase();
      setFeedback('Database successfully re-seeded with pristine district sample dataset.');
      loadAuditLogs();
      loadSystemConfig();
    } catch (err) {
      alert('Failed to reset database: ' + err.message);
    } finally {
      setResettingData(false);
    }
  };

  return (
    <RoleGate allowedRoles={['HRAdmin', 'WorkforcePlanner']}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>District Governance</span>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Audit & Settings</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Immutable Audit Trail & Platform Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Append-only audit logs for all security, override, and allocation events, plus AI threshold configurations.
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Audit Logs ({logs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Platform Settings</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tab 1: Immutable Audit Trail */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search logs by actor, event ID, action, or keyword..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={loadAuditLogs}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Filter
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-900 font-semibold"
                >
                  <option value="All">All Event Types</option>
                  <option value="AUTH_LOGIN">AUTH_LOGIN</option>
                  <option value="ASSIGNMENT_APPROVED">ASSIGNMENT_APPROVED</option>
                  <option value="ASSIGNMENT_OVERRIDDEN">ASSIGNMENT_OVERRIDDEN</option>
                  <option value="AI_SKILL_INFERENCE">AI_SKILL_INFERENCE</option>
                  <option value="CAPACITY_FORECAST_GENERATED">CAPACITY_FORECAST</option>
                  <option value="SYSTEM_SETTINGS_UPDATE">SYSTEM_SETTINGS_UPDATE</option>
                </select>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-900 font-semibold"
                >
                  <option value="All">All Roles</option>
                  <option value="HRAdmin">HR Admin</option>
                  <option value="WorkforcePlanner">Workforce Planner</option>
                  <option value="TeamLead">Team Lead</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </div>

            {/* Compliance Guarantee Alert */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-400" />
                <span>
                  <strong>Immutable Append-Only Log Store Active:</strong> Non-administrative users are prohibited from modifying or purging audit events.
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Retention: 7 Years</span>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Event ID & Time</th>
                      <th className="py-3 px-4">Actor & Role</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Details & Notes</th>
                      <th className="py-3 px-4 text-right">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-400">Loading audit records...</td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-400">No audit events match the query.</td>
                      </tr>
                    ) : (
                      logs.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-800 text-[11px]">{l.eventId}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(l.timestamp)}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{l.actorName}</div>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-700">
                              {l.actorRole}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                              {l.action}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {l.entityType} <span className="text-[10px] text-slate-400 block font-mono">{l.entityId}</span>
                          </td>

                          <td className="py-3 px-4 text-slate-600 max-w-sm">
                            <div className="text-[11px] leading-relaxed">{l.notes || 'Routine operation executed'}</div>
                            {l.newState && typeof l.newState === 'object' && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                State: {JSON.stringify(l.newState).slice(0, 50)}...
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                            {l.ipAddress || '127.0.0.1'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: System Master Settings & Integrations */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Master Settings Form (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">District Master & AI Model Configuration</h2>
                <p className="text-xs text-slate-500">Configure institutional governance standards and algorithmic thresholds</p>
              </div>

              {config && (
                <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">School Group Network Name</label>
                    <input
                      type="text"
                      value={config.schoolGroupName || ''}
                      onChange={(e) => setConfig({ ...config, schoolGroupName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                      <input
                        type="text"
                        value={config.academicYear || '2026-2027'}
                        onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Generative AI Model</label>
                      <select
                        value={config.aiModel || 'gemini-1.5-flash'}
                        onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                      >
                        <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Production Standard)</option>
                        <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                      <span>AI Recommendation Confidence Threshold:</span>
                      <span className="font-bold text-sky-700">{config.aiConfidenceThreshold || 75}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={config.aiConfidenceThreshold || 75}
                      onChange={(e) => setConfig({ ...config, aiConfidenceThreshold: Number(e.target.value) })}
                      className="w-full accent-sky-600"
                    />
                    <span className="text-[10px] text-slate-400">Recommendations below this score will trigger low-confidence alerts.</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fairness Strictness Standard</label>
                    <select
                      value={config.fairnessStrictnessLevel || 'High'}
                      onChange={(e) => setConfig({ ...config, fairnessStrictnessLevel: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    >
                      <option value="High">High (Strict exclusion of protected attributes & mandatory human override reason)</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
                    >
                      {savingConfig ? 'Saving Settings...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Integrations & Database Reset (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* External Systems Health */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Server className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Controlled SIS & HR Integrations
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">PowerSchool SIS</div>
                      <div className="text-[10px] text-slate-500">Student Enrolment & Attendance</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Healthy
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Frontline Education HR</div>
                      <div className="text-[10px] text-slate-500">Faculty Absence & Timetable Data</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Healthy
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Canvas LMS</div>
                      <div className="text-[10px] text-slate-500">Formative Progress & Grading Analytics</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Healthy
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Seeder / Reset Action */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Evaluation Data Seeder
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Reset the platform datastore back to the pristine K-12 sample dataset (Oakridge schools, educators, certifications, and classes) at any time for repeatable testing.
                </p>

                <button
                  onClick={handleResetDatabase}
                  disabled={resettingData}
                  className="w-full py-2 px-3 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resettingData ? 'animate-spin' : ''}`} />
                  <span>{resettingData ? 'Resetting Store...' : 'Reset to Sample Data'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
