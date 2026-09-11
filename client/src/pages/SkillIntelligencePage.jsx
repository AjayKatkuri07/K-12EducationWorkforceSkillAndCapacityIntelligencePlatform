
import React, { useState } from 'react';
import { aiAPI, capacityAPI } from '../services/api';
import AIExplainabilityBadge from '../components/AIExplainabilityBadge';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  RefreshCw,
  ShieldCheck,
  Clock3,
  Database,
  UserCheck,
  Info,
  TrendingUp,
  Users,
  GraduationCap,
  XCircle,
  Brain,
} from 'lucide-react';

export default function SkillIntelligencePage() {
  const [activeTab, setActiveTab] = useState('extractor');

  // ============================================================
  // SKILL EXTRACTION STATE
  // ============================================================
  const [inputText, setInputText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [extractionError, setExtractionError] = useState('');
  const [extractionStatus, setExtractionStatus] = useState('idle');

  // ============================================================
  // CAPACITY FORECAST STATE
  // ============================================================
  const [simCampus, setSimCampus] = useState('Oakridge High Campus');
  const [simEnrolment, setSimEnrolment] = useState(1480);
  const [simGrowth, setSimGrowth] = useState(9.2);
  const [simStaffFTE, setSimStaffFTE] = useState(68);
  const [simIEPCaseload, setSimIEPCaseload] = useState(155);

  const [forecasting, setForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastError, setForecastError] = useState('');
  const [forecastStatus, setForecastStatus] = useState('idle');

  // ============================================================
  // SAMPLE INPUTS
  // ============================================================
  const samplePresets = [
    {
      title: 'AP Calculus & Robotics Lead',
      text: `Dr. David Chen - 11 years secondary mathematics instruction.
Certified AP Calculus BC instructor by College Board with 98% student pass rate over 5 years.
Experienced robotics mentor utilizing Python, ROS, and Arduino for regional FIRST Robotics tournaments.
Skilled in differentiated instruction for mixed-readiness high school cohorts and designing rigorous formative assessments aligned with state standards.`,
    },
    {
      title: 'Special Education & Bilingual Specialist',
      text: `Maria Rodriguez, M.Ed.
State-licensed Special Education Specialist (K-12) with 9 years coordinating IEP case management and 504 compliance.
Certified CASEL Social-Emotional Learning (SEL) facilitator and trained in Trauma-Informed Classroom Practices.
Native bilingual Spanish speaker certified for dual-language instruction and parent translation outreach.
Certified Crisis Prevention Institute (CPI) de-escalation instructor.`,
    },
    {
      title: 'Elementary Literacy & PBIS Coach',
      text: `Emily Watson, 12 years elementary teaching experience.
Orton-Gillingham certified in early literacy phonics interventions and guided reading workshop models.
Campus coordinator for Positive Behavioral Interventions and Supports (PBIS Tier 1-3).
Tenured mentor teacher providing instructional coaching in guided math and small group differentiation.`,
    },
  ];

  // ============================================================
  // HELPERS
  // ============================================================
  const getConfidenceLabel = (score) => {
    const value = Number(score) || 0;

    if (value >= 90) return 'High Confidence';
    if (value >= 80) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  const getConfidenceClass = (score) => {
    const value = Number(score) || 0;

    if (value >= 90) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (value >= 80) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Not available';

    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return String(timestamp);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'insufficient_evidence':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'low_confidence':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Inference Completed';

      case 'insufficient_evidence':
        return 'Insufficient Evidence';

      case 'low_confidence':
        return 'Low Confidence';

      case 'failed':
        return 'Inference Failed';

      default:
        return 'Awaiting Analysis';
    }
  };

  // ============================================================
  // SKILL EXTRACTION
  // ============================================================
  const handleExtract = async () => {
    if (!inputText || inputText.trim().length < 10) {
      setExtractionError(
        'Please enter at least 10 characters or choose a sample credential text.'
      );
      setExtractionStatus('insufficient_evidence');
      return;
    }

    try {
      setExtracting(true);
      setExtractionError('');
      setExtractionResult(null);
      setExtractionStatus('loading');

      const res = await aiAPI.extractSkills(inputText);

      if (res?.data?.success) {
        const result = res.data.data || {};

        const skillCount = Array.isArray(result.skills)
          ? result.skills.length
          : 0;

        const confidence = Number(result.confidenceScore) || 0;

        let status = result.status || 'completed';

        if (skillCount === 0) {
          status = 'insufficient_evidence';
        } else if (confidence < 80) {
          status = 'low_confidence';
        } else {
          status = 'completed';
        }

        setExtractionResult({
          ...result,
          status,
        });

        setExtractionStatus(status);
      } else {
        const message =
          res?.data?.message || 'Skill inference failed.';

        setExtractionError(message);
        setExtractionStatus('failed');
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Skill inference failed. Please try again.';

      setExtractionError(message);
      setExtractionStatus('failed');
    } finally {
      setExtracting(false);
    }
  };

  // ============================================================
  // CAPACITY FORECAST
  // ============================================================
  const handleRunForecastSimulation = async () => {
    try {
      setForecasting(true);
      setForecastError('');
      setForecastResult(null);
      setForecastStatus('loading');

      const res = await capacityAPI.generateForecast({
        campus: simCampus,
        enrolment: simEnrolment,
        enrolmentGrowth: simGrowth,
        currentStaffFTE: simStaffFTE,
        iepInterventionCaseload: simIEPCaseload,
      });

      if (res?.data?.success) {
        const result = res.data.data || {};

        const confidence = Number(result.confidenceScore) || 0;

        let status = 'completed';

        if (confidence < 80) {
          status = 'low_confidence';
        }

        setForecastResult({
          ...result,
          status,
        });

        setForecastStatus(status);
      } else {
        const message =
          res?.data?.message || 'Forecasting simulation failed.';

        setForecastError(message);
        setForecastStatus('failed');
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Forecasting simulation failed. Please try again.';

      setForecastError(message);
      setForecastStatus('failed');
    } finally {
      setForecasting(false);
    }
  };

  const confidence = Number(extractionResult?.confidenceScore) || 0;
  const forecastConfidence =
    Number(forecastResult?.confidenceScore) || 0;

  return (
    <div className="space-y-6">
      {/* ========================================================
          HEADER
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>AI Decision Support</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              Generative Intelligence & Modeling
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Skill Intelligence & Capacity Forecasting Engine
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Explainable AI-assisted skill normalization and workforce
            capacity forecasting with human oversight.
          </p>
        </div>

        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('extractor')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'extractor'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            AI Skill Extractor
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('forecaster')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'forecaster'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            Capacity Forecast
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1 - SKILL INTELLIGENCE
      ======================================================== */}
      {activeTab === 'extractor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INPUT PANEL */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Educator Resume / Syllabus Input
                </span>

                <span className="text-[10px] text-slate-400">
                  Raw Unstructured Text
                </span>
              </div>

              <textarea
                rows={9}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setExtractionError('');

                  if (extractionStatus !== 'idle') {
                    setExtractionStatus('idle');
                  }
                }}
                placeholder="Paste teacher bio, syllabus excerpts, certifications, or observation notes..."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{inputText.trim().length} characters</span>

                <span>
                  Minimum required: 10 characters
                </span>
              </div>

              {extractionError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{extractionError}</span>
                </div>
              )}

              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                  Test with preset credentials:
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {samplePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(preset.text);
                        setExtractionError('');
                        setExtractionStatus('idle');
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 text-[11px] text-slate-700 font-medium transition-colors"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {extracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Extracting & normalising...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract & Normalise Skills
                  </>
                )}
              </button>
            </div>

            {/* GOVERNANCE */}
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
              <div className="flex gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />

                <div>
                  <div className="text-xs font-bold text-sky-900">
                    Responsible AI Control
                  </div>

                  <p className="text-[11px] text-sky-800 mt-1 leading-relaxed">
                    AI output is advisory. Skill inference does not
                    automatically change employee records, assignments,
                    compensation, or employment decisions. Authorized users
                    must review material workforce decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RESULTS */}
          <div className="lg:col-span-7 space-y-4">
            {extracting && (
              <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-8 text-center">
                <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />

                <div className="text-sm font-bold text-slate-900">
                  AI inference in progress
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Extracting skills, certifications, evidence, and
                  confidence information.
                </p>
              </div>
            )}

            {!extracting && extractionResult && (
              <>
                {/* STATUS */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {extractionStatus === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}

                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {getStatusLabel(extractionStatus)}
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Generated from the submitted source text
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${getConfidenceClass(
                          confidence
                        )}`}
                      >
                        {getConfidenceLabel(confidence)} · {confidence}%
                      </span>

                      <span
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${getStatusClass(
                          extractionStatus
                        )}`}
                      >
                        {getStatusLabel(extractionStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* LOW CONFIDENCE */}
                {confidence < 80 && (
                  <div className="flex items-start gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />

                    <div>
                      <div className="text-xs font-bold text-rose-800">
                        Low-confidence inference
                      </div>

                      <p className="text-[11px] text-rose-700 mt-1">
                        The AI result should not be treated as authoritative.
                        Review the source evidence and correct the result
                        before using it for workforce planning.
                      </p>
                    </div>
                  </div>
                )}

                {/* NO EVIDENCE */}
                {(!extractionResult.skills ||
                  extractionResult.skills.length === 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />

                      <div>
                        <div className="text-xs font-bold text-amber-900">
                          Insufficient evidence
                        </div>

                        <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                          The inference engine could not identify enough
                          observable evidence to confidently normalize skills.
                          Do not use this result for staffing or employee
                          decisions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* EXPLAINABILITY */}
                <AIExplainabilityBadge
                  confidenceScore={confidence}
                  modelVersion={
                    extractionResult.modelVersion || 'Unknown model'
                  }
                  timestamp={extractionResult.timestamp}
                  explanation={
                    extractionResult.conciseExplanation ||
                    'No explanation was returned by the inference engine.'
                  }
                  contributingInputs={[
                    `Source snapshot: ${
                      extractionResult.sourceTextSnapshot || 'Unavailable'
                    }`,
                    `Mapped ${
                      extractionResult.skills?.length || 0
                    } competencies into the governed K-12 taxonomy`,
                    'Inference based on observable source-text evidence',
                  ]}
                  excludedProtectedAttributes={[
                    'Age',
                    'Gender',
                    'Race',
                    'Marital/Family Status',
                  ]}
                />

                {/* AI METADATA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                      <Brain className="w-3.5 h-3.5 text-sky-600" />
                      Model
                    </div>

                    <div className="text-xs font-bold text-slate-900 mt-2 break-words">
                      {extractionResult.modelVersion || 'Unavailable'}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                      <Clock3 className="w-3.5 h-3.5 text-sky-600" />
                      Generated
                    </div>

                    <div className="text-xs font-bold text-slate-900 mt-2">
                      {formatTimestamp(extractionResult.timestamp)}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                      <Database className="w-3.5 h-3.5 text-sky-600" />
                      Source
                    </div>

                    <div className="text-xs font-bold text-slate-900 mt-2">
                      Snapshot captured
                    </div>
                  </div>
                </div>

                {/* SOURCE SNAPSHOT */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-500" />

                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Source Evidence Snapshot
                    </h3>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed break-words">
                    {extractionResult.sourceTextSnapshot ||
                      'No source snapshot returned.'}
                  </div>
                </div>

                {/* SKILLS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Normalized Skill Competencies (
                      {extractionResult.skills?.length || 0})
                    </h3>

                    {extractionResult.skills?.length > 0 && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Taxonomy Matched
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {extractionResult.skills?.map((skill, idx) => (
                      <div
                        key={`${skill.name || 'skill'}-${idx}`}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              {skill.name || 'Unnamed Skill'}
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {skill.category || 'Uncategorized'}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            <span className="font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded text-[10px]">
                              Level {skill.proficiency ?? '—'} / 5
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getConfidenceClass(
                                skill.confidence ?? 0
                              )}`}
                            >
                              {skill.confidence ?? '—'}% confidence
                            </span>
                          </div>
                        </div>

                        {skill.evidence && (
                          <div className="mt-2 flex items-start gap-2 text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />

                            <span>
                              <strong>Evidence:</strong>{' '}
                              {skill.evidence}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {!extractionResult.skills?.length && (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No evidence-backed normalized skills were returned.
                      </div>
                    )}
                  </div>
                </div>

                {/* CERTIFICATIONS */}
                {extractionResult.certifications?.length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-4 h-4 text-sky-600" />

                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Detected Certifications
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {extractionResult.certifications.map(
                        (cert, idx) => (
                          <div
                            key={`${cert.name || 'cert'}-${idx}`}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {cert.name || 'Unnamed Certification'}
                              </div>

                              <div className="text-[11px] text-slate-500">
                                {cert.issuer || 'Issuer not provided'}
                              </div>
                            </div>

                            <span className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                              {cert.status || 'Detected'}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* HUMAN REVIEW */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />

                    <div>
                      <div className="text-xs font-bold text-amber-900">
                        Human Review Required
                      </div>

                      <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                        This result is an AI recommendation only. An
                        authorized workforce or HR reviewer should validate
                        the evidence before inferred skills are used in an
                        allocation, learning, promotion, or staffing
                        decision.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-[10px] font-semibold text-amber-800">
                          AI Suggestion
                        </span>

                        <span className="text-[10px] text-amber-700 flex items-center">
                          →
                        </span>

                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
                          Human Validation
                        </span>

                        <span className="text-[10px] text-amber-700 flex items-center">
                          →
                        </span>

                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
                          Approved Decision
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!extracting && !extractionResult && (
              <div className="h-full min-h-[350px] bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center">
                <Sparkles className="w-8 h-8 text-slate-300 mb-2" />

                <span className="font-semibold text-sm text-slate-600">
                  Awaiting AI Input
                </span>

                <p className="max-w-xs mt-1 text-[11px] text-slate-400">
                  Paste credentials or choose a preset, then run the AI
                  extractor to generate explainable skill intelligence.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2 - CAPACITY FORECAST
      ======================================================== */}
      {activeTab === 'forecaster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INPUTS */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Enrolment & Demand Variables
              </h2>

              <p className="text-xs text-slate-500">
                Adjust demand assumptions and simulate required staffing
                capacity.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Target Campus
                </label>

                <select
                  value={simCampus}
                  onChange={(e) => setSimCampus(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                >
                  <option value="Oakridge High Campus">
                    Oakridge High Campus
                  </option>

                  <option value="Oakridge Middle Campus">
                    Oakridge Middle Campus
                  </option>

                  <option value="Lincoln Elementary Campus">
                    Lincoln Elementary Campus
                  </option>
                </select>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Projected Enrolment</span>

                  <span className="font-bold text-sky-700">
                    {simEnrolment} Students
                  </span>
                </div>

                <input
                  type="range"
                  min="400"
                  max="2000"
                  step="10"
                  value={simEnrolment}
                  onChange={(e) =>
                    setSimEnrolment(Number(e.target.value))
                  }
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Enrolment Growth Rate</span>

                  <span className="font-bold text-sky-700">
                    +{simGrowth}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={simGrowth}
                  onChange={(e) =>
                    setSimGrowth(Number(e.target.value))
                  }
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Active Staff Capacity</span>

                  <span className="font-bold text-sky-700">
                    {simStaffFTE} FTE
                  </span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={simStaffFTE}
                  onChange={(e) =>
                    setSimStaffFTE(Number(e.target.value))
                  }
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>IEP Caseload Volume</span>

                  <span className="font-bold text-sky-700">
                    {simIEPCaseload} Cases
                  </span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="250"
                  step="5"
                  value={simIEPCaseload}
                  onChange={(e) =>
                    setSimIEPCaseload(Number(e.target.value))
                  }
                  className="w-full accent-sky-600"
                />
              </div>

              {forecastError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forecastError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleRunForecastSimulation}
                disabled={forecasting}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {forecasting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Simulating Capacity...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Execute Predictive Forecast
                  </>
                )}
              </button>
            </div>
          </div>

          {/* OUTPUTS */}
          <div className="lg:col-span-7 space-y-4">
            {forecasting && (
              <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-8 text-center">
                <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />

                <div className="text-sm font-bold text-slate-900">
                  Forecast engine running
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Evaluating enrolment, staffing, IEP demand, and capacity
                  assumptions.
                </p>
              </div>
            )}

            {!forecasting && forecastResult && (
              <>
                {/* FORECAST STATUS */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {forecastStatus === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}

                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Forecast Completed
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Decision-support simulation for{' '}
                          {forecastResult.campus || simCampus}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${getConfidenceClass(
                          forecastConfidence
                        )}`}
                      >
                        {getConfidenceLabel(forecastConfidence)} ·{' '}
                        {forecastConfidence}%
                      </span>

                      <span className="px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold">
                        Advisory · Human Review
                      </span>
                    </div>
                  </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                    <Users className="w-4 h-4 mx-auto text-sky-600" />

                    <div className="text-[10px] text-slate-500 font-semibold uppercase mt-2">
                      Required Faculty
                    </div>

                    <div className="text-xl font-extrabold text-slate-900 mt-1">
                      {forecastResult.requiredStaffFTE ?? '—'} FTE
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Current: {forecastResult.currentStaffFTE ?? '—'} FTE
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                    <TrendingUp className="w-4 h-4 mx-auto text-rose-600" />

                    <div className="text-[10px] text-slate-500 font-semibold uppercase mt-2">
                      Capacity Gap
                    </div>

                    <div
                      className={`text-xl font-extrabold mt-1 ${
                        Number(forecastResult.deficitFTE) > 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {Number(forecastResult.deficitFTE) > 0
                        ? '+'
                        : ''}
                      {forecastResult.deficitFTE ?? 0} FTE
                    </div>

                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {forecastResult.deficitHours ?? 0} weekly hours
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                    <ShieldCheck className="w-4 h-4 mx-auto text-sky-600" />

                    <div className="text-[10px] text-slate-500 font-semibold uppercase mt-2">
                      Risk Profile
                    </div>

                    <div className="text-sm font-extrabold text-rose-700 mt-2 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 inline-block">
                      {forecastResult.riskLevel || 'Unknown'}
                    </div>
                  </div>
                </div>

                {/* EXPLAINABILITY */}
                <AIExplainabilityBadge
                  confidenceScore={forecastConfidence}
                  modelVersion={
                    forecastResult.modelVersion ||
                    'Decision-support model'
                  }
                  timestamp={forecastResult.timestamp}
                  explanation={
                    `The model estimates ${
                      forecastResult.requiredStaffFTE ?? '—'
                    } FTE required for ${
                      forecastResult.projectedEnrolment ?? simEnrolment
                    } projected students and ${
                      forecastResult.sourceDataSnapshot
                        ?.iepInterventionCaseload ??
                      simIEPCaseload
                    } IEP intervention cases.`
                  }
                  contributingInputs={
                    forecastResult.contributingInputs || [
                      `Projected enrolment: ${simEnrolment}`,
                      `Enrolment growth: ${simGrowth}%`,
                      `Current staff: ${simStaffFTE} FTE`,
                      `IEP caseload: ${simIEPCaseload}`,
                    ]
                  }
                />

                {/* CALCULATION LOGIC */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-sky-600" />

                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Forecast Calculation Logic
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500">
                        Student Demand
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {forecastResult.projectedEnrolment ??
                          simEnrolment}
                      </div>

                      <div className="text-[10px] text-slate-500 mt-1">
                        projected students
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500">
                        Current Supply
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {forecastResult.currentStaffFTE ??
                          simStaffFTE}{' '}
                        FTE
                      </div>

                      <div className="text-[10px] text-slate-500 mt-1">
                        available workforce
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500">
                        Required Supply
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {forecastResult.requiredStaffFTE ?? '—'} FTE
                      </div>

                      <div className="text-[10px] text-slate-500 mt-1">
                        estimated requirement
                      </div>
                    </div>
                  </div>
                </div>

                {/* SOURCE DATA */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-sky-600" />

                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Forecast Source Data Snapshot
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500">
                        Attendance
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {forecastResult.sourceDataSnapshot
                          ?.attendanceRate ?? '—'}
                        %
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500">
                        IEP Cases
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {forecastResult.sourceDataSnapshot
                          ?.iepInterventionCaseload ??
                          simIEPCaseload}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500">
                        Parent Response
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {forecastResult.sourceDataSnapshot
                          ?.parentResponseRate ?? '—'}
                        %
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500">
                        Benchmark
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {forecastResult.sourceDataSnapshot
                          ?.benchmarkRatio || '20:1'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CRITICAL SHORTAGES */}
                {forecastResult.criticalShortages?.length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />

                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Critical Skill / Capacity Shortages
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {forecastResult.criticalShortages.map(
                        (shortage, idx) => (
                          <div
                            key={`${shortage.area || 'shortage'}-${idx}`}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {shortage.area ||
                                  'Unspecified shortage'}
                              </div>

                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Urgency:{' '}
                                {shortage.urgency || 'Review'}
                              </div>
                            </div>

                            <span className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-700">
                              {shortage.shortageFTE ?? 0} FTE gap
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* RECOMMENDATIONS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Model Recommended Actions
                    </h3>

                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                      AI / Model Suggestion
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700">
                    {forecastResult.recommendations?.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>

                        <span>{rec}</span>
                      </li>
                    ))}

                    {!forecastResult.recommendations?.length && (
                      <li className="text-slate-500 text-[11px]">
                        No model recommendations were returned.
                      </li>
                    )}
                  </ul>
                </div>

                {/* FAIRNESS */}
                {forecastResult.fairnessAudit && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />

                      <div>
                        <div className="text-xs font-bold text-emerald-900">
                          Fairness & Governance Check
                        </div>

                        <p className="text-[11px] text-emerald-800 mt-1">
                          Forecasting uses observable workforce and demand
                          variables. Protected staff attributes are excluded
                          from the decision-support calculation.
                        </p>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {forecastResult.fairnessAudit
                            .protectedAttributesExcluded?.map(
                              (attribute, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-white/70 border border-emerald-200 rounded-lg text-[10px] font-semibold text-emerald-700"
                                >
                                  {attribute}
                                </span>
                              )
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* HUMAN APPROVAL */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />

                    <div>
                      <div className="text-xs font-bold text-amber-900">
                        Human Approval Required
                      </div>

                      <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                        Forecast recommendations are advisory. Workforce
                        planners and authorized managers must review demand
                        assumptions, operational constraints, and evidence
                        before approving staffing or allocation changes.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-[10px] font-semibold text-amber-800">
                          AI Forecast
                        </span>

                        <span className="text-[10px] text-amber-700 flex items-center">
                          →
                        </span>

                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
                          Planner Review
                        </span>

                        <span className="text-[10px] text-amber-700 flex items-center">
                          →
                        </span>

                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
                          Approved Workforce Plan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* METADATA */}
                <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Model:{' '}
                    {forecastResult.modelVersion || 'Unavailable'}
                  </span>

                  <span>
                    Generated:{' '}
                    {formatTimestamp(forecastResult.timestamp)}
                  </span>

                  <span>
                    Campus:{' '}
                    {forecastResult.campus || simCampus}
                  </span>

                  <span>
                    Status: Advisory / Pending Human Review
                  </span>
                </div>
              </>
            )}

            {!forecasting && !forecastResult && (
              <div className="h-full min-h-[350px] bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center">
                {forecastStatus === 'failed' ? (
                  <>
                    <XCircle className="w-8 h-8 text-rose-400 mb-2" />

                    <span className="font-semibold text-sm text-rose-700">
                      Forecast Failed
                    </span>

                    <p className="max-w-xs mt-1 text-[11px] text-slate-400">
                      Review the error message and try the forecast again.
                    </p>
                  </>
                ) : (
                  <>
                    <Sliders className="w-8 h-8 text-slate-300 mb-2" />

                    <span className="font-semibold text-sm text-slate-600">
                      Simulator Standby
                    </span>

                    <p className="max-w-xs mt-1 text-[11px] text-slate-400">
                      Adjust the demand variables and execute a forecast
                      to view capacity gaps, shortages, recommendations,
                      and model explainability.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
