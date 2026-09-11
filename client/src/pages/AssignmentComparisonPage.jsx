
import React, { useEffect, useMemo, useState } from 'react';
import { assignmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';
import {
  GitCompare,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Info,
  X,
  History,
  RefreshCw,
  Brain,
  Database,
  Scale,
  Lock,
} from 'lucide-react';

export default function AssignmentComparisonPage() {
  const { role, user } = useAuth();

  // ============================================================
  // ASSIGNMENT STATE
  // ============================================================
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [activeAssignment, setActiveAssignment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  const [pageError, setPageError] = useState('');
  const [decisionFeedback, setDecisionFeedback] = useState('');
  const [decisionType, setDecisionType] = useState('');

  // ============================================================
  // DECISION STATE
  // ============================================================
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Override modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideCandidateId, setOverrideCandidateId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // ============================================================
  // INITIAL LOAD
  // ============================================================
  useEffect(() => {
    loadAssignments();
  }, []);

  // ============================================================
  // LOAD ASSIGNMENTS
  // ============================================================
  const loadAssignments = async () => {
    try {
      setLoading(true);
      setPageError('');

      const res = await assignmentsAPI.getAssignments();

      if (!res?.data?.success) {
        throw new Error(
          res?.data?.message || 'Unable to load assignments.'
        );
      }

      const receivedAssignments = Array.isArray(res.data.data)
        ? res.data.data
        : [];

      setAssignments(receivedAssignments);

      if (receivedAssignments.length > 0) {
        const defaultAssignment =
          receivedAssignments.find(
            (assignment) =>
              assignment.id === 'asg-alg-int-202'
          ) || receivedAssignments[0];

        const defaultId =
          defaultAssignment.id || defaultAssignment._id;

        setSelectedAssignmentId(defaultId);
        setActiveAssignment(defaultAssignment);
      } else {
        setSelectedAssignmentId('');
        setActiveAssignment(null);
      }
    } catch (err) {
      console.error(
        '[AssignmentComparison] Error fetching assignments:',
        err
      );

      setPageError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load assignments.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SELECT ASSIGNMENT
  // ============================================================
  const handleSelectAssignment = (id) => {
    setSelectedAssignmentId(id);

    const assignment = assignments.find(
      (item) => (item.id || item._id) === id
    );

    setActiveAssignment(assignment || null);
    setDecisionFeedback('');
    setDecisionType('');
    setPageError('');
  };

  // ============================================================
  // RUN AI MATCH
  // ============================================================
  const handleRunAIMatch = async () => {
    if (!activeAssignment) return;

    const assignmentId =
      activeAssignment.id || activeAssignment._id;

    try {
      setMatching(true);
      setDecisionFeedback('');
      setDecisionType('');
      setPageError('');

      const res = await assignmentsAPI.compareCandidates(
        assignmentId
      );

      if (!res?.data?.success) {
        throw new Error(
          res?.data?.message ||
            'Failed to calculate candidate match.'
        );
      }

      /*
       * Your backend may return:
       * {
       *   success: true,
       *   assignment: {...}
       * }
       *
       * or:
       * {
       *   success: true,
       *   data: {...}
       * }
       *
       * Support both shapes safely.
       */
      const updatedAssignment =
        res.data.assignment ||
        res.data.data ||
        res.data.result;

      if (!updatedAssignment) {
        throw new Error(
          'Candidate analysis completed but no assignment data was returned.'
        );
      }

      setActiveAssignment(updatedAssignment);

      setAssignments((previous) =>
        previous.map((assignment) =>
          (assignment.id || assignment._id) ===
          (updatedAssignment.id || updatedAssignment._id)
            ? updatedAssignment
            : assignment
        )
      );

      setDecisionFeedback(
        'AI candidate analysis completed. Candidates were evaluated using observable skill alignment, capacity fit, workload impact, and timetable factors.'
      );

      setDecisionType('success');
    } catch (err) {
      console.error(
        '[AssignmentComparison] AI matching failed:',
        err
      );

      setPageError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to calculate candidate match.'
      );

      setDecisionType('error');
    } finally {
      setMatching(false);
    }
  };

  // ============================================================
  // DIRECT ASSIGN / APPROVE
  // ============================================================
  const handleDirectAssign = async (workerId) => {
    if (!activeAssignment || !workerId) return;

    const assignmentId =
      activeAssignment.id || activeAssignment._id;

    try {
      setSubmittingDecision(true);
      setDecisionFeedback('');
      setDecisionType('');
      setPageError('');

      const res = await assignmentsAPI.assignWorker(
        assignmentId,
        workerId
      );

      if (!res?.data?.success) {
        throw new Error(
          res?.data?.message ||
            'Assignment approval failed.'
        );
      }

      const updatedAssignment =
        res.data.data ||
        res.data.assignment ||
        res.data.result;

      if (!updatedAssignment) {
        throw new Error(
          'Assignment was processed but updated assignment data was not returned.'
        );
      }

      setActiveAssignment(updatedAssignment);

      setAssignments((previous) =>
        previous.map((assignment) =>
          (assignment.id || assignment._id) ===
          (updatedAssignment.id || updatedAssignment._id)
            ? updatedAssignment
            : assignment
        )
      );

      setDecisionFeedback(
        'Candidate assignment approved successfully. The approved workforce decision is now separate from the AI recommendation.'
      );

      setDecisionType('success');
    } catch (err) {
      console.error(
        '[AssignmentComparison] Assignment approval failed:',
        err
      );

      setPageError(
        err?.response?.data?.message ||
          err?.message ||
          'Assignment approval failed.'
      );

      setDecisionType('error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // ============================================================
  // OPEN OVERRIDE MODAL
  // ============================================================
  const openOverrideModal = (workerId) => {
    setOverrideCandidateId(workerId);
    setOverrideReason('');
    setPageError('');
    setDecisionFeedback('');
    setDecisionType('');
    setShowOverrideModal(true);
  };

  // ============================================================
  // SUBMIT OVERRIDE
  // ============================================================
  const handleOverrideSubmit = async (event) => {
    event.preventDefault();

    if (!activeAssignment || !overrideCandidateId) {
      return;
    }

    const trimmedReason = overrideReason.trim();

    if (trimmedReason.length < 10) {
      setPageError(
        'Please provide a meaningful override justification of at least 10 characters.'
      );
      setDecisionType('error');
      return;
    }

    const assignmentId =
      activeAssignment.id || activeAssignment._id;

    try {
      setSubmittingDecision(true);
      setDecisionFeedback('');
      setDecisionType('');
      setPageError('');

      const res = await assignmentsAPI.overrideAssignment(
        assignmentId,
        {
          workerId: overrideCandidateId,
          reason: trimmedReason,
        }
      );

      if (!res?.data?.success) {
        throw new Error(
          res?.data?.message ||
            'Assignment override failed.'
        );
      }

      const updatedAssignment =
        res.data.data ||
        res.data.assignment ||
        res.data.result;

      if (!updatedAssignment) {
        throw new Error(
          'Override was processed but updated assignment data was not returned.'
        );
      }

      setActiveAssignment(updatedAssignment);

      setAssignments((previous) =>
        previous.map((assignment) =>
          (assignment.id || assignment._id) ===
          (updatedAssignment.id || updatedAssignment._id)
            ? updatedAssignment
            : assignment
        )
      );

      setShowOverrideModal(false);
      setOverrideCandidateId('');
      setOverrideReason('');

      setDecisionFeedback(
        'Manager override documented successfully and submitted to the audit trail.'
      );

      setDecisionType('success');
    } catch (err) {
      console.error(
        '[AssignmentComparison] Override failed:',
        err
      );

      setPageError(
        err?.response?.data?.message ||
          err?.message ||
          'Assignment override failed.'
      );

      setDecisionType('error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // ============================================================
  // NORMALIZE CANDIDATE LIST
  // ============================================================
  const candidates = useMemo(() => {
    if (!Array.isArray(activeAssignment?.candidateComparison)) {
      return [];
    }

    return activeAssignment.candidateComparison;
  }, [activeAssignment]);

  // ============================================================
  // AI METADATA
  // ============================================================
  const aiConfidence = Number(
    activeAssignment?.aiMatchConfidence ??
      activeAssignment?.confidenceScore ??
      activeAssignment?.candidateComparisonConfidence ??
      0
  );

  const aiModel =
    activeAssignment?.aiModelVersion ||
    activeAssignment?.modelVersion ||
    activeAssignment?.candidateComparisonModel ||
    'Decision-support matching engine';

  const aiTimestamp =
    activeAssignment?.aiGeneratedAt ||
    activeAssignment?.timestamp ||
    activeAssignment?.candidateComparisonTimestamp;

  const aiExplanation =
    activeAssignment?.aiExplanation ||
    activeAssignment?.candidateComparisonExplanation ||
    'Candidate suitability is calculated from observable workforce factors including skill alignment, capacity, workload, timetable compatibility, and assignment requirements.';

  const fairnessVerification =
    activeAssignment?.fairnessVerification ||
    activeAssignment?.candidateComparisonFairness ||
    null;

  const getConfidenceLabel = (score) => {
    if (score >= 90) return 'High Confidence';
    if (score >= 80) return 'Moderate Confidence';
    if (score > 0) return 'Low Confidence';
    return 'Not Available';
  };

  const getConfidenceClass = (score) => {
    if (score >= 90) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (score >= 80) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getStatusClass = (status) => {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'approved') {
      return 'bg-emerald-100 text-emerald-800';
    }

    if (
      normalized === 'overridden' ||
      normalized === 'override'
    ) {
      return 'bg-purple-100 text-purple-800';
    }

    if (normalized === 'rejected') {
      return 'bg-rose-100 text-rose-800';
    }

    return 'bg-amber-100 text-amber-800';
  };

  const getCandidateScore = (candidate) => {
    return Number(
      candidate?.matchScore ??
        candidate?.compositeScore ??
        candidate?.score ??
        0
    );
  };

  const getCandidateSkillScore = (candidate) => {
    return candidate?.skillFitScore ??
      candidate?.skillFit ??
      candidate?.skillSuitability ??
      'Not available';
  };

  const getCandidateCapacityScore = (candidate) => {
    return candidate?.capacityFitScore ??
      candidate?.capacityFit ??
      candidate?.capacityImpact ??
      'Not available';
  };

  const isAuthorizedForDecision = [
    'HRAdmin',
    'WorkforcePlanner',
    'TeamLead',
  ].includes(role);

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />

          <div className="text-sm font-bold text-slate-900">
            Loading assignment intelligence...
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Retrieving workforce assignments and candidate data.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================
  return (
    <div className="space-y-6">
      {/* ========================================================
          HEADER
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>District Operations</span>

            <span>/</span>

            <span className="text-slate-800 font-semibold">
              Assignment Intelligence
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Assignment Candidate Comparison & Manager Approval
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Compare candidate suitability using observable evidence,
            capacity, workload, timetable compatibility, and
            explainable AI-assisted recommendations.
          </p>
        </div>

        {/* Assignment Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Course / Intervention:
          </label>

          <select
            value={selectedAssignmentId}
            onChange={(event) =>
              handleSelectAssignment(event.target.value)
            }
            disabled={assignments.length === 0}
            className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none shadow-sm max-w-xs truncate disabled:opacity-50"
          >
            {assignments.length === 0 ? (
              <option value="">
                No assignments available
              </option>
            ) : (
              assignments.map((assignment) => (
                <option
                  key={assignment.id || assignment._id}
                  value={assignment.id || assignment._id}
                >
                  {assignment.title || 'Untitled Assignment'}{' '}
                  ({assignment.campus || 'Campus not set'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* ========================================================
          ERROR
      ======================================================== */}
      {pageError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />

          <div>
            <div className="font-bold">
              Action could not be completed
            </div>

            <div className="mt-0.5">{pageError}</div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUCCESS / FEEDBACK
      ======================================================== */}
      {decisionFeedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            decisionType === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {decisionType === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          )}

          <span>{decisionFeedback}</span>
        </div>
      )}

      {/* ========================================================
          EMPTY ASSIGNMENT STATE
      ======================================================== */}
      {!activeAssignment && (
        <div className="min-h-[350px] bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center">
          <GitCompare className="w-8 h-8 text-slate-300 mb-2" />

          <div className="font-semibold text-sm text-slate-600">
            No assignment selected
          </div>

          <p className="max-w-md mt-1 text-[11px] text-slate-400">
            There are currently no assignments available for
            candidate comparison.
          </p>

          <button
            type="button"
            onClick={loadAssignments}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      )}

      {/* ========================================================
          ACTIVE ASSIGNMENT
      ======================================================== */}
      {activeAssignment && (
        <>
          {/* ASSIGNMENT PROFILE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {activeAssignment.type && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                      {activeAssignment.type}
                    </span>
                  )}

                  <span className="text-xs text-slate-500 font-medium">
                    {activeAssignment.campus ||
                      'Campus not specified'}
                    {activeAssignment.gradeLevel
                      ? ` • ${activeAssignment.gradeLevel}`
                      : ''}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusClass(
                      activeAssignment.status
                    )}`}
                  >
                    Status:{' '}
                    {String(
                      activeAssignment.status || 'pending'
                    ).toUpperCase()}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  {activeAssignment.title ||
                    'Untitled Assignment'}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                  <span>
                    Weekly Commitment:{' '}
                    <strong className="text-slate-900">
                      {activeAssignment.weeklyHours ?? '—'} hrs/wk
                    </strong>
                  </span>

                  <span>
                    Enrolled Students:{' '}
                    <strong className="text-slate-900">
                      {activeAssignment.studentCount ?? '—'}
                    </strong>
                  </span>

                  <span>
                    Current Assignee:{' '}
                    <strong className="text-slate-900">
                      {activeAssignment.assignedWorkerName ||
                        'Unassigned'}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunAIMatch}
                disabled={matching}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start md:self-auto disabled:opacity-50"
              >
                {matching ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-sky-400" />
                )}

                <span>
                  {matching
                    ? 'Analyzing Faculty Data...'
                    : 'Refresh AI Candidate Analysis'}
                </span>
              </button>
            </div>

            {/* REQUIRED SKILLS */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Prerequisite Skills:
              </span>

              {Array.isArray(
                activeAssignment.requiredSkills
              ) &&
              activeAssignment.requiredSkills.length > 0 ? (
                activeAssignment.requiredSkills.map(
                  (skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {skill}
                    </span>
                  )
                )
              ) : (
                <span className="text-[11px] text-slate-400">
                  No prerequisite skills specified.
                </span>
              )}
            </div>
          </div>

          {/* ======================================================
              AI EXPLANATION / METADATA
          ====================================================== */}
          {candidates.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* CONFIDENCE */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                  <Brain className="w-4 h-4 text-sky-600" />
                  AI Match Confidence
                </div>

                <div className="flex items-end gap-2 mt-2">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {aiConfidence > 0
                      ? `${aiConfidence}%`
                      : '—'}
                  </span>

                  {aiConfidence > 0 && (
                    <span
                      className={`mb-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getConfidenceClass(
                        aiConfidence
                      )}`}
                    >
                      {getConfidenceLabel(aiConfidence)}
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 mt-2">
                  Confidence describes the reliability of the
                  recommendation model, not a guarantee that the
                  top-ranked candidate is the correct business
                  decision.
                </p>
              </div>

              {/* MODEL */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                  <Database className="w-4 h-4 text-sky-600" />
                  Model & Source
                </div>

                <div className="text-xs font-bold text-slate-900 mt-2 break-words">
                  {aiModel}
                </div>

                <div className="text-[10px] text-slate-500 mt-2">
                  Generated:{' '}
                  {aiTimestamp
                    ? formatDateTime(aiTimestamp)
                    : 'Not available'}
                </div>
              </div>

              {/* HUMAN REVIEW */}
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-amber-800">
                  <UserCheck className="w-4 h-4" />
                  Human Review Required
                </div>

                <p className="text-[11px] text-amber-800 mt-2 leading-relaxed">
                  AI ranking is advisory. Authorized users must
                  review evidence, workload impact, timetable
                  constraints, and operational context before
                  approving an assignment.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================
              AI EXPLANATION
          ====================================================== */}
          {candidates.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-sky-600" />

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  AI Recommendation Explanation
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {aiExplanation}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600">
                  Skill alignment
                </span>

                <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600">
                  Capacity fit
                </span>

                <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600">
                  Workload impact
                </span>

                <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600">
                  Timetable compatibility
                </span>
              </div>
            </div>
          )}

          {/* ======================================================
              CANDIDATE COMPARISON
          ====================================================== */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-sky-600" />

                <span>
                  Candidate Evaluation & Suitability Matrix
                </span>
              </h2>

              <span className="text-xs text-slate-500">
                {candidates.length} Evaluated Option
                {candidates.length === 1 ? '' : 's'}
              </span>
            </div>

            {candidates.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {candidates.map((candidate, index) => {
                  const candidateId =
                    candidate.workerId || candidate.id;

                  const candidateScore =
                    getCandidateScore(candidate);

                  const isTopRanked =
                    Number(candidate.recommendationRank) === 1 ||
                    (!candidate.recommendationRank &&
                      index === 0);

                  const isAssigned =
                    String(
                      activeAssignment.assignedWorkerId || ''
                    ) === String(candidateId);

                  const scheduleConflicts = Number(
                    candidate.scheduleConflicts || 0
                  );

                  return (
                    <div
                      key={candidateId || index}
                      className={`bg-white rounded-2xl border p-5 shadow-sm transition-all space-y-4 relative ${
                        isTopRanked
                          ? 'border-sky-300 ring-1 ring-sky-200 bg-sky-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* CANDIDATE HEADER */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                              isTopRanked
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            #
                            {candidate.recommendationRank ||
                              index + 1}
                          </span>

                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {candidate.workerName ||
                                'Unnamed Candidate'}
                            </h3>

                            <p className="text-[11px] text-slate-500 truncate">
                              {candidate.roleTitle ||
                                'Role not specified'}
                            </p>

                            {candidate.campus && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {candidate.campus}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {isTopRanked && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-sky-600" />

                              AI Recommendation
                            </span>
                          )}

                          <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-xs">
                            {candidateScore > 0
                              ? `${candidateScore}% Fit`
                              : 'Fit —'}
                          </div>
                        </div>
                      </div>

                      {/* METRICS */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            Skill Suitability
                          </div>

                          <div className="font-bold text-slate-800 mt-0.5">
                            {getCandidateSkillScore(
                              candidate
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            Capacity Impact
                          </div>

                          <div className="font-bold text-slate-800 mt-0.5">
                            {getCandidateCapacityScore(
                              candidate
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            Burnout Risk
                          </div>

                          <div
                            className={`font-bold mt-0.5 ${
                              String(
                                candidate.burnoutRisk ||
                                  candidate.burnoutImpact ||
                                  ''
                              ).toLowerCase() === 'critical'
                                ? 'text-rose-600'
                                : String(
                                    candidate.burnoutRisk ||
                                      candidate.burnoutImpact ||
                                      ''
                                  ).toLowerCase() === 'high'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {candidate.burnoutImpact ||
                              candidate.burnoutRisk ||
                              'Low'}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            Timetable Conflicts
                          </div>

                          <div className="font-bold mt-0.5">
                            {scheduleConflicts > 0 ? (
                              <span className="text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />

                                {scheduleConflicts} Conflict
                                {scheduleConflicts === 1
                                  ? ''
                                  : 's'}
                              </span>
                            ) : (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />

                                None
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* UTILIZATION */}
                      {(candidate.currentUtilization ||
                        candidate.projectedUtilization) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                              Current Utilization
                            </div>

                            <div className="text-xs font-bold text-slate-900 mt-1">
                              {candidate.currentUtilization ||
                                'Not available'}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                              Projected Utilization
                            </div>

                            <div className="text-xs font-bold text-slate-900 mt-1">
                              {candidate.projectedUtilization ||
                                'Not available'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CONFLICT DESCRIPTION */}
                      {candidate.conflictDescription && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />

                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">
                              Schedule Assessment
                            </div>

                            <div className="text-[11px] text-slate-700 mt-1">
                              {candidate.conflictDescription}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OBSERVABLE EVIDENCE */}
                      {Array.isArray(
                        candidate.observableFactors
                      ) &&
                        candidate.observableFactors.length >
                          0 && (
                          <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="w-3.5 h-3.5 text-sky-600" />

                              <span className="text-[10px] font-bold text-sky-800 uppercase">
                                Observable Evidence
                              </span>
                            </div>

                            <ul className="space-y-1.5">
                              {candidate.observableFactors.map(
                                (factor, factorIndex) => (
                                  <li
                                    key={factorIndex}
                                    className="text-[11px] text-slate-700 flex items-start gap-2"
                                  >
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />

                                    <span>{factor}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {/* ACTIONS */}
                      <div className="pt-2 border-t border-slate-100">
                        {isAssigned ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />

                              Currently Assigned
                            </span>

                            <span className="text-[10px] text-slate-400">
                              Approved workforce decision
                            </span>
                          </div>
                        ) : isAuthorizedForDecision ? (
                          <div className="flex flex-col sm:flex-row items-stretch gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleDirectAssign(
                                  candidateId
                                )
                              }
                              disabled={
                                submittingDecision ||
                                !candidateId
                              }
                              className="flex-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                              {submittingDecision
                                ? 'Processing...'
                                : 'Approve Candidate'}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openOverrideModal(candidateId)
                              }
                              disabled={
                                submittingDecision ||
                                !candidateId
                              }
                              className="py-2 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition-colors disabled:opacity-50"
                            >
                              Override Justification
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <Lock className="w-4 h-4 text-slate-500" />

                            <div>
                              <div className="text-[11px] font-bold text-slate-700">
                                Review Only
                              </div>

                              <div className="text-[10px] text-slate-500">
                                Your role does not have authority to
                                approve or override assignments.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
                <GitCompare className="w-8 h-8 text-slate-300 mx-auto mb-3" />

                <div className="text-sm font-bold text-slate-700">
                  No Candidate Analysis Available
                </div>

                <p className="max-w-md mx-auto text-[11px] text-slate-500 mt-1">
                  Run the AI candidate analysis to evaluate available
                  workers against the assignment requirements.
                </p>

                <button
                  type="button"
                  onClick={handleRunAIMatch}
                  disabled={matching}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {matching ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}

                  Generate Candidate Analysis
                </button>
              </div>
            )}
          </div>

          {/* ======================================================
              FAIRNESS / GOVERNANCE
          ====================================================== */}
          {candidates.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Scale className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />

                <div className="flex-1">
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Fairness & Governance Verification
                  </div>

                  <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                    Candidate recommendations should use observable
                    job-related criteria and must not use protected
                    characteristics as decision factors. Human review
                    remains mandatory for material workforce decisions.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {(
                      fairnessVerification
                        ?.prohibitedFactorsExcluded ||
                      fairnessVerification?.protectedAttributesExcluded ||
                      [
                        'Age',
                        'Gender',
                        'Race',
                        'Marital / Family Status',
                        'Religious Affiliation',
                      ]
                    ).map((factor, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-lg bg-white border border-emerald-200 text-[10px] font-semibold text-emerald-700"
                      >
                        Excluded: {factor}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-lg bg-white border border-emerald-200 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Observable Criteria
                    </span>

                    <span className="px-2 py-1 rounded-lg bg-white border border-emerald-200 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      Human Review Required
                    </span>

                    <span className="px-2 py-1 rounded-lg bg-white border border-emerald-200 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Decision Auditability
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              AI VS HUMAN DECISION FLOW
          ====================================================== */}
          {candidates.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-4 h-4 text-sky-600" />

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  AI Recommendation → Human Decision
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="text-[10px] font-bold uppercase text-sky-700">
                    Step 1
                  </div>

                  <div className="text-xs font-bold text-slate-900 mt-1">
                    AI Recommendation
                  </div>

                  <p className="text-[10px] text-slate-600 mt-1">
                    Candidates are ranked using observable job-related
                    factors.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] font-bold uppercase text-amber-700">
                    Step 2
                  </div>

                  <div className="text-xs font-bold text-slate-900 mt-1">
                    Authorized Human Review
                  </div>

                  <p className="text-[10px] text-slate-600 mt-1">
                    A manager or workforce planner evaluates evidence
                    and operational context.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">
                    Step 3
                  </div>

                  <div className="text-xs font-bold text-slate-900 mt-1">
                    Approved Decision
                  </div>

                  <p className="text-[10px] text-slate-600 mt-1">
                    The final assignment is a human-authorized
                    business decision, not an automatic AI decision.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 text-slate-400">
                <span className="text-[10px] font-semibold">
                  AI Suggestion
                </span>

                <ArrowRight className="w-3.5 h-3.5" />

                <span className="text-[10px] font-semibold">
                  Human Review
                </span>

                <ArrowRight className="w-3.5 h-3.5" />

                <span className="text-[10px] font-semibold">
                  Approved / Overridden Decision
                </span>
              </div>
            </div>
          )}

          {/* ======================================================
              OVERRIDE HISTORY
          ====================================================== */}
          {activeAssignment.overrideDetails?.overridden && (
            <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider">
                <History className="w-4 h-4 text-purple-600" />

                <span>
                  Documented Administrative Override Record
                </span>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-slate-700">
                  <span>
                    <strong>Authorizing Manager:</strong>{' '}
                    {activeAssignment.overrideDetails.actor ||
                      'Unknown'}
                    {activeAssignment.overrideDetails.actorRole
                      ? ` (${activeAssignment.overrideDetails.actorRole})`
                      : ''}
                  </span>

                  <span className="text-[11px] text-slate-500">
                    {activeAssignment.overrideDetails.timestamp
                      ? formatDateTime(
                          activeAssignment.overrideDetails
                            .timestamp
                        )
                      : 'Timestamp unavailable'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500">
                    Mandatory Justification Rationale:
                  </span>

                  <p className="font-medium text-slate-900 mt-1 italic">
                    "
                    {activeAssignment.overrideDetails.reason ||
                      'No justification recorded.'}
                    "
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              AUDITABILITY NOTICE
          ====================================================== */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <History className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />

              <div>
                <div className="text-xs font-bold text-slate-800">
                  Decision Auditability
                </div>

                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Material assignment actions should retain the
                  acting user, timestamp, selected worker, decision
                  type, justification where applicable, and resulting
                  state. AI recommendations and human-approved
                  decisions are intentionally represented as separate
                  stages.
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================
              MANAGER OVERRIDE MODAL
          ====================================================== */}
          {showOverrideModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="override-modal-title"
            >
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3
                      id="override-modal-title"
                      className="text-base font-bold text-slate-900"
                    >
                      Document Manager Override
                    </h3>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Formalize an administrative exception to the
                      AI-recommended candidate ranking.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowOverrideModal(false)
                    }
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    aria-label="Close override dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={handleOverrideSubmit}
                  className="space-y-4"
                >
                  {/* COMPLIANCE */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />

                      <span>
                        Mandatory Justification Required
                      </span>
                    </div>

                    <p className="leading-relaxed">
                      If you select a candidate contrary to the AI
                      recommendation, record a clear,
                      job-related business or pedagogical reason.
                      The override should be retained in the audit
                      trail.
                    </p>
                  </div>

                  {/* SELECTED CANDIDATE */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Selected Candidate
                    </div>

                    <div className="text-xs font-bold text-slate-900 mt-1">
                      {candidates.find(
                        (candidate) =>
                          String(
                            candidate.workerId ||
                              candidate.id
                          ) === String(overrideCandidateId)
                      )?.workerName ||
                        'Selected worker'}
                    </div>
                  </div>

                  {/* REASON */}
                  <div>
                    <label
                      htmlFor="override-reason"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Mandatory Business / Pedagogical
                      Justification
                    </label>

                    <textarea
                      id="override-reason"
                      required
                      minLength={10}
                      rows={5}
                      value={overrideReason}
                      onChange={(event) =>
                        setOverrideReason(event.target.value)
                      }
                      placeholder="State the specific job-related reason for overriding the AI recommendation..."
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-y"
                    />

                    <div className="text-[10px] text-slate-400 mt-1 text-right">
                      {overrideReason.trim().length} / 10
                      minimum characters
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOverrideModal(false);
                        setOverrideReason('');
                      }}
                      disabled={submittingDecision}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        submittingDecision ||
                        overrideReason.trim().length < 10
                      }
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {submittingDecision && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      )}

                      {submittingDecision
                        ? 'Recording Override...'
                        : 'Submit & Audit Override'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
