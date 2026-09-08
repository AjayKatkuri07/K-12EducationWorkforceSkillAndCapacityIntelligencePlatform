import React, { useState, useEffect } from 'react';
import { assignmentsAPI, workersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, RISK_CONFIG } from '../utils/formatters';
import {
  GitCompare,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  ChevronDown,
  Info,
  X,
  History
} from 'lucide-react';

export default function AssignmentComparisonPage() {
  const { role, user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  // Override modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideCandidateId, setOverrideCandidateId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentsAPI.getAssignments();
      if (res.data.success) {
        setAssignments(res.data.data);
        if (res.data.data.length > 0) {
          const defaultAsg = res.data.data.find(a => a.id === 'asg-alg-int-202') || res.data.data[0];
          setSelectedAssignmentId(defaultAsg.id);
          setActiveAssignment(defaultAsg);
        }
      }
    } catch (err) {
      console.error('[AssignmentComparison] Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssignment = async (id) => {
    setSelectedAssignmentId(id);
    const asg = assignments.find(a => a.id === id);
    setActiveAssignment(asg);
    setDecisionFeedback('');
  };

  const handleRunAIMatch = async () => {
    if (!activeAssignment) return;
    try {
      setMatching(true);
      setDecisionFeedback('');
      const res = await assignmentsAPI.compareCandidates(activeAssignment.id || activeAssignment._id);
      if (res.data.success) {
        setActiveAssignment(res.data.assignment);
        setAssignments(prev => prev.map(a => a.id === res.data.assignment.id ? res.data.assignment : a));
        setDecisionFeedback('AI Candidate Match calculation complete. Candidates ranked by skill alignment and capacity.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to calculate candidate match.');
    } finally {
      setMatching(false);
    }
  };

  const handleDirectAssign = async (workerId) => {
    if (!activeAssignment) return;
    try {
      setSubmittingDecision(true);
      const res = await assignmentsAPI.assignWorker(activeAssignment.id || activeAssignment._id, workerId);
      if (res.data.success) {
        setActiveAssignment(res.data.data);
        setAssignments(prev => prev.map(a => a.id === res.data.data.id ? res.data.data : a));
        setDecisionFeedback(`Successfully assigned candidate and approved timetable allocation.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideCandidateId || !overrideReason) return;
    try {
      setSubmittingDecision(true);
      const res = await assignmentsAPI.overrideAssignment(activeAssignment.id || activeAssignment._id, {
        workerId: overrideCandidateId,
        reason: overrideReason
      });
      if (res.data.success) {
        setActiveAssignment(res.data.data);
        setAssignments(prev => prev.map(a => a.id === res.data.data.id ? res.data.data : a));
        setShowOverrideModal(false);
        setOverrideReason('');
        setDecisionFeedback(`Manager override documented and logged to immutable audit trail.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Override failed.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>District Operations</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Assignment Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Assignment Candidate Comparison & Manager Approval
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Side-by-side teacher fit comparison, schedule conflict detection, burnout checks, and authorized overrides.
          </p>
        </div>

        {/* Assignment Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Course / Intervention:</label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => handleSelectAssignment(e.target.value)}
            className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none shadow-2xs max-w-xs truncate"
          >
            {assignments.map(asg => (
              <option key={asg.id} value={asg.id}>
                {asg.title} ({asg.campus})
              </option>
            ))}
          </select>
        </div>
      </div>

      {decisionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{decisionFeedback}</span>
        </div>
      )}

      {/* Active Assignment Profile Banner */}
      {activeAssignment && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                  {activeAssignment.type}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {activeAssignment.campus} • {activeAssignment.gradeLevel}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    activeAssignment.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeAssignment.status === 'overridden'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Status: {activeAssignment.status.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{activeAssignment.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                <span>Weekly Commitment: <strong className="text-slate-900">{activeAssignment.weeklyHours} hrs/wk</strong></span>
                <span>Enrolled Students: <strong className="text-slate-900">{activeAssignment.studentCount}</strong></span>
                <span>Current Assignee: <strong className="text-slate-900">{activeAssignment.assignedWorkerName || 'Unassigned'}</strong></span>
              </div>
            </div>

            <button
              onClick={handleRunAIMatch}
              disabled={matching}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>{matching ? 'Analyzing Faculty Data...' : 'Refresh AI Candidate Analysis'}</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Prerequisite Skills:</span>
            {activeAssignment.requiredSkills?.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Comparison Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-sky-600" />
            <span>Candidate Evaluation & Suitability Matrix</span>
          </h2>
          <span className="text-xs text-slate-500">
            {activeAssignment?.candidateComparison?.length || 0} Evaluated Options
          </span>
        </div>

        {activeAssignment?.candidateComparison?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAssignment.candidateComparison.map((cand, idx) => {
              const isTopRanked = cand.recommendationRank === 1;
              const isAssigned = activeAssignment.assignedWorkerId === cand.workerId;

              return (
                <div
                  key={cand.workerId || idx}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all space-y-4 relative ${
                    isTopRanked ? 'border-sky-300 ring-1 ring-sky-200 bg-sky-50/20' : 'border-slate-200'
                  }`}
                >
                  {/* Top Rank Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-700">
                        #{cand.recommendationRank || idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{cand.workerName}</h3>
                        <p className="text-[11px] text-slate-500">{cand.roleTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isTopRanked && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-sky-600" /> AI Recommendation
                        </span>
                      )}
                      <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-xs">
                        {cand.matchScore || cand.compositeScore}% Fit
                      </div>
                    </div>
                  </div>

                  {/* Metrics Comparison Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Skill Suitability</div>
                      <div className="font-bold text-slate-800 mt-0.5">{cand.skillFit || 'High Match'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Capacity Impact</div>
                      <div className="font-bold text-slate-800 mt-0.5">{cand.capacityFit || 'Available'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Burnout Risk Signal</div>
                      <div className="font-bold text-slate-800 mt-0.5">{cand.burnoutImpact || cand.burnoutRisk || 'Low'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Timetable Conflicts</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {cand.scheduleConflicts > 0 ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {cand.scheduleConflicts} Conflict(s)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> None (Clear)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    {isAssigned ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Currently Assigned</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => handleDirectAssign(cand.workerId)}
                          disabled={submittingDecision}
                          className="flex-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
                        >
                          Approve Candidate
                        </button>

                        <button
                          onClick={() => {
                            setOverrideCandidateId(cand.workerId);
                            setShowOverrideModal(true);
                          }}
                          disabled={submittingDecision}
                          className="py-2 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition-colors"
                        >
                          Override Justification...
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            No candidate comparison generated yet for this assignment. Click "Refresh AI Candidate Analysis" above to generate scored candidate rankings.
          </div>
        )}
      </div>

      {/* Historical Material Decisions & Audit Trail */}
      {activeAssignment?.overrideDetails?.overridden && (
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Documented Administrative Override Record</span>
          </div>
          <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-700">
              <span><strong>Authorizing Manager:</strong> {activeAssignment.overrideDetails.actor} ({activeAssignment.overrideDetails.actorRole})</span>
              <span className="text-[11px] text-slate-500">{formatDateTime(activeAssignment.overrideDetails.timestamp)}</span>
            </div>
            <div>
              <span className="text-slate-500">Mandatory Justification Rationale:</span>
              <p className="font-medium text-slate-900 mt-0.5 italic">
                "{activeAssignment.overrideDetails.reason}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manager Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Document Manager Override</h3>
                <p className="text-xs text-slate-500">Formalize an administrative exception for candidate allocation.</p>
              </div>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Compliance Notice</span>
                </div>
                In accordance with state education governance standards, assigning a candidate counter to algorithmic recommendations requires a documented, audited justification.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandatory Business / Pedagogical Justification</label>
                <textarea
                  required
                  rows={4}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State specific pedagogical reason, departmental restructuring need, or direct student relationship factor justifying this assignment override..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision || !overrideReason}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm disabled:opacity-50"
                >
                  {submittingDecision ? 'Recording Override...' : 'Submit & Audit Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
