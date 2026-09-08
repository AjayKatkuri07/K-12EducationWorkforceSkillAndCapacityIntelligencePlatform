import React, { useState, useEffect } from 'react';
import { workersAPI, assignmentsAPI } from '../services/api';
import { formatDate } from '../utils/formatters';
import {
  Grid,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
  X
} from 'lucide-react';

export default function SkillMatrixPage() {
  const [workers, setWorkers] = useState([]);
  const [taxonomy, setTaxonomy] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'staffing' | 'certs'

  // Cell drill-down modal
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [wRes, tRes, aRes] = await Promise.all([
          workersAPI.getWorkers(),
          workersAPI.getSkillTaxonomy(),
          assignmentsAPI.getAssignments()
        ]);
        if (wRes.data.success) setWorkers(wRes.data.data);
        if (tRes.data.success) setTaxonomy(tRes.data.data);
        if (aRes.data.success) setAssignments(aRes.data.data);
      } catch (err) {
        console.error('[SkillMatrix] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute certification alerts
  const certAlerts = [];
  workers.forEach((w) => {
    (w.certifications || []).forEach((c) => {
      const expDate = new Date(c.expiryDate);
      const daysUntil = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 60) {
        certAlerts.push({
          workerName: w.fullName,
          workerCampus: w.campus,
          certName: c.name,
          issuer: c.issuer,
          code: c.code,
          expiryDate: c.expiryDate,
          daysUntil,
          status: daysUntil <= 0 ? 'expired' : daysUntil <= 30 ? 'critical' : 'warning'
        });
      }
    });
  });

  const getCellColor = (proficiency) => {
    if (!proficiency) return 'bg-slate-50 text-slate-300 border-slate-100';
    switch (proficiency) {
      case 5:
        return 'bg-sky-600 text-white font-bold border-sky-700 shadow-2xs';
      case 4:
        return 'bg-sky-500 text-white font-semibold border-sky-600';
      case 3:
        return 'bg-sky-100 text-sky-800 font-medium border-sky-200';
      case 2:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const openCellDetails = (worker, skillName) => {
    const skillObj = worker.skills?.find(s => s.name.toLowerCase() === skillName.toLowerCase());
    setSelectedCell({
      worker,
      skillName,
      skill: skillObj || null
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>District Faculty & Staff</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Skill Matrix & Allocation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Skill Matrix, Staffing Board & Certification Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Governed 2D competency grid, timetable allocations, and compliance expiration radars.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Skill Matrix Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab('staffing')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'staffing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Staffing Board</span>
          </button>
          <button
            onClick={() => setActiveTab('certs')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'certs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Cert Expiries ({certAlerts.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: 2D Skill Matrix Grid */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">District Competency Heatmap</h2>
              <p className="text-xs text-slate-500">Click any cell to drill down into supporting credential evidence and assessment records.</p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold">Proficiency:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white">L5 Expert</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500 text-white">L4 Master</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">L3 Proficient</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400">Not Assessed</span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading Skill Matrix...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50/90 z-10 w-56">
                      Staff Member
                    </th>
                    {taxonomy.map((skill) => (
                      <th
                        key={skill.id}
                        className="py-3 px-2 text-center text-[10px] font-bold text-slate-700 uppercase tracking-tight min-w-[110px]"
                        title={skill.description}
                      >
                        <div className="truncate max-w-[120px] mx-auto">{skill.name}</div>
                        <span className="text-[9px] text-slate-400 font-normal block">{skill.category}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.map((worker) => {
                    const id = worker.id || worker._id;
                    return (
                      <tr key={id} className="hover:bg-slate-50/50">
                        {/* Staff Column */}
                        <td className="py-3 px-4 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-100">
                          <div className="font-bold text-slate-900">{worker.fullName}</div>
                          <div className="text-[10px] text-slate-500">{worker.roleTitle}</div>
                        </td>

                        {/* Skill Cells */}
                        {taxonomy.map((tax) => {
                          const userSkill = worker.skills?.find(
                            (s) => s.name.toLowerCase() === tax.name.toLowerCase()
                          );
                          const prof = userSkill?.proficiency || 0;

                          return (
                            <td key={tax.id} className="py-2 px-2 text-center">
                              <button
                                onClick={() => openCellDetails(worker, tax.name)}
                                className={`w-14 py-1.5 rounded-lg text-xs border mx-auto transition-transform hover:scale-105 flex items-center justify-center gap-1 ${getCellColor(
                                  prof
                                )}`}
                                title={`Click to view evidence: ${worker.fullName} - ${tax.name}`}
                              >
                                {prof > 0 ? (
                                  <>
                                    <span>L{prof}</span>
                                    {userSkill?.verified && (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Staffing Board (Allocated vs Open Openings) */}
      {activeTab === 'staffing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Approved & Operating */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Allocated & Approved</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {assignments.filter(a => a.status === 'approved').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {assignments.filter(a => a.status === 'approved').map(asg => (
                <div key={asg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-900">{asg.title}</div>
                  <div className="text-[11px] text-slate-500">{asg.campus} • {asg.gradeLevel}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-600 font-semibold">{asg.assignedWorkerName}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {asg.weeklyHours}h/wk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Pending Review & Candidate Matching */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pending Candidate Review</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                {assignments.filter(a => a.status === 'pending_approval' || a.status === 'draft').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {assignments.filter(a => a.status === 'pending_approval' || a.status === 'draft').map(asg => (
                <div key={asg.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-900">{asg.title}</div>
                  <div className="text-[11px] text-slate-500">{asg.campus} • {asg.weeklyHours}h/wk needed</div>
                  <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                    <span className="text-amber-800 font-medium">Candidate Match Active</span>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                      {asg.matchScore}% Fit Score
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Critical Unfilled Capacity Gaps */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Unfilled Deficits (Urgent)</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                3 Needed
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900">Special Education Caseload Specialist</div>
                <div className="text-[11px] text-slate-500">Oakridge High Campus • 2.5 FTE Deficit</div>
                <p className="text-[10px] text-rose-700 leading-relaxed">
                  Required: State Special Ed K-12 Credential & IEP Compliance Mastery.
                </p>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900">AP Calculus BC & Advanced Physics</div>
                <div className="text-[11px] text-slate-500">Oakridge High Campus • 2.0 FTE Deficit</div>
                <p className="text-[10px] text-rose-700 leading-relaxed">
                  David Chen currently overloaded; secondary instructor posting authorized.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Certification Expiry Radar */}
      {activeTab === 'certs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">State Credential Expiry Radar</h2>
              <p className="text-xs text-slate-500">
                Proactive compliance monitoring flagging teaching licenses and endorsements expiring within 60 days.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              {certAlerts.length} Licenses Requiring Renewal
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Educator</th>
                  <th className="py-3 px-4">Campus</th>
                  <th className="py-3 px-4">Credential Name</th>
                  <th className="py-3 px-4">Issuing Authority</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certAlerts.map((alert, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{alert.workerName}</td>
                    <td className="py-3 px-4 text-slate-600">{alert.workerCampus}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div>{alert.certName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{alert.code}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{alert.issuer}</td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{formatDate(alert.expiryDate)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          alert.status === 'expired'
                            ? 'bg-rose-100 text-rose-800'
                            : alert.status === 'critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>
                          {alert.status === 'expired'
                            ? 'Expired'
                            : alert.daysUntil < 0
                            ? 'Expired'
                            : `${alert.daysUntil} days remaining`}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Dispatched credential renewal notice to ${alert.workerName}.`)}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-2xs"
                      >
                        Notify Educator
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drill-down Modal for Skill Evidence */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCell.skillName}</h3>
                <p className="text-xs text-slate-500">Evaluated competency for {selectedCell.worker.fullName}</p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedCell.skill ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between">
                  <span className="font-bold text-sky-900">Verified Proficiency</span>
                  <span className="text-sm font-extrabold text-sky-700">Level {selectedCell.skill.proficiency} / 5</span>
                </div>

                <div>
                  <div className="font-semibold text-slate-700 mb-1">Citing Evidence & Work Artifact:</div>
                  <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed italic">
                    "{selectedCell.skill.evidence || 'Demonstrated through classroom observations and district tenured reviews.'}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-2 border-t border-slate-100">
                  <span>Category: {selectedCell.skill.category}</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Department Verified
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No formal competency evaluation logged for {selectedCell.worker.fullName} in this skill yet.
              </div>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
