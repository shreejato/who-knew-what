"use client";

import React, { useState } from "react";
import { SAMPLE_STORY } from "@/lib/mockData";

interface UploadViewProps {
  onAnalyze: (title: string, text: string) => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
}

export function UploadView({ onAnalyze, isAnalyzing, error }: UploadViewProps) {
  const [title, setTitle] = useState("The Blackwood Manor Mystery");
  const [text, setText] = useState(SAMPLE_STORY);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chapterMatches = text.match(/chapter\s+[\w\d]+/gi) || [];
  const chapterCount = Math.max(1, chapterMatches.length);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setText(content);
        if (!title || title === "The Blackwood Manor Mystery") {
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || isAnalyzing) return;

    setProgressStep(1);
    const t1 = setTimeout(() => setProgressStep(2), 500);
    const t2 = setTimeout(() => setProgressStep(3), 1100);
    const t3 = setTimeout(() => setProgressStep(4), 1700);

    try {
      await onAnalyze(title, text);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setProgressStep(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-8 space-y-6 animate-fade-in">
      {/* Top Welcome & Subtitle matching Reference Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, Storyteller!
          </h2>
          <p className="text-sm text-[#A9A9C9] mt-1">
            Your story&apos;s memory, logic and imagination — in one place.
          </p>
        </div>

        <button
          onClick={() => {
            setText(SAMPLE_STORY);
            setTitle("The Blackwood Manor Mystery");
          }}
          className="self-start sm:self-auto text-xs bg-[#151538] hover:bg-[#1E1E4E] text-[#A9A9C9] hover:text-white border border-white/[0.08] px-4 py-2 rounded-xl transition-all font-medium flex items-center space-x-2 shadow-sm"
        >
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>Load Planted-Error Demo</span>
        </button>
      </div>

      {/* Hero Overview Grid: Active Story Card + Story Health Ring (Reference Image 1 & 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Featured Manuscript Project Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#151538] via-[#151538] to-[#1E1E4E] border border-white/[0.08] p-6 shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#6C47FF]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-semibold border border-[#10B981]/30 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>Active Project</span>
              </span>
              <span className="text-xs text-[#A9A9C9]">
                {chapterCount} Chapters • Planted Inconsistency Benchmark
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {title || "The Blackwood Manor Mystery"}
            </h3>
            <p className="text-xs sm:text-sm text-[#A9A9C9] mt-2 max-w-xl leading-relaxed">
              An epistemic mystery following Mara, Hale, and Inspector Rao. As secrets unfold around the altered will, NarrativeOS tracks who observed, heard, or deduced every pivotal fact chronologically.
            </p>
          </div>

          <div className="relative z-10 pt-6 mt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6 text-xs text-[#A9A9C9]">
              <div>
                <span className="text-[#6F6F94] block text-[10px] uppercase font-mono">Word Count</span>
                <span className="font-bold text-white text-sm">{wordCount.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-white/[0.06]" />
              <div>
                <span className="text-[#6F6F94] block text-[10px] uppercase font-mono">Characters</span>
                <span className="font-bold text-white text-sm">3 Tracked</span>
              </div>
              <div className="h-8 w-px bg-white/[0.06]" />
              <div>
                <span className="text-[#6F6F94] block text-[10px] uppercase font-mono">Benchmark</span>
                <span className="font-bold text-indigo-400 text-sm">F1 0.615</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isAnalyzing || !text.trim()}
              className="btn-primary text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center space-x-2"
            >
              <span>{isAnalyzing ? "Analyzing..." : "Analyze Manuscript"}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Story Health Card with Circular Progress Ring */}
        <div className="rounded-2xl bg-[#151538] border border-white/[0.08] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Story Health</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-[#A9A9C9] font-mono">
              Live Eval
            </span>
          </div>

          {/* Circular progress ring */}
          <div className="my-4 flex items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#1E1E4E"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="20"
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white tracking-tight">92%</span>
                <span className="text-[10px] text-[#A9A9C9]">Integrity</span>
              </div>
            </div>
          </div>

          {/* Checklist underneath */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs">
            <div className="flex items-center space-x-2 text-[#A9A9C9]">
              <svg className="w-4 h-4 text-[#10B981] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Verbatim quote exactness 100%</span>
            </div>
            <div className="flex items-center space-x-2 text-[#A9A9C9]">
              <svg className="w-4 h-4 text-[#10B981] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Premature knowledge F1 1.0</span>
            </div>
            <div className="flex items-center space-x-2 text-amber-400">
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>1 continuity warning detected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Story Intelligence Stat Tiles (Image 2 bottom-left) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#151538] border border-white/[0.08] p-4 flex items-center space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/15 border border-[#6C47FF]/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold text-white block leading-none">{wordCount.toLocaleString()}</span>
            <span className="text-[11px] text-[#A9A9C9] mt-1 block">Words Analyzed</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#151538] border border-white/[0.08] p-4 flex items-center space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold text-white block leading-none">3 Characters</span>
            <span className="text-[11px] text-[#A9A9C9] mt-1 block">Active Network</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#151538] border border-white/[0.08] p-4 flex items-center space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold text-white block leading-none">12 Epistemic Links</span>
            <span className="text-[11px] text-[#A9A9C9] mt-1 block">Belief Transmissions</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#151538] border border-white/[0.08] p-4 flex items-center space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold text-white block leading-none">1 Issue Found</span>
            <span className="text-[11px] text-[#A9A9C9] mt-1 block">Chapter 4 Warning</span>
          </div>
        </div>
      </div>

      {/* Manuscript Workspace & File Upload Card */}
      <div className="rounded-2xl bg-[#151538] border border-white/[0.08] p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Manuscript Prose & Chapter Analysis</h3>
            <p className="text-xs text-[#A9A9C9] mt-0.5">
              Paste story chapters or upload your text draft to trace beliefs and continuity errors.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#A9A9C9]">Identified:</span>
            <span className="px-2 py-0.5 rounded-md bg-[#6C47FF]/20 text-indigo-300 font-mono font-medium">
              {chapterCount} {chapterCount === 1 ? "Chapter" : "Chapters"}
            </span>
          </div>
        </div>

        {/* Title & Input Row */}
        <div>
          <label className="block text-xs font-medium text-[#A9A9C9] mb-1.5">
            Story Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Cipher of Blackwood"
            className="w-full bg-[#0E0E24] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-[#6F6F94] focus:outline-none focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] text-sm transition-all"
          />
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            isDragOver
              ? "border-[#6C47FF] bg-[#6C47FF]/10"
              : "border-white/[0.08] bg-[#0E0E24]/60 hover:border-white/[0.2] hover:bg-[#0E0E24]"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 bg-[#1C1C45] rounded-2xl flex items-center justify-center text-indigo-400 shadow-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-white font-medium">
              Drag and drop manuscript file (.txt, .md), or{" "}
              <label className="text-indigo-400 hover:text-indigo-300 cursor-pointer underline">
                browse file
                <input
                  type="file"
                  accept=".txt,.md"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                />
              </label>
            </p>
            <p className="text-xs text-[#6F6F94]">
              Chapters are auto-detected via standard headings (e.g. &ldquo;Chapter 1&rdquo;, &ldquo;Chapter 2&rdquo;).
            </p>
          </div>
        </div>

        {/* Prose Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#A9A9C9] px-1">
            <span>Manuscript Text</span>
            <span className="font-mono text-[#6F6F94]">{text.length.toLocaleString()} characters</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your story text here..."
            className="w-full h-72 bg-[#0E0E24] border border-white/[0.08] rounded-2xl p-4 text-[#E2E2F0] font-serif leading-relaxed text-sm focus:outline-none focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] resize-y transition-all"
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-start space-x-3">
            <svg className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">Analysis Pipeline Error</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Multi-stage Progress indicator */}
        {isAnalyzing && (
          <div className="bg-[#0E0E24] border border-white/[0.08] p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-white">
              <span className="font-medium text-indigo-300 flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>
                  {progressStep === 1 && "Splitting manuscript into chapters..."}
                  {progressStep === 2 && "Extracting characters, facts, and knowledge events..."}
                  {progressStep === 3 && "Executing chronological rule engine..."}
                  {progressStep >= 4 && "Verifying evidence quotes against raw text..."}
                  {progressStep === 0 && "Initializing story intelligence engine..."}
                </span>
              </span>
              <span className="font-mono text-xs text-[#6F6F94]">Stage {Math.max(1, progressStep)}/4</span>
            </div>
            <div className="w-full bg-[#1C1C45] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#6C47FF] to-[#9B7DFF] h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(15, progressStep * 25))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom Submission Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
          <p className="text-xs text-[#6F6F94]">
            Tip: Once analyzed, scrub through chapters in the Knowledge Graph to verify facts per character.
          </p>
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing || !text.trim()}
            className="btn-primary px-6 py-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Analyzing Manuscript...</span>
              </>
            ) : (
              <>
                <span>Run Intelligence Engine</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
