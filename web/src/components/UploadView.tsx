"use client";

import React, { useState, useTransition } from "react";
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
    
    // Simulate multi-stage pipeline animation while analyze runs
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Intro hero banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Manuscript Analysis Workspace</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Upload your fiction draft. NarrativeOS extracts characters, tracks who knows which fact
              chronologically, and uncovers plot inconsistencies with verbatim text evidence.
            </p>
          </div>
          <button
            onClick={() => {
              setText(SAMPLE_STORY);
              setTitle("The Blackwood Manor Mystery");
            }}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center space-x-1.5 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Load Demo Story</span>
          </button>
        </div>
      </div>

      {/* Title & Metadata row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Manuscript Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Cipher of Blackwood"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Draft Metrics
          </label>
          <div className="flex items-center space-x-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300">
            <div>
              <span className="text-zinc-500 block">Words</span>
              <span className="font-semibold text-zinc-200">{wordCount.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <div>
              <span className="text-zinc-500 block">Chapters</span>
              <span className="font-semibold text-indigo-400">{chapterCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & drop dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          isDragOver
            ? "border-indigo-500 bg-indigo-950/20"
            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-zinc-800 rounded-full text-zinc-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm text-zinc-300 font-medium">
            Drag and drop your manuscript (.txt) here, or{" "}
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
          <p className="text-xs text-zinc-500">
            Chapters identified automatically via standard "Chapter 1", "Chapter 2" headings.
          </p>
        </div>
      </div>

      {/* Manuscript editor area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>Manuscript Prose</span>
          <span>{text.length.toLocaleString()} characters</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste full manuscript or chapter text here..."
          className="w-full h-80 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-zinc-200 font-serif leading-relaxed text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-sm flex items-start space-x-3">
          <svg className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">Analysis Failed</p>
            <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Progress state */}
      {isAnalyzing && (
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-300">
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
            <span className="font-mono text-zinc-500">Pipeline active</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(15, progressStep * 25))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Submit Action */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-zinc-500">
          Tip: Use the slider in the Knowledge Graph to verify what characters know per chapter.
        </p>
        <button
          onClick={handleSubmit}
          disabled={isAnalyzing || !text.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
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
  );
}
