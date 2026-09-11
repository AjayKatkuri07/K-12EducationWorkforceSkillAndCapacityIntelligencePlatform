import React, { useEffect, useMemo, useState } from 'react';
import { learningAPI, workersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  Activity,
  ThumbsUp,
  Cpu,
  UserCheck,
  X,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Info,
  Target,
  BarChart3,
  Brain,
  Search
} from 'lucide-react';

const REVIEWER_ROLES = ['HRAdmin', 'WorkforcePlanner', 'TeamLead'];

function getId(item) {
  return item?.id || item?._id;
}

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? [];
}

function normalizePaths(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.paths)) return data.paths;
  if (Array.isArray(data?.learningPaths)) return data.learningPaths;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeWorkers(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.workers)) return data.workers;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function clampProgress(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

function getProgress(path) {
  return clampProgress(path?.progressPercent ?? path?.progress ?? 0);
}

function getStatus(path) {
  const progress = getProgress(path);

  if (path?.status === 'completed' || progress >= 100) {
    return 'completed';
  }

  if (path?.status === 'in_progress' || progress > 0) {
    return 'in_progress';
  }

  return 'not_started';
}

function getStatusLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'in_progress') return 'In Progress';
  return 'Not Started';
}

function getStatusClasses(status) {
  if (status === 'completed') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  if (status === 'in_progress') {
    return 'bg-sky-100 text-sky-800 border-sky-200';
  }

  return 'bg-amber-100 text-amber-800 border-amber-200';
}

function getWorkerName(path, workers) {
  if (path?.workerName) return path.workerName;

  const worker = workers.find(
    (item) => String(getId(item)) === String(path?.workerId)
  );

  return worker?.fullName || worker?.name || 'Unassigned educator';
}

function getOutcomeState(path) {
  const status = getStatus(path);

  if (status === 'completed') {
    return {
      label: 'Outcome recorded',
      tone: 'emerald',
      description:
        path?.outcomeNotes ||
        path?.verificationNotes ||
        'Completion is recorded. Verify the evidence before using it for workforce decisions.'
    };
  }

  if (path?.outcomeNotes || path?.verificationNotes) {
    return {
      label: 'Evidence available',
      tone: 'sky',
      description: path.outcomeNotes || path.verificationNotes
    };
  }

  return {
    label: 'Outcome pending',
    tone: 'amber',
    description:
      'No verified outcome has been recorded yet. Learning completion should not be treated as proof of proficiency.'
  };
}

export default function LearningMobilityPage() {
  const { role } = useAuth();

  const canManageLearning = REVIEWER_ROLES.includes(role);

  const [paths, setPaths] = useState([]);
  const [workers, setWorkers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Search / filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Enrollment modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Special Needs / IEP Training');
  const [provider, setProvider] = useState('State Educator Academy');
  const [durationHours, setDurationHours] = useState(15);
  const [skillsTargeted, setSkillsTargeted] = useState(
    'Special Needs Accommodation (504/IEP)'
  );
  const [savingEnroll, setSavingEnroll] = useState(false);

  // Progress modal
  const [activePath, setActivePath] = useState(null);
  const [newProgress, setNewProgress] = useState(100);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const [pRes, wRes] = await Promise.all([
        learningAPI.getPaths(),
        workersAPI.getWorkers()
      ]);

      if (pRes?.data?.success !== false) {
        setPaths(normalizePaths(unwrapResponse(pRes)));
      }

      if (wRes?.data?.success !== false) {
        setWorkers(normalizeWorkers(unwrapResponse(wRes)));
      }
    } catch (err) {
      console.error('[LearningMobility] Error loading data:', err);

      setError(
        err?.response?.data?.message ||
          'Unable to load learning and mobility data. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleEnrollSubmit(event) {
    event.preventDefault();

    if (!canManageLearning) {
      setFeedback('You do not have permission to create learning assignments.');
      return;
    }

    if (!selectedWorkerId || !title.trim()) {
      setFeedback('Select an educator and enter a learning track title.');
      return;
    }

    try {
      setSavingEnroll(true);
      setFeedback('');

      const response = await learningAPI.enrollWorker({
        workerId: selectedWorkerId,
        title: title.trim(),
        type,
        provider,
        durationHours: Number(durationHours),
        skillsTargeted: skillsTargeted
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
      });

      if (response?.data?.success) {
        const createdPath = unwrapResponse(response);

        setPaths((previous) => [
          ...(createdPath ? [createdPath] : []),
          ...previous
        ]);

        setShowEnrollModal(false);

        setSelectedWorkerId('');
        setTitle('');
        setDurationHours(15);
        setFeedback('Learning track created successfully.');
      }
    } catch (err) {
      console.error('[LearningMobility] Enrollment error:', err);

      setFeedback(
        err?.response?.data?.message ||
          'Enrollment failed. Please check the backend response and try again.'
      );
    } finally {
      setSavingEnroll(false);
    }
  }

  async function handleUpdateProgressSubmit(event) {
    event.preventDefault();

    if (!activePath) return;

    if (!canManageLearning) {
      setFeedback('You do not have permission to update learning outcomes.');
      return;
    }

    if (!outcomeNotes.trim()) {
      setFeedback(
        'Add evidence or outcome notes before recording a learning outcome.'
      );
      return;
    }

    try {
      setSavingProgress(true);
      setFeedback('');

      const pathId = getId(activePath);

      const response = await learningAPI.updateProgress(pathId, {
        progressPercent: Number(newProgress),
        status:
          Number(newProgress) === 100 ? 'completed' : 'in_progress',
        outcomeNotes: outcomeNotes.trim()
      });

      if (response?.data?.success) {
        const updatedPath = unwrapResponse(response);

        setPaths((previous) =>
          previous.map((path) =>
            String(getId(path)) === String(pathId)
              ? updatedPath
              : path
          )
        );

        setActivePath(null);
        setOutcomeNotes('');

        setFeedback(
          Number(newProgress) === 100
            ? 'Learning completion and evidence were recorded. Skill proficiency still requires appropriate verification.'
            : 'Learning progress updated successfully.'
        );
      }
    } catch (err) {
      console.error('[LearningMobility] Progress update error:', err);

      setFeedback(
        err?.response?.data?.message ||
          'Unable to update learning progress.'
      );
    } finally {
      setSavingProgress(false);
    }
  }

  const filteredPaths = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return paths.filter((path) => {
      const status = getStatus(path);

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      if (!matchesStatus) return false;

      if (!search) return true;

      const workerName = getWorkerName(path, workers);

      const searchableText = [
        path?.title,
        path?.type,
        path?.provider,
        workerName,
        ...(path?.skillsTargeted || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [paths, workers, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const total = paths.length;

    const completed = paths.filter(
      (path) => getStatus(path) === 'completed'
    ).length;

    const inProgress = paths.filter(
      (path) => getStatus(path) === 'in_progress'
    ).length;

    const averageProgress =
      total > 0
        ? Math.round(
            paths.reduce((sum, path) => sum + getProgress(path), 0) /
              total
          )
        : 0;

    const outcomeRecorded = paths.filter(
      (path) =>
        Boolean(path?.outcomeNotes) ||
        Boolean(path?.verificationNotes) ||
        getStatus(path) === 'completed'
    ).length;

    return {
      total,
      completed,
      inProgress,
      averageProgress,
      outcomeRecorded
    };
  }, [paths]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Faculty Development & Performance</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              Learning, Mobility & Outcomes
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Learning, Mobility & AI Outcome Tracking
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Connect skill gaps to learning pathways, track verified outcomes,
            and monitor workforce development without making automatic
            employment decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>

          {canManageLearning && (
            <button
              onClick={() => setShowEnrollModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Enroll Staff
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="flex items-start gap-3 p-3 rounded-xl border border-sky-200 bg-sky-50 text-sky-800 text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">{feedback}</div>
          <button
            onClick={() => setFeedback('')}
            className="text-sky-500 hover:text-sky-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RBAC */}
      {!canManageLearning && (
        <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Read-only learning view.</strong>{' '}
            Your role can view learning pathways and outcomes, but only
            authorized workforce reviewers can create or update learning
            records.
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />

          <div className="flex-1">
            <div className="font-bold">Learning data unavailable</div>
            <div className="mt-1">{error}</div>
          </div>

          <button
            onClick={() => loadData()}
            className="px-3 py-1.5 bg-white border border-red-200 rounded-lg font-semibold hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Operational Learning Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          icon={BookOpen}
          label="Learning Tracks"
          value={metrics.total}
          description="Backend records"
        />

        <MetricCard
          icon={CheckCircle2}
          label="Completed"
          value={metrics.completed}
          description={
            metrics.total
              ? `${Math.round(
                  (metrics.completed / metrics.total) * 100
                )}% of tracks`
              : 'No records'
          }
        />

        <MetricCard
          icon={Clock}
          label="In Progress"
          value={metrics.inProgress}
          description="Active development"
        />

        <MetricCard
          icon={TrendingUp}
          label="Avg. Progress"
          value={`${metrics.averageProgress}%`}
          description="Current records"
        />

        <MetricCard
          icon={Award}
          label="Evidence Recorded"
          value={metrics.outcomeRecorded}
          description="Requires verification"
        />
      </div>

      {/* AI Governance / Telemetry */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-start gap-2">
            <Cpu className="w-5 h-5 text-sky-400 mt-0.5" />

            <div>
              <h2 className="text-sm font-bold text-white">
                AI Learning Decision-Support Monitoring
              </h2>

              <p className="text-[11px] text-slate-400 mt-0.5">
                Governance indicators for learning recommendations and outcome
                tracking.
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Advisory Only
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <TelemetryCard
            title="Recommendation Status"
            value="Human Review Required"
            description="AI suggestions do not automatically change employment status."
            icon={UserCheck}
          />

          <TelemetryCard
            title="Outcome Comparison"
            value={`${metrics.outcomeRecorded}/${metrics.total}`}
            description="Learning records with outcome/evidence data."
            icon={BarChart3}
          />

          <TelemetryCard
            title="Evidence Coverage"
            value={
              metrics.total
                ? `${Math.round(
                    (metrics.outcomeRecorded / metrics.total) * 100
                  )}%`
                : '0%'
            }
            description="Records containing outcome evidence."
            icon={Target}
          />

          <TelemetryCard
            title="Model Drift"
            value="Not measured"
            description="No live drift endpoint is currently connected to this page."
            icon={Activity}
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 text-[11px] text-slate-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />

          <span>
            <strong className="text-white">Important:</strong> latency,
            accuracy, drift, failure rate, and adoption should only be shown
            as measured metrics when the backend records those events. This
            screen intentionally does not fabricate production AI telemetry.
          </span>
        </div>
      </div>

      {/* Active Learning Tracks */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Professional Development & Learning Tracks
            </h2>

            <p className="text-xs text-slate-500">
              Track skill development, completion evidence, and verified
              outcomes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />

              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tracks..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">All statuses</option>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <RefreshCw className="w-5 h-5 mx-auto text-sky-500 animate-spin" />
            <div className="text-xs text-slate-500 mt-2">
              Loading learning pathways...
            </div>
          </div>
        ) : filteredPaths.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl">
            <BookOpen className="w-7 h-7 mx-auto text-slate-300" />

            <div className="text-sm font-semibold text-slate-700 mt-2">
              No learning tracks found
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Try changing the search or status filter.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPaths.map((path) => {
              const pathId = getId(path);
              const progress = getProgress(path);
              const status = getStatus(path);
              const outcome = getOutcomeState(path);
              const workerName = getWorkerName(path, workers);

              return (
                <div
                  key={pathId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                        {path.type || 'Professional Development'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusClasses(
                          status
                        )}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">
                        {path.title || 'Untitled learning track'}
                      </h3>

                      <div className="text-[11px] text-slate-600 mt-1">
                        Educator:{' '}
                        <strong>{workerName}</strong>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {path.provider || 'Provider not specified'}
                        {path.durationHours
                          ? ` • ${path.durationHours} hrs`
                          : ''}
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-semibold text-slate-600">
                          Learning progress
                        </span>

                        <span className="font-bold text-slate-700">
                          {progress}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-sky-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Skills */}
                    {Array.isArray(path.skillsTargeted) &&
                      path.skillsTargeted.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Target skills
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {path.skillsTargeted.map((skill, index) => (
                              <span
                                key={`${skill}-${index}`}
                                className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Outcome */}
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center gap-1.5">
                        {outcome.tone === 'emerald' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-sky-600" />
                        )}

                        <span className="text-[10px] font-bold text-slate-700">
                          {outcome.label}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        {outcome.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      Target:{' '}
                      {path.deadline ? formatDate(path.deadline) : 'Not set'}
                    </span>

                    {status !== 'completed' && canManageLearning && (
                      <button
                        onClick={() => {
                          setActivePath(path);
                          setNewProgress(
                            progress > 0 ? progress : 100
                          );
                          setOutcomeNotes(
                            path.outcomeNotes ||
                              'Record mentor observation, assessment, or certificate evidence.'
                          );
                        }}
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        Update Progress
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Recommendation Governance */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
            <Brain className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              AI Learning Recommendation Governance
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Recommendations should connect observable skill gaps to learning
              opportunities while keeping final decisions with authorized
              human reviewers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <GovernanceCard
            icon={Sparkles}
            title="AI Recommendation"
            text="Advisory suggestion based on available workforce, skill, capacity, and learning evidence."
          />

          <GovernanceCard
            icon={ShieldCheck}
            title="Fairness Check"
            text="Recommendations should rely on job-relevant evidence and exclude protected demographic attributes."
          />

          <GovernanceCard
            icon={UserCheck}
            title="Human Decision"
            text="Managers remain responsible for approving, correcting, rejecting, or overriding recommendations."
          />
        </div>
      </div>

      {/* Career Mobility */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              District Career Mobility & Progression Framework
            </h2>

            <p className="text-xs text-slate-500">
              Transparent progression ladders with observable skill and
              qualification thresholds.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MobilityCard
            level="Level 1"
            title="Classroom Educator"
            description="Standard instructional delivery, classroom management, and formative student assessment."
            requirement="State Licensure"
          />

          <MobilityCard
            level="Level 2"
            title="Department Lead / Chair"
            description="Subject curriculum coordination, peer mentoring, and department timetable balancing."
            requirement="Demonstrated pedagogical proficiency"
          />

          <MobilityCard
            level="Level 3"
            title="Instructional Coach"
            description="Teacher mentorship, pedagogical coaching cycles, and professional development design."
            requirement="Verified mentorship capability"
          />

          <MobilityCard
            level="Level 4"
            title="Academic Director"
            description="District-wide capacity modeling, curriculum alignment, and workforce governance."
            requirement="Relevant leadership qualification"
          />
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />

          <span>
            Completion of a learning track is evidence of participation or
            completion, not an automatic promotion decision. Mobility decisions
            require appropriate human review and organizational policy.
          </span>
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Enroll Staff Member in PD Track
                </h3>

                <p className="text-xs text-slate-500">
                  Create a structured learning pathway for an identified
                  development need.
                </p>
              </div>

              <button
                onClick={() => setShowEnrollModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleEnrollSubmit}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Educator
                </label>

                <select
                  required
                  value={selectedWorkerId}
                  onChange={(event) =>
                    setSelectedWorkerId(event.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="">Select an educator...</option>

                  {workers.map((worker) => (
                    <option
                      key={getId(worker)}
                      value={getId(worker)}
                    >
                      {worker.fullName || worker.name} (
                      {worker.department || 'Department not specified'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Track Title
                </label>

                <input
                  type="text"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Advanced Differentiated Instruction"
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Provider
                </label>

                <input
                  type="text"
                  value={provider}
                  onChange={(event) => setProvider(event.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Track Category
                  </label>

                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Special Needs / IEP Training">
                      Special Needs / IEP
                    </option>
                    <option value="Pedagogy Workshop">
                      Pedagogy Workshop
                    </option>
                    <option value="EdTech Certification">
                      EdTech Certification
                    </option>
                    <option value="Certification Preparation">
                      Certification Prep
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duration (Hours)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={durationHours}
                    onChange={(event) =>
                      setDurationHours(event.target.value)
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Skills
                </label>

                <input
                  type="text"
                  value={skillsTargeted}
                  onChange={(event) =>
                    setSkillsTargeted(event.target.value)
                  }
                  placeholder="Skill 1, Skill 2, Skill 3"
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-100 text-[10px] text-sky-800">
                Learning enrollment is an operational action. It does not
                automatically change the employee's role, compensation,
                promotion status, or employment status.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEnroll}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
                >
                  {savingEnroll ? 'Enrolling...' : 'Enroll Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress / Outcome Modal */}
      {activePath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Learning Outcome
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  {activePath.title}
                </p>
              </div>

              <button
                onClick={() => setActivePath(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />

              <span>
                Record observable evidence such as an assessment, mentor
                observation, certificate, or demonstrated work. Completion
                alone should not be treated as proof of proficiency.
              </span>
            </div>

            <form
              onSubmit={handleUpdateProgressSubmit}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Progress Percentage
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={(event) =>
                    setNewProgress(
                      clampProgress(event.target.value)
                    )
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verification / Assessment Evidence
                </label>

                <textarea
                  rows={4}
                  required
                  value={outcomeNotes}
                  onChange={(event) =>
                    setOutcomeNotes(event.target.value)
                  }
                  placeholder="Example: Mentor observed two differentiated mathematics lessons and confirmed use of the targeted strategy."
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivePath(null)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProgress}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
                >
                  {savingProgress
                    ? 'Saving...'
                    : 'Record Outcome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------
   Small reusable UI components
--------------------------------------------- */

function MetricCard({ icon: Icon, label, value, description }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
          <Icon className="w-4 h-4" />
        </div>

        <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
          {label}
        </span>
      </div>

      <div className="text-xl font-extrabold text-slate-900 mt-2">
        {value}
      </div>

      <div className="text-[10px] text-slate-400 mt-0.5">
        {description}
      </div>
    </div>
  );
}

function TelemetryCard({
  title,
  value,
  description,
  icon: Icon
}) {
  return (
    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-sky-400" />

        <div className="text-[10px] text-slate-400 uppercase font-semibold">
          {title}
        </div>
      </div>

      <div className="text-sm font-extrabold text-white mt-2">
        {value}
      </div>

      <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
        {description}
      </div>
    </div>
  );
}

function GovernanceCard({ icon: Icon, title, text }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-violet-600" />
        <h3 className="text-xs font-bold text-slate-900">{title}</h3>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function MobilityCard({
  level,
  title,
  description,
  requirement
}) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
        {level}
      </span>

      <h3 className="text-xs font-bold text-slate-900">
        {title}
      </h3>

      <p className="text-[11px] text-slate-600 leading-relaxed">
        {description}
      </p>

      <div className="text-[10px] font-semibold text-slate-500">
        Required: {requirement}
      </div>
    </div>
  );
}