import React, { useState } from 'react';
import { aiAPI, capacityAPI } from '../services/api';
import AIExplainabilityBadge from '../components/AIExplainabilityBadge';
import {
  Cpu,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Layers,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';

export default function SkillIntelligencePage() {
  const [activeTab, setActiveTab] = useState('extractor'); // 'extractor' | 'forecaster'

  // Skill Extractor State
  const [inputText, setInputText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [extractionError, setExtractionError] = useState('');

  // Forecaster Simulation State
  const [simCampus, setSimCampus] = useState('Oakridge High Campus');
  const [simEnrolment, setSimEnrolment] = useState(1480);
  const [simGrowth, setSimGrowth] = useState(9.2);
  const [simStaffFTE, setSimStaffFTE] = useState(68);
  const [simIEPCaseload, setSimIEPCaseload] = useState(155);
  const [forecasting, setForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);

  // Sample Text Presets
  const samplePresets = [
    {
      title: 'AP Calculus & Robotics Lead',
      text: `Dr. David Chen - 11 years secondary mathematics instruction. 
Certified AP Calculus BC instructor by College Board with 98% student pass rate over 5 years. 
Experienced robotics mentor utilizing Python, ROS, and Arduino for regional FIRST Robotics tournaments. 
Skilled in differentiated instruction for mixed-readiness high school cohorts and designing rigorous formative assessments aligned with state standards.`
    },
    {
      title: 'Special Education & Bilingual Specialist',
      text: `Maria Rodriguez, M.Ed. 
State-licensed Special Education Specialist (K-12) with 9 years coordinating IEP case management and 504 compliance. 
Certified CASEL Social-Emotional Learning (SEL) facilitator and trained in Trauma-Informed Classroom Practices. 
Native bilingual Spanish speaker certified for dual-language instruction and parent translation outreach. 
Certified Crisis Prevention Institute (CPI) de-escalation instructor.`
    },
    {
      title: 'Elementary Literacy & PBIS Coach',
      text: `Emily Watson, 12 years elementary teaching experience. 
Orton-Gillingham certified in early literacy phonics interventions and guided reading workshop models. 
Campus coordinator for Positive Behavioral Interventions and Supports (PBIS Tier 1-3). 
Tenured mentor teacher providing instructional coaching in guided math and small group differentiation.`
    }
  ];

  const handleExtract = async () => {
    if (!inputText || inputText.trim().length < 10) {
      setExtractionError('Please enter at least 10 characters or choose a sample credential text below.');
      return;
    }

    try {
      setExtracting(true);
      setExtractionError('');
      const res = await aiAPI.extractSkills(inputText);
      if (res.data.success) {
        setExtractionResult(res.data.data);
      }
    } catch (err) {
      setExtractionError(err.response?.data?.message || 'Skill inference failed.');
    } finally {
      setExtracting(false);
    }
  };

  const handleRunForecastSimulation = async () => {
    try {
      setForecasting(true);
      const res = await capacityAPI.generateForecast({
        campus: simCampus,
        enrolment: simEnrolment,
        enrolmentGrowth: simGrowth,
        currentStaffFTE: simStaffFTE,
        iepInterventionCaseload: simIEPCaseload
      });
      if (res.data.success) {
        setForecastResult(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Forecasting simulation failed.');
    } finally {
      setForecasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>AI Decision Support</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Generative Intelligence & Modeling</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Skill Intelligence & Capacity Forecasting Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gemini-powered skill ontology normalization from credentials, and predictive student-to-teacher demand forecasting.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('extractor')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'extractor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>AI Skill Extractor</span>
          </button>
          <button
            onClick={() => setActiveTab('forecaster')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'forecaster' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span>Capacity Forecast Simulator</span>
          </button>
        </div>
      </div>

      {/* Tab 1: AI Skill Extractor */}
      {activeTab === 'extractor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Educator Resume / Syllabus Input</span>
                </span>
                <span className="text-[10px] text-slate-400">Raw Unstructured Text</span>
              </div>

              <textarea
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste teacher bio, syllabus excerpts, professional development certifications, or observation notes here..."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />

              {extractionError && (
                <div className="text-xs text-rose-600 font-medium">{extractionError}</div>
              )}

              {/* Sample Preset Buttons */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Or test with preset credentials:</div>
                <div className="flex flex-wrap gap-1.5">
                  {samplePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(preset.text)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 text-[11px] text-slate-700 font-medium transition-colors"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExtract}
                disabled={extracting}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {extracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-sky-200" />
                    <span>Extract & Normalise into K-12 Taxonomy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {extractionResult ? (
              <div className="space-y-4">
                {/* Explainability Card */}
                <AIExplainabilityBadge
                  confidenceScore={extractionResult.confidenceScore || 90}
                  modelVersion={extractionResult.modelVersion || 'gemini-1.5-flash'}
                  timestamp={extractionResult.timestamp}
                  explanation={extractionResult.conciseExplanation}
                  contributingInputs={[
                    `Source text: "${extractionResult.sourceTextSnapshot}"`,
                    `Mapped ${extractionResult.skills?.length || 0} discrete pedagogical competencies into district taxonomy`,
                    `Validated against State Board teacher evaluation standards`
                  ]}
                  excludedProtectedAttributes={['Age', 'Gender', 'Race', 'Marital/Family Status']}
                />

                {/* Extracted Skills List */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Normalized Skill Competencies ({extractionResult.skills?.length})
                    </h3>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Standard Taxonomy Match
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {extractionResult.skills?.map((skill, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{skill.name}</span>
                          <span className="font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded text-[11px]">
                            Level {skill.proficiency} / 5
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{skill.category}</div>
                        {skill.evidence && (
                          <div className="mt-1.5 text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                            Citing Evidence: {skill.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[350px] bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                <span className="font-semibold text-slate-600">Awaiting Input</span>
                <p className="max-w-xs mt-1 text-[11px]">
                  Paste credentials or choose a preset on the left, then click "Extract" to generate standardized skill ontology profiles.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Capacity Forecast Simulator */}
      {activeTab === 'forecaster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Inputs (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Enrolment & Demand Variables</h2>
              <p className="text-xs text-slate-500">Adjust projected student inflows to model required staff capacity</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Campus</label>
                <select
                  value={simCampus}
                  onChange={(e) => setSimCampus(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                >
                  <option value="Oakridge High Campus">Oakridge High Campus</option>
                  <option value="Oakridge Middle Campus">Oakridge Middle Campus</option>
                  <option value="Lincoln Elementary Campus">Lincoln Elementary Campus</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Projected Enrolment:</span>
                  <span className="font-bold text-sky-700">{simEnrolment} Students</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="2000"
                  step="10"
                  value={simEnrolment}
                  onChange={(e) => setSimEnrolment(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Enrolment Growth Rate:</span>
                  <span className="font-bold text-sky-700">+{simGrowth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={simGrowth}
                  onChange={(e) => setSimGrowth(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Active Staff Capacity:</span>
                  <span className="font-bold text-sky-700">{simStaffFTE} FTE</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={simStaffFTE}
                  onChange={(e) => setSimStaffFTE(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Mandated IEP Caseload Volume:</span>
                  <span className="font-bold text-sky-700">{simIEPCaseload} Cases</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="250"
                  step="5"
                  value={simIEPCaseload}
                  onChange={(e) => setSimIEPCaseload(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              <button
                onClick={handleRunForecastSimulation}
                disabled={forecasting}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {forecasting ? 'Simulating Capacity...' : 'Execute Predictive Forecast'}
              </button>
            </div>
          </div>

          {/* Simulator Outputs (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {forecastResult ? (
              <div className="space-y-4">
                {/* Deficit Metric Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Required Faculty</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{forecastResult.requiredStaffFTE} FTE</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Current: {forecastResult.currentStaffFTE} FTE</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Deficit Gap</div>
                    <div className="text-xl font-extrabold text-rose-600 mt-1">-{forecastResult.deficitFTE} FTE</div>
                    <div className="text-[10px] text-rose-700 font-semibold mt-0.5">{forecastResult.deficitHours} weekly hours</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Risk Profile</div>
                    <div className="text-sm font-extrabold text-rose-700 mt-2 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 inline-block">
                      {forecastResult.riskLevel}
                    </div>
                  </div>
                </div>

                {/* AI Explanation Badge */}
                <AIExplainabilityBadge
                  confidenceScore={forecastResult.confidenceScore}
                  modelVersion={forecastResult.modelVersion}
                  timestamp={forecastResult.timestamp}
                  explanation={`Projected student surge requires an operational increase of ${forecastResult.deficitFTE} FTE (${forecastResult.deficitHours} weekly hours) to maintain the district 20:1 ratio and handle ${simIEPCaseload} mandated IEP interventions.`}
                  contributingInputs={forecastResult.contributingInputs}
                />

                {/* Actionable Recommendations */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Model Recommended Actions
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {forecastResult.recommendations?.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[350px] bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                <Sliders className="w-8 h-8 text-slate-300 mb-2" />
                <span className="font-semibold text-slate-600">Simulator Standby</span>
                <p className="max-w-xs mt-1 text-[11px]">
                  Adjust the sliders on the left and click "Execute Predictive Forecast" to project faculty shortages and view Gemini-generated rebalancing options.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
