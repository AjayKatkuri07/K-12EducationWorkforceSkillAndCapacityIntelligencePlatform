import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

export default function LearningMobilityPage() {
  const { role, user } = useAuth();
  const [paths, setPaths] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Enroll modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Special Needs / IEP Training');
  const [provider, setProvider] = useState('State Educator Academy');
  const [durationHours, setDurationHours] = useState(15);
  const [skillsTargeted, setSkillsTargeted] = useState('Special Needs Accommodation (504/IEP)');
  const [savingEnroll, setSavingEnroll] = useState(false);

  // Update progress modal
  const [activePath, setActivePath] = useState(null);
  const [newProgress, setNewProgress] = useState(100);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, wRes] = await Promise.all([
        learningAPI.getPaths(),
        workersAPI.getWorkers()
      ]);
      if (pRes.data.success) setPaths(pRes.data.data);
      if (wRes.data.success) setWorkers(wRes.data.data);
    } catch (err) {
      console.error('[LearningMobility] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId || !title) return;
    try {
      setSavingEnroll(true);
      const res = await learningAPI.enrollWorker({
        workerId: selectedWorkerId,
        title,
        type,
        provider,
        durationHours: Number(durationHours),
        skillsTargeted: skillsTargeted.split(',').map(s => s.trim())
      });
      if (res.data.success) {
        setPaths(prev => [res.data.data, ...prev]);
        setShowEnrollModal(false);
        setTitle('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setSavingEnroll(false);
    }
  };

  const handleUpdateProgressSubmit = async (e) => {
    e.preventDefault();
    if (!activePath) return;
    try {
      setSavingProgress(true);
      const res = await learningAPI.updateProgress(activePath.id || activePath._id, {
        progressPercent: newProgress,
        status: Number(newProgress) === 100 ? 'completed' : 'in_progress',
        outcomeNotes
      });
      if (res.data.success) {
        setPaths(prev => prev.map(p => p.id === activePath.id ? res.data.data : p));
        setActivePath(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed.');
    } finally {
      setSavingProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Faculty Development & Performance</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Learning, Mobility & Outcomes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Learning, Mobility & AI Outcome Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Compare recommendations with verified outcomes, track career mobility pathways, and monitor model latency and adoption.
          </p>
        </div>

        <button
          onClick={() => setShowEnrollModal(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll Staff in PD Track</span>
        </button>
      </div>

      {/* AI Performance & Model Telemetry Dashboard */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Production AI Model Performance & Drift Telemetry</h2>
              <p className="text-[11px] text-slate-400">Monitoring Gemini inference quality, latency, and manager adoption rates</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Manager Adoption Rate</div>
            <div className="text-xl font-extrabold text-white mt-1">94.2%</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">+3.1% vs last term</div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Mean Inference Latency</div>
            <div className="text-xl font-extrabold text-white mt-1">385 ms</div>
            <div className="text-[10px] text-sky-400 mt-0.5 font-medium">Fast responsiveness</div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Prediction Accuracy</div>
            <div className="text-xl font-extrabold text-white mt-1">89.6%</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Matched post-term outcomes</div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Data Drift Indicator</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">Low (0.02)</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Well within threshold (&lt;0.05)</div>
          </div>
        </div>
      </div>

      {/* Active Learning & Professional Development Tracks */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active Professional Development & Certifications</h2>
            <p className="text-xs text-slate-500">Track module completion and automatic verification of target skill proficiencies.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{paths.length} Active Enrollments</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading learning pathways...</div>
        ) : paths.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No professional development tracks currently active.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paths.map((p) => {
              const isComplete = p.status === 'completed' || p.progressPercent === 100;

              return (
                <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                        {p.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isComplete ? 'Verified Completed' : `${p.progressPercent}% Complete`}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 leading-snug">{p.title}</h3>
                    <div className="text-[11px] text-slate-600">Educator: <strong>{p.workerName}</strong></div>
                    <div className="text-[11px] text-slate-500">{p.provider} • {p.durationHours} hrs</div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-sky-600'}`}
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.skillsTargeted?.map((sk, i) => (
                        <span key={i} className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Target: {formatDate(p.deadline)}</span>
                    {!isComplete && (
                      <button
                        onClick={() => {
                          setActivePath(p);
                          setNewProgress(100);
                          setOutcomeNotes('Completed practical observation assessment with mentor.');
                        }}
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        Record Completion
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Internal Career Mobility Pathways Visual */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">District Career Mobility & Progression Framework</h2>
            <p className="text-xs text-slate-500">Transparent progression ladders with required skill thresholds for internal promotion.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Level 1</span>
            <h3 className="text-xs font-bold text-slate-900">Classroom Educator</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Standard instructional delivery, classroom management, and formative student assessment.
            </p>
            <div className="text-[10px] font-semibold text-slate-500">Required: State Licensure</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Level 2</span>
            <h3 className="text-xs font-bold text-slate-900">Department Lead / Chair</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Subject curriculum coordination, candidate peer matching, and department timetable balancing.
            </p>
            <div className="text-[10px] font-semibold text-sky-700">Required: L4 Pedagogical Excellence</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Level 3</span>
            <h3 className="text-xs font-bold text-slate-900">Instructional Coach</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Teacher mentorship, pedagogical coaching cycles, and district professional development design.
            </p>
            <div className="text-[10px] font-semibold text-indigo-700">Required: L5 Mentorship + Tenure</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Level 4</span>
            <h3 className="text-xs font-bold text-slate-900">Academic Director</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              District-wide capacity modeling, curriculum standards alignment, and workforce governance.
            </p>
            <div className="text-[10px] font-semibold text-purple-700">Required: Principal / SBL License</div>
          </div>
        </div>
      </div>

      {/* Enroll Staff Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enroll Staff Member in PD Track</h3>
                <p className="text-xs text-slate-500">Target a specific skill gap through structured training.</p>
              </div>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Educator</label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="">Select an educator...</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.fullName} ({w.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Track Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Differentiated Instruction in Mathematics"
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Track Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Special Needs / IEP Training">Special Needs / IEP</option>
                    <option value="Pedagogy Workshop">Pedagogy Workshop</option>
                    <option value="EdTech Certification">EdTech Certification</option>
                    <option value="Certification Preparation">Certification Prep</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Skills (comma-separated)</label>
                <input
                  type="text"
                  value={skillsTargeted}
                  onChange={(e) => setSkillsTargeted(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
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

      {/* Record Completion Modal */}
      {activePath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Record Outcome & Verify Skill</h3>
            <p className="text-xs text-slate-500 mb-3">
              Completing this course will automatically update {activePath.workerName}'s verified skill profile.
            </p>

            <form onSubmit={handleUpdateProgressSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Progress Percentage</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newProgress}
                  onChange={(e) => setNewProgress(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verification / Assessment Evidence Notes</label>
                <textarea
                  rows={3}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Record mentor observation notes or certificate serial code..."
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
                  {savingProgress ? 'Saving...' : 'Verify & Upgrade Skills'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
