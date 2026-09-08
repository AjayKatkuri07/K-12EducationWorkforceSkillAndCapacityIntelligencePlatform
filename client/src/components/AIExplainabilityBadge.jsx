import React, { useState } from 'react';
import { Sparkles, Info, ShieldCheck, ChevronDown, ChevronUp, Clock, FileCheck } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export default function AIExplainabilityBadge({
  confidenceScore = 90,
  modelVersion = 'gemini-1.5-flash',
  timestamp = new Date().toISOString(),
  explanation = '',
  contributingInputs = [],
  excludedProtectedAttributes = ['Age', 'Gender', 'Race/Ethnicity', 'Protected personal status'],
  onApprove = null,
  onReject = null,
  onOverride = null,
  status = 'pending' // 'pending' | 'approved' | 'rejected' | 'overridden'
}) {
  const [expanded, setExpanded] = useState(false);

  const getConfidenceBadge = (score) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 75) return 'bg-sky-50 text-sky-700 border-sky-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 shadow-md">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">AI Intelligence Evidence</span>
              <span className="text-[10px] text-slate-400 font-mono">v{modelVersion}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Generated {formatDateTime(timestamp)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getConfidenceBadge(confidenceScore)}`}>
            <span>Confidence:</span>
            <span>{confidenceScore}%</span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Detailed Audit Breakdown"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Summary Explanation */}
      <div className="pt-3 text-xs text-slate-300 leading-relaxed">
        <p className="font-normal">{explanation}</p>
      </div>

      {/* Expandable Evidence & Fairness Drawer */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
          {/* Contributing Inputs */}
          {contributingInputs.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Observable Contributing Factors</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-300 pl-2">
                {contributingInputs.map((input, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-sky-400 font-bold">•</span>
                    <span>{input}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fairness & Protected Attribute Exclusion */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fairness & Neutrality Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Protected demographic attributes strictly excluded: <span className="text-slate-300">{excludedProtectedAttributes.join(', ')}</span>.
              Recommendation relies entirely on demonstrated credentials, verifiable student outcomes, and contracted hours.
            </p>
          </div>
        </div>
      )}

      {/* Human Review Action Buttons (if actionable) */}
      {(onApprove || onReject || onOverride) && (
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Human review required before implementation</span>
          </div>

          <div className="flex items-center gap-2">
            {onReject && (
              <button
                onClick={onReject}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800 transition-colors"
              >
                Reject
              </button>
            )}
            {onOverride && (
              <button
                onClick={onOverride}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800 transition-colors"
              >
                Override AI...
              </button>
            )}
            {onApprove && (
              <button
                onClick={onApprove}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition-colors"
              >
                Approve Allocation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
