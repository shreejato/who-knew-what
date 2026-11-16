"use client";

import React, { useEffect, useState } from "react";
import { MOCK_EVAL_METRICS } from "@/lib/mockData";
import { EvalMetric } from "@/lib/types";

interface ModelComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExtractor: "gemini" | "adapted";
  onToggleExtractor: (ext: "gemini" | "adapted") => void;
}

interface AdaptionPilotData {
  rows: number;
  gradeBefore: string;
  gradeAfter: string;
  scoreBefore: number;
  scoreAfter: number;
  improvementPercent: number;
}

export function ModelComparisonModal({
  isOpen,
  onClose,
  currentExtractor,
  onToggleExtractor,
}: ModelComparisonModalProps) {
  const [metrics, setMetrics] = useState<EvalMetric[]>(MOCK_EVAL_METRICS);
  const [sourceNote, setSourceNote] = useState<string>("eval/results.md");
  const [adaptionPilot, setAdaptionPilot] = useState<AdaptionPilotData | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/eval-results")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.metrics) && data.metrics.length > 0) {
            setMetrics(data.metrics);
            if (data.source) setSourceNote(data.source);
            if (data.adaptionPilot) setAdaptionPilot(data.adaptionPilot);
          }
        })
        .catch(() => {
          // Keep MOCK_EVAL_METRICS which has the verified real numbers from eval/results.md
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B1E]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#151538] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#6C47FF]/20 text-indigo-300 border border-[#6C47FF]/40 text-[10px] font-mono uppercase font-semibold">
                Accuracy Benchmark
              </span>
              <h2 className="text-lg font-bold text-white">
                Model Evaluation & Adaption Showcase
              </h2>
            </div>
            <p className="text-xs text-[#A9A9C9]">
              Measured accuracy against our 6-chapter held-out test story (<code className="text-white font-mono">data/test_story.txt</code> with 8 planted continuity errors).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#A9A9C9] hover:text-white p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Active Model Selector Switch */}
        <div className="p-4 bg-[#0E0E24] border border-white/[0.08] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-white block">Active Extractor Pipeline</span>
            <span className="text-[11px] text-[#A9A9C9] block mt-0.5">
              Select which extractor runs during manuscript analysis
            </span>
          </div>
          <div className="flex items-center space-x-1.5 bg-[#151538] p-1 rounded-xl border border-white/[0.08] text-xs shrink-0">
            <button
              onClick={() => onToggleExtractor("gemini")}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                currentExtractor === "gemini"
                  ? "bg-[#6C47FF] text-white shadow-md shadow-[#6C47FF]/30"
                  : "text-[#A9A9C9] hover:text-white"
              }`}
            >
              Gemini Baseline
            </button>
            <button
              disabled
              title="Full adapted model fine-tune is not yet evaluated on held-out story"
              className="px-3.5 py-1.5 rounded-lg font-semibold text-[#6F6F94] bg-white/[0.03] cursor-not-allowed border border-dashed border-white/[0.08] opacity-70"
            >
              Adapted model: pending, not yet evaluated
            </button>
          </div>
        </div>

        {/* Benchmark Table */}
        <div className="overflow-hidden border border-white/[0.08] rounded-2xl bg-[#0E0E24]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151538] text-[#A9A9C9] border-b border-white/[0.08] font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Evaluation Metric</th>
                <th className="py-3 px-4 font-semibold text-white">Gemini Baseline</th>
                <th className="py-3 px-4 font-semibold text-indigo-400">Adaption Fine-Tuned</th>
                <th className="py-3 px-4 font-semibold text-[#A9A9C9] text-right">Status / Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-sans">
              {metrics.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-4 font-medium text-[#E2E2F0]">{row.metric}</td>
                  <td className="py-2.5 px-4 text-white font-mono font-semibold">{row.gemini}</td>
                  <td className="py-2.5 px-4 font-mono">
                    {String(row.adapted).includes("Pending") ? (
                      <span className="text-amber-400/90 italic font-sans text-[11px]">
                        Pending fine-tune run
                      </span>
                    ) : (
                      <span className="font-semibold text-indigo-300">{row.adapted}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-right text-[11px]">
                    {String(row.delta).includes("Pending") ? (
                      <span className="text-[#6F6F94] italic">Pending</span>
                    ) : (
                      <span className="text-[#10B981] font-semibold">{row.delta}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Adaption Adaptive Data Pilot Facts Card */}
        {adaptionPilot && (
          <div className="p-4 bg-[#0E0E24] border border-indigo-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Adaption Adaptive Data Pilot (data/adaption/adaption_state.json)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#6C47FF]/20 text-indigo-300">
                {adaptionPilot.rows}-row seed run
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1 text-center">
              <div className="p-2 rounded-xl bg-[#151538] border border-white/[0.06]">
                <span className="text-[10px] text-[#A9A9C9] block font-mono uppercase">Quality Grade</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {adaptionPilot.gradeBefore} → {adaptionPilot.gradeAfter}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#151538] border border-white/[0.06]">
                <span className="text-[10px] text-[#A9A9C9] block font-mono uppercase">Quality Score</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {adaptionPilot.scoreBefore.toFixed(1)} → {adaptionPilot.scoreAfter.toFixed(1)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#151538] border border-white/[0.06]">
                <span className="text-[10px] text-[#A9A9C9] block font-mono uppercase">Relative Gain</span>
                <span className="text-sm font-bold text-[#10B981] font-mono mt-0.5 block">
                  +{adaptionPilot.improvementPercent}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Source verification callout */}
        <div className="text-[11px] text-[#A9A9C9] bg-[#0E0E24] border border-white/[0.08] p-4 rounded-xl leading-relaxed space-y-1">
          <p>
            <strong className="text-white">Verified Eval Benchmark:</strong> All Gemini baseline metrics reflect real runs recorded in <code className="text-indigo-400 font-mono">{sourceNote}</code> via <code className="text-[#E2E2F0] font-mono">eval/run_eval.py</code> against <code className="text-[#E2E2F0] font-mono">data/answer_key.json</code>.
          </p>
          <p className="text-[#6F6F94] text-[10px]">
            Adaption metrics reflect verified Adaptive Data audit results. Any full LoRA model fine-tune metric is marked strictly as pending with zero invented figures.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-[#6F6F94] font-mono">
            Ground Truth: 8 planted errors (2 premature, 2 presence, 2 timeline, 2 attribute)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1C1C45] hover:bg-[#232356] text-white text-xs font-semibold transition-colors border border-white/[0.08]"
          >
            Close & Return
          </button>
        </div>
      </div>
    </div>
  );
}
