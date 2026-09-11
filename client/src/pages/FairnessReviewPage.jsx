
import React, { useEffect, useMemo, useState } from 'react';
import { fairnessAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  FileCheck,
  Sparkles,
  Database,
  Clock3,
  Info,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';

const REVIEWER_ROLES = ['HRAdmin', 'WorkforcePlanner', 'TeamLead'];

const getId = (item) => item?.id || item?._id || '';

const getStatus = (review) =>
  String(review?.reviewerDecision || review?.status || 'pending').toLowerCase();

const formatStatus = (status) =>
  String(status || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getResponseReview = (res) => {
  const body = res?.data;

  if (body?.review) return body.review;
  if (body?.data?.review) return body.data.review;

  if (body?.data && !Array.isArray(body.data)) {
    return body.data;
  }

  return null;
};

const getConfidence = (review) => {
  const value =
    review?.confidenceScore ??
    review?.aiConfidence ??
    review?.confidence ??
    review?.analysis?.confidenceScore;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const getModelVersion = (review) =>
  review?.modelVersion ||
  review?.aiModelVersion ||
  review?.analysis?.modelVersion ||
  'Decision-support model';

const getTimestamp = (review) =>
  review?.generatedAt ||
  review?.analysisTimestamp ||
  review?.timestamp ||
  review?.createdAt ||
  null;

const getEngineType = (review) =>
  review?.engineType ||
  review?.analysis?.engineType ||
  'Rules + workforce decision-support heuristics';

const getObservableFactors = (review) => {
  if (Array.isArray(review?.observableFactors)) {
    return review.observableFactors;
  }

  if (Array.isArray(review?.evidence)) {
    return review.evidence;
  }

  if (Array.isArray(review?.contributingInputs)) {
    return review.contributingInputs;
  }

  return [];
};

const getProtectedAttributes = (review) => {
  if (Array.isArray(review?.protectedAttributesExcluded)) {
    return review.protectedAttributesExcluded;
  }

  if (Array.isArray(review?.fairnessVerification?.prohibitedFactorsExcluded)) {
    return review.fairnessVerification.prohibitedFactorsExcluded;
  }

  if (Array.isArray(review?.fairnessAudit?.protectedAttributesExcluded)) {
    return review.fairnessAudit.protectedAttributesExcluded;
  }

  return [];
};

const getFairnessRatio = (review) => {
  const value =
    review?.fairnessMetrics?.demographicParityRatio ??
    review?.demographicParityRatio ??
    review?.fairnessVerification?.demographicParityRatio;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const getFairnessStatus = (ratio) => {
  if (ratio === null) return 'Not provided';

  if (ratio >= 0.9 && ratio <= 1.1) {
    return 'Within configured review band';
  }

  return 'Requires fairness review';
};

const getConfidenceLabel = (confidence) => {
  if (confidence === null) return 'Not provided';
  if (confidence >= 85) return 'High confidence';
  if (confidence >= 70) return 'Moderate confidence';
  return 'Low confidence';
};

const getConfidenceClass = (confidence) => {
  if (confidence === null) {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  if (confidence >= 85) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  if (confidence >= 70) {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }

  return 'bg-rose-100 text-rose-800 border-rose-200';
};

export default function FairnessReviewPage() {
  const { role } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [activeReview, setActiveReview] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const canReview = REVIEWER_ROLES.includes(role);

  const pendingCount = useMemo(
    () => reviews.filter((review) => getStatus(review) === 'pending').length,
    [reviews]
  );

  const completedCount = useMemo(
    () =>
      reviews.filter((review) =>
        ['approved', 'rejected', 'overridden'].includes(getStatus(review))
      ).length,
    [reviews]
  );

  const loadReviews = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const res = await fairnessAPI.getReviews({
        status: selectedStatus
      });

      if (!res?.data?.success) {
        throw new Error(
          res?.data?.message || 'Unable to load the fairness review queue.'
        );
      }

      const records = Array.isArray(res.data.data) ? res.data.data : [];

      setReviews(records);
    } catch (err) {
      console.error('[FairnessReview] Error loading reviews:', err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load fairness review records.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [selectedStatus]);

  const handleOpenDecisionModal = (review, defaultDecision = 'approved') => {
    if (!canReview) return;

    setActiveReview(review);
    setDecision(defaultDecision);
    setReason('');
    setFeedback('');
  };

  const handleSubmitDecision = async (event) => {
    event.preventDefault();

    if (!activeReview || !canReview) return;

    const trimmedReason = reason.trim();

    if (trimmedReason.length < 10) {
      setFeedback('Please provide a meaningful justification of at least 10 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setFeedback('');

      const reviewId = getId(activeReview);

      if (!reviewId) {
        throw new Error('This review does not have a valid identifier.');
      }

      const res = await fairnessAPI.submitDecision(reviewId, {
        decision,
        reason: trimmedReason
      });

      if (!res?.data?.success) {
        throw new Error(
          res?.data?.message || 'Failed to record the human review decision.'
        );
      }

      const updatedReview = getResponseReview(res);

      if (updatedReview) {
        const updatedId = getId(updatedReview);

        setReviews((previous) =>
          previous.map((review) =>
            getId(review) === updatedId ? updatedReview : review
          )
        );
      } else {
        await loadReviews(true);
      }

      setActiveReview(null);
      setReason('');

      setFeedback(
        `${formatStatus(decision)} decision recorded with the reviewer justification and audit trail.`
      );
    } catch (err) {
      console.error('[FairnessReview] Decision submission failed:', err);

      setFeedback(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to record the human review decision.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Governance & Ethics</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              Fairness & Evidence Review
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Assignment Fairness & Human Evidence Review
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl">
            AI recommendations remain advisory. Authorized staff must review
            evidence, fairness controls, and workforce impact before a material
            staffing decision is approved.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">
            Review Status:
          </label>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            disabled={loading}
            className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="All">All Reviews</option>
            <option value="pending">Pending Human Review</option>
            <option value="approved">Approved Decisions</option>
            <option value="rejected">Rejected Proposals</option>
            <option value="overridden">Manager Overrides</option>
          </select>

          <button
            type="button"
            onClick={() => loadReviews(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            title="Refresh review queue"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Access Notice */}
      {!canReview && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />

          <div>
            <p className="font-bold">
              Read-only governance view
            </p>
            <p className="mt-0.5">
              Your current role ({role || 'Unknown'}) can review available
              evidence but cannot approve, reject, or override recommendations.
              Human decision actions are restricted to authorized workforce
              governance roles.
            </p>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
            feedback.toLowerCase().includes('failed') ||
            feedback.toLowerCase().includes('unable') ||
            feedback.toLowerCase().includes('please provide')
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedback.toLowerCase().includes('failed') ||
          feedback.toLowerCase().includes('unable') ||
          feedback.toLowerCase().includes('please provide') ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}

          <span>{feedback}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />

          <div className="flex-1">
            <p className="font-bold">Unable to load fairness review data</p>
            <p className="mt-1">{error}</p>

            <button
              type="button"
              onClick={() => loadReviews(true)}
              className="mt-2 px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 font-semibold hover:bg-rose-100"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Fairness Compliance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">
              Pending Human Reviews
            </span>
            <UserCheck className="w-4 h-4 text-sky-600" />
          </div>

          <div className="text-2xl font-extrabold text-slate-900">
            {pendingCount}
          </div>

          <p className="text-[11px] text-amber-600 font-medium mt-1">
            Requires authorized human decision
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">
              Completed Reviews
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="text-2xl font-extrabold text-slate-900">
            {completedCount}
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            Decisions with recorded reviewer outcomes
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">
              Automated Employment Decisions
            </span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="text-2xl font-extrabold text-slate-900">
            0
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            High-impact staffing actions require human authorization
          </p>
        </div>
      </div>

      {/* Review Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-600" />
              Fairness Review Queue
            </h2>

            <p className="text-[11px] text-slate-500 mt-0.5">
              AI proposal → evidence review → human decision → audit record
            </p>
          </div>

          <span className="text-xs text-slate-500">
            {reviews.length} record{reviews.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
            Loading fairness review queue...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Scale className="w-8 h-8 mx-auto text-slate-300 mb-3" />

            <p className="text-sm font-semibold text-slate-700">
              No fairness review records found
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Try another status filter or refresh the review queue.
            </p>
          </div>
        ) : (
          reviews.map((review) => {
            const reviewId = getId(review);
            const status = getStatus(review);
            const isPending = status === 'pending';

            const confidence = getConfidence(review);
            const modelVersion = getModelVersion(review);
            const generatedAt = getTimestamp(review);
            const engineType = getEngineType(review);

            const observableFactors = getObservableFactors(review);
            const protectedAttributes = getProtectedAttributes(review);
            const fairnessRatio = getFairnessRatio(review);

            const lowConfidence =
              confidence !== null && confidence < 70;

            return (
              <div
                key={reviewId || `review-${Math.random()}`}
                className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition-all ${
                  isPending
                    ? 'border-sky-300 ring-1 ring-sky-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {review.recommendationType || 'Workforce Recommendation'}
                    </span>

                    <span className="text-xs font-bold text-slate-900">
                      {review.assignmentTitle || 'Unspecified Assignment'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : status === 'overridden'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Decision: {formatStatus(status)}
                    </span>

                    {confidence !== null && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getConfidenceClass(
                          confidence
                        )}`}
                      >
                        {confidence}% · {getConfidenceLabel(confidence)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Low Confidence Warning */}
                {lowConfidence && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />

                    <div>
                      <p className="font-bold">
                        Low-confidence model output
                      </p>

                      <p className="mt-0.5">
                        This recommendation should not be accepted without
                        additional evidence and careful human review.
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Proposal */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>AI / Model Proposal — Uncommitted</span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Advisory Only
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900">
                    {review.proposedAction || 'No proposed action supplied'}
                  </div>

                  <div className="text-xs text-slate-600 mt-1">
                    Target Educator:{' '}
                    <span className="font-semibold text-slate-800">
                      {review.candidateName || 'Not specified'}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Engine
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                        {engineType}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Model / Version
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                        {modelVersion}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Generated
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                        {generatedAt
                          ? formatDateTime(generatedAt)
                          : 'Timestamp unavailable'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence + Fairness */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-sky-600" />
                      <span>Observable Evidence</span>
                    </div>

                    {observableFactors.length > 0 ? (
                      <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                        {observableFactors.map((factor, index) => (
                          <li key={index}>{String(factor)}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        No explicit evidence was returned by the model.
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Fairness & Protected Attributes</span>
                    </div>

                    <div className="space-y-2 text-[11px] text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-800">
                          Excluded attributes:{' '}
                        </span>

                        {protectedAttributes.length > 0
                          ? protectedAttributes.join(', ')
                          : 'Not provided'}
                      </div>

                      <div>
                        <span className="font-semibold text-slate-800">
                          Demographic parity ratio:{' '}
                        </span>

                        {fairnessRatio !== null
                          ? fairnessRatio.toFixed(2)
                          : 'Not provided'}
                      </div>

                      <div
                        className={`inline-flex px-2 py-1 rounded-md font-semibold ${
                          fairnessRatio === null
                            ? 'bg-slate-100 text-slate-600'
                            : fairnessRatio >= 0.9 &&
                              fairnessRatio <= 1.1
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {getFairnessStatus(fairnessRatio)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500">
                      <Clock3 className="w-3.5 h-3.5" />
                      Confidence
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-900">
                      {confidence !== null
                        ? `${confidence}%`
                        : 'Not provided'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500">
                      <Database className="w-3.5 h-3.5" />
                      Source Snapshot
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-900">
                      {review.sourceDataSnapshot ||
                      review.sourceSnapshot ||
                      review.inputSnapshot
                        ? 'Available'
                        : 'Not provided'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500">
                      <UserCheck className="w-3.5 h-3.5" />
                      Human Review
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-900">
                      {isPending ? 'Required' : 'Completed'}
                    </div>
                  </div>
                </div>

                {/* Source Snapshot Details */}
                {(review.sourceDataSnapshot ||
                  review.sourceSnapshot ||
                  review.inputSnapshot) && (
                  <details className="rounded-xl border border-slate-200 bg-slate-50">
                    <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-700">
                      View source data snapshot
                    </summary>

                    <div className="px-4 pb-4">
                      <pre className="text-[10px] leading-relaxed whitespace-pre-wrap break-words text-slate-600 bg-white border border-slate-200 rounded-lg p-3 overflow-auto max-h-60">
                        {typeof (
                          review.sourceDataSnapshot ||
                          review.sourceSnapshot ||
                          review.inputSnapshot
                        ) === 'object'
                          ? JSON.stringify(
                              review.sourceDataSnapshot ||
                                review.sourceSnapshot ||
                                review.inputSnapshot,
                              null,
                              2
                            )
                          : String(
                              review.sourceDataSnapshot ||
                                review.sourceSnapshot ||
                                review.inputSnapshot
                            )}
                      </pre>
                    </div>
                  </details>
                )}

                {/* Reviewer Outcome */}
                {!isPending && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500 mb-1">
                      <span>
                        Reviewed by:{' '}
                        <strong className="text-slate-700">
                          {review.reviewerName || 'Authorized reviewer'}
                        </strong>
                      </span>

                      <span>
                        {review.reviewedAt || review.createdAt
                          ? formatDateTime(
                              review.reviewedAt || review.createdAt
                            )
                          : 'Timestamp unavailable'}
                      </span>
                    </div>

                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Human decision
                    </div>

                    <p className="text-xs font-semibold text-slate-900">
                      {formatStatus(status)}
                    </p>

                    {review.reviewerReason && (
                      <p className="text-xs text-slate-700 italic mt-1">
                        "{review.reviewerReason}"
                      </p>
                    )}
                  </div>
                )}

                {/* Action Controls */}
                {isPending && (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-amber-700 font-medium flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />

                      <span>
                        This recommendation remains uncommitted until an
                        authorized human reviewer records a decision.
                      </span>
                    </div>

                    {canReview ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenDecisionModal(review, 'rejected')
                          }
                          className="px-3.5 py-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors"
                        >
                          Reject Proposal
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenDecisionModal(review, 'overridden')
                          }
                          className="px-3.5 py-2 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold transition-colors"
                        >
                          Custom Override
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenDecisionModal(review, 'approved')
                          }
                          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-colors"
                        >
                          Accept & Authorize
                        </button>
                      </div>
                    ) : (
                      <span className="px-3 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold">
                        Read-only: reviewer authorization required
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Decision Modal */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="pr-4">
                <h3 className="text-base font-bold text-slate-900">
                  Record Human Review Decision
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Formalize the authorized decision for:{' '}
                  <strong className="text-slate-700">
                    {activeReview.candidateName || 'Selected candidate'}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveReview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close review decision dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4">
              {/* AI vs Human distinction */}
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-800">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Human-in-the-loop control
                </div>

                The model recommendation is advisory only. Your selected
                decision becomes the recorded business outcome after
                submission.
              </div>

              {/* Decision */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Decision Action
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('approved')}
                    className={`py-2.5 px-2 text-xs font-bold rounded-lg border text-center transition-colors ${
                      decision === 'approved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('rejected')}
                    className={`py-2.5 px-2 text-xs font-bold rounded-lg border text-center transition-colors ${
                      decision === 'rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('overridden')}
                    className={`py-2.5 px-2 text-xs font-bold rounded-lg border text-center transition-colors ${
                      decision === 'overridden'
                        ? 'bg-purple-50 border-purple-500 text-purple-900'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Override
                  </button>
                </div>
              </div>

              {/* Justification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Review Reason / Justification
                </label>

                <textarea
                  required
                  rows={5}
                  minLength={10}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain the decision using observable workforce evidence, student learning needs, capacity constraints, timetable requirements, or another legitimate institutional factor..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-y"
                />

                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">
                    Minimum 10 characters
                  </span>

                  <span
                    className={`text-[10px] ${
                      reason.trim().length >= 10
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {reason.trim().length} characters
                  </span>
                </div>
              </div>

              {/* Final warning */}
              {decision === 'overridden' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />

                  <span>
                    An override records a deliberate departure from the model
                    recommendation. Provide a specific, evidence-based reason.
                  </span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReview(null)}
                  disabled={submitting}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !canReview ||
                    reason.trim().length < 10
                  }
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}

                  {submitting
                    ? 'Recording...'
                    : 'Confirm Decision & Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
