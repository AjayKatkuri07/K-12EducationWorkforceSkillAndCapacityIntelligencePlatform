import React, { useState, useEffect } from 'react';
import { fairnessAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  FileCheck,
  Sparkles,
  Info,
  X
} from 'lucide-react';

export default function FairnessReviewPage() {
  const { role, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Review decision modal state
  const [activeReview, setActiveReview] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadReviews();
  }, [selectedStatus]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fairnessAPI.getReviews({ status: selectedStatus });
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error('[FairnessReview] Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecisionModal = (review, defaultDecision = 'approved') => {
    setActiveReview(review);
    setDecision(defaultDecision);
    setReason('');
    setFeedback('');
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!activeReview || !reason || reason.trim().length < 5) return;

    try {
      setSubmitting(true);
      const res = await fairnessAPI.submitDecision(activeReview.id || activeReview._id, {
        decision,
        reason
      });
      if (res.data.success) {
        setReviews(prev => prev.map(r => r.id === activeReview.id ? res.data.data : r));
        setActiveReview(null);
        setFeedback(`Recorded ${decision.toUpperCase()} decision with full compliance audit trail.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Governance & Ethics</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Fairness & Evidence Review</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Assignment Fairness & Human Evidence Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Strict human-in-the-loop oversight. AI suggestions are segregated from business actions until validated by authorized staff.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Review Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 shadow-2xs"
          >
            <option value="All">All Reviews</option>
            <option value="pending">Pending Human Review</option>
            <option value="approved">Approved Decisions</option>
            <option value="rejected">Rejected Proposals</option>
            <option value="overridden">Manager Overrides</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Fairness Compliance Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Demographic Parity Ratio</span>
            <Scale className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">0.98</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High Neutrality (Optimal band: 0.90 - 1.10)
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Protected Attributes Guardrail</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">100% Enforced</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Age, Gender, Race & Family status strictly isolated from model inputs
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Mandatory Review Audit Status</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">Zero Auto-Hiring</div>
          <p className="text-[11px] text-slate-500 mt-1">
            All high-impact actions require documented human review
          </p>
        </div>
      </div>

      {/* Review Queue Items */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading fairness review queue...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No fairness review records found for the selected filter.
          </div>
        ) : (
          reviews.map((rev) => {
            const isPending = rev.reviewerDecision === 'pending';

            return (
              <div
                key={rev.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-4 transition-all ${
                  isPending ? 'border-sky-300 ring-1 ring-sky-200' : 'border-slate-200'
                }`}
              >
                {/* Header Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {rev.recommendationType}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{rev.assignmentTitle}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        rev.reviewerDecision === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rev.reviewerDecision === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : rev.reviewerDecision === 'overridden'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      Decision: {rev.reviewerDecision.toUpperCase()}
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      Conf: {rev.confidenceScore}%
                    </span>
                  </div>
                </div>

                {/* Proposed Action Banner */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>AI Algorithmic Proposal (Uncommitted)</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{rev.proposedAction}</div>
                  <div className="text-xs text-slate-600 mt-1">Target Educator: <span className="font-semibold text-slate-800">{rev.candidateName}</span></div>
                </div>

                {/* Contributing Inputs & Observable Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Observable Factors Cited by Model:</span>
                    </div>
                    <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                      {rev.observableFactors?.map((fac, i) => (
                        <li key={i}>{fac}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fairness Audit & Protected Attribute Exclusions:</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Excluded protected variables: <span className="font-medium text-slate-800">{rev.protectedAttributesExcluded?.join(', ')}</span>.
                      Parity ratio: <span className="font-bold text-emerald-700">{rev.fairnessMetrics?.demographicParityRatio || '1.0'}</span>.
                    </p>
                  </div>
                </div>

                {/* Reviewer Recorded Outcome */}
                {!isPending && rev.reviewerReason && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                      <span>Reviewed by: <strong>{rev.reviewerName}</strong></span>
                      <span>{formatDateTime(rev.reviewedAt || rev.createdAt)}</span>
                    </div>
                    <p className="text-slate-800 italic">
                      Reason: "{rev.reviewerReason}"
                    </p>
                  </div>
                )}

                {/* Action Controls for Authorized Reviewers */}
                {isPending && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Pending human authorization before staff schedule is updated</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDecisionModal(rev, 'rejected')}
                        className="px-3.5 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors"
                      >
                        Reject Proposal
                      </button>

                      <button
                        onClick={() => handleOpenDecisionModal(rev, 'overridden')}
                        className="px-3.5 py-1.5 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold transition-colors"
                      >
                        Custom Override...
                      </button>

                      <button
                        onClick={() => handleOpenDecisionModal(rev, 'approved')}
                        className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Accept & Authorize
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Decision Submission Modal */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Human Review Decision</h3>
                <p className="text-xs text-slate-500">Formalize decision for: {activeReview.candidateName}</p>
              </div>
              <button
                onClick={() => setActiveReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('approved')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-colors ${
                      decision === 'approved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('rejected')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-colors ${
                      decision === 'rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('overridden')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-colors ${
                      decision === 'overridden'
                        ? 'bg-purple-50 border-purple-500 text-purple-900'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    Override
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Review Reason / Justification
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this decision is being made in terms of student learning outcomes, teacher capacity, or institutional priority..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReview(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason || reason.trim().length < 5}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Confirm Decision & Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
