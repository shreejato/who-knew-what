"use client";

import React from "react";
import { MOCK_EVAL_METRICS } from "@/lib/mockData";

interface ModelComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExtractor: "gemini" | "adapted";
  onToggleExtractor: (ext: "gemini" | "adapted") => void;
}

export function ModelComparisonModal({
  isOpen,
  onClose,
  currentExtractor,
  onToggleExtractor,
}: ModelComparisonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 text-[10px] font-mono uppercase font-semibold">
                Adaption Labs Evaluation
              </span>
              <h2 className="text-lg font-bold text-zinc-100">
                Model Performance & Fine-Tuning Showcase
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Benchmarking the Gemini baseline against our Adaption-specialized story continuity extractor.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Active Model Selector Switch */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Active Extraction Pipeline</span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">
              Choose which engine generates structured character knowledge & quotes
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => onToggleExtractor("gemini")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentExtractor === "gemini"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Gemini Baseline
            </button>
            <button
              onClick={() => onToggleExtractor("adapted")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentExtractor === "adapted"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Adaption Fine-Tuned
            </button>
          </div>
        </div>

        {/* Benchmark Table */}
        <div className="overflow-hidden border border-zinc-800 rounded-2xl bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Evaluation Metric</th>
                <th className="py-3 px-4 font-semibold">Gemini Baseline</th>
                <th className="py-3 px-4 font-semibold text-indigo-400">Adaption Extractor</th>
                <th className="py-3 px-4 font-semibold text-emerald-400 text-right">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {MOCK_EVAL_METRICS.map((row, i) => (
                <tr key={i} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-zinc-300">{row.metric}</td>
                  <td className="py-3 px-4 text-zinc-400 font-mono">{row.gemini}</td>
                  <td className="py-3 px-4 font-semibold text-indigo-300 font-mono">
                    {row.adapted}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-mono font-semibold text-right">
                    {row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why this matters callout */}
        <div className="text-[11px] text-zinc-400 bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-xl leading-relaxed">
          <strong className="text-zinc-200">How Adaption Solves Extraction Hallucinations:</strong> Fiction continuity requires 100% verbatim quote fidelity. By training on curated public-domain fiction via Adaption’s <code className="text-indigo-300 font-mono">Invent-a-Dataset</code> pipeline, our adapted extractor eliminates fabricated quotes and enforces strict JSON contract schema reliability.
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Close & Return
          </button>
        </div>
      </div>
    </div>
  );
}
