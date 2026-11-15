"use client";

import React from "react";

interface HeaderProps {
  activeTab: "upload" | "graph" | "contradictions";
  onTabChange: (tab: "upload" | "graph" | "contradictions") => void;
  contradictionCount: number;
  manuscriptTitle: string;
  chapterCount: number;
  onOpenModelModal: () => void;
  extractorType?: "gemini" | "adapted";
  onReset?: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  contradictionCount,
  manuscriptTitle,
  chapterCount,
  onOpenModelModal,
  extractorType = "gemini",
  onReset,
}: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-zinc-100 tracking-tight">
                Narrative<span className="text-indigo-400">OS</span>
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                v0.5 MVP
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              The Story Intelligence Engine
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center space-x-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-sm">
          <button
            onClick={() => onTabChange("upload")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "upload"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Manuscript</span>
          </button>
          <button
            onClick={() => onTabChange("graph")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "graph"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Knowledge Graph</span>
            {chapterCount > 0 && (
              <span className="text-xs px-1.5 py-0.2 rounded bg-black/30 text-indigo-100">
                Ch. 1–{chapterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange("contradictions")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "contradictions"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Contradictions</span>
            {contradictionCount > 0 && (
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 font-bold border border-rose-800/60">
                {contradictionCount}
              </span>
            )}
          </button>
        </nav>

        {/* Status & Model Badges */}
        <div className="flex items-center space-x-2">
          {/* Extractor Badge */}
          <button
            onClick={onOpenModelModal}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 transition-colors text-xs text-zinc-300 group"
            title="Click to view fine-tuned model evaluation comparison"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-zinc-400">Extractor:</span>
            <span className="font-semibold text-indigo-400 group-hover:underline">
              {extractorType === "adapted" ? "Adaption Fine-Tuned" : "Gemini Baseline"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
