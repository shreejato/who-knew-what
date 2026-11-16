"use client";

import React from "react";
import { AnalysisSource } from "@/lib/types";

interface HeaderProps {
  activeTab: "upload" | "graph" | "contradictions";
  onTabChange: (tab: "upload" | "graph" | "contradictions") => void;
  contradictionCount: number;
  manuscriptTitle: string;
  chapterCount: number;
  onOpenModelModal: () => void;
  extractorType?: "gemini" | "adapted";
  backendExtractor?: string;
  analysisSource: AnalysisSource;
  onReset?: () => void;
  isAnalyzing?: boolean;
}

export function Header({
  activeTab,
  onTabChange,
  contradictionCount,
  manuscriptTitle,
  chapterCount,
  onOpenModelModal,
  extractorType = "gemini",
  backendExtractor,
  analysisSource,
  onReset,
  isAnalyzing = false,
}: HeaderProps) {
  // Label model strictly truthfully based on backend /health report, never claiming an adapted model unless /health reports it
  const modelLabel =
    backendExtractor && backendExtractor.toLowerCase() === "adapted"
      ? "Adaption LoRA"
      : backendExtractor && backendExtractor.toLowerCase().includes("gemini")
      ? `${backendExtractor.charAt(0).toUpperCase() + backendExtractor.slice(1)} baseline`
      : "Gemini baseline";

  // Data source badge label & styling
  const getSourceBadge = () => {
    switch (analysisSource) {
      case "live":
        return {
          label: "Live analysis",
          classes: "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30",
          dot: "bg-[#10B981]",
        };
      case "cached":
        return {
          label: "Cached analysis",
          classes: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
          dot: "bg-cyan-400",
        };
      case "mock":
      default:
        return {
          label: "Built-in sample (mock)",
          classes: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          dot: "bg-amber-400",
        };
    }
  };

  const sourceBadge = getSourceBadge();
  return (
    <header className="border-b border-white/[0.08] bg-[#0E0E24]/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Project title & manuscript thumbnail */}
        <div className="flex items-center space-x-3.5">
          <div
            onClick={onReset}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6C47FF] via-[#7C5CFF] to-[#9B7DFF] p-[1px] shadow-lg shadow-[#6C47FF]/25 cursor-pointer shrink-0 transition-transform hover:scale-105"
          >
            <div className="w-full h-full bg-[#151538] rounded-[11px] flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {manuscriptTitle || "The Blackwood Manor Mystery"}
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-medium border border-[#10B981]/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>Active Project</span>
              </span>
            </div>
            <p className="text-xs text-[#A9A9C9] mt-0.5 flex items-center space-x-2">
              <span>{chapterCount} {chapterCount === 1 ? "Chapter" : "Chapters"}</span>
              <span className="text-[#6F6F94]">•</span>
              <span>Epistemic Reasoning Engine</span>
            </p>
          </div>
        </div>

        {/* Center / Navigation Pills (Tablet / Mobile friendly) */}
        <div className="flex items-center bg-[#151538] p-1 rounded-xl border border-white/[0.08] text-xs self-start md:self-auto">
          <button
            onClick={() => onTabChange("upload")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "upload"
                ? "bg-[#6C47FF] text-white shadow-md shadow-[#6C47FF]/30"
                : "text-[#A9A9C9] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Manuscript</span>
          </button>

          <button
            onClick={() => onTabChange("graph")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "graph"
                ? "bg-[#6C47FF] text-white shadow-md shadow-[#6C47FF]/30"
                : "text-[#A9A9C9] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Knowledge Graph</span>
          </button>

          <button
            onClick={() => onTabChange("contradictions")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "contradictions"
                ? "bg-[#6C47FF] text-white shadow-md shadow-[#6C47FF]/30"
                : "text-[#A9A9C9] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Contradictions</span>
            {contradictionCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                {contradictionCount}
              </span>
            )}
          </button>
        </div>

        {/* Right side: Status, Extractor & Avatar */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Honest Data Source Badge */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${sourceBadge.classes}`}
            title="Truthful pipeline status of data currently presented"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sourceBadge.dot}`} />
            <span>{sourceBadge.label}</span>
          </div>

          {/* Analysis Status */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#151538] border border-white/[0.08] text-xs">
            <div className={`w-2 h-2 rounded-full ${isAnalyzing ? "bg-amber-400 animate-ping" : "bg-[#10B981]"}`} />
            <span className="text-[#A9A9C9]">
              {isAnalyzing ? "Analyzing Plot..." : "Story Analysed"}
            </span>
          </div>

          {/* Model Extractor Trigger */}
          <button
            onClick={onOpenModelModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#151538] border border-white/[0.08] hover:border-[#6C47FF]/50 text-xs text-[#A9A9C9] hover:text-white transition-all shadow-sm"
            title="Click to view fine-tuned model evaluation comparison"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#6C47FF]" />
            <span className="font-medium text-white">
              {modelLabel}
            </span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onReset}
            className="btn-primary text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Project</span>
          </button>

          {/* Avatar with initials */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6C47FF] to-[#9B7DFF] p-[1.5px] shadow-sm cursor-pointer shrink-0">
            <div className="w-full h-full bg-[#151538] rounded-full flex items-center justify-center text-xs font-bold text-white hover:text-indigo-200 transition-colors">
              TL
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
