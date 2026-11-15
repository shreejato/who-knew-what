"use client";

import React, { useState, useEffect } from "react";
import { Contradiction, ContradictionType, ContradictionSeverity } from "@/lib/types";

interface ContradictionsViewProps {
  contradictions: Contradiction[];
  isLoading?: boolean;
}

export function ContradictionsView({
  contradictions,
  isLoading = false,
}: ContradictionsViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (contradictions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(contradictions.length - 1, prev + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [contradictions.length]);

  const selectedItem = contradictions[selectedIndex] || null;

  const getSeverityBadge = (sev: ContradictionSeverity) => {
    switch (sev) {
      case "high":
        return "bg-rose-950 text-rose-300 border-rose-800/80";
      case "medium":
        return "bg-amber-950 text-amber-300 border-amber-800/80";
      case "low":
        return "bg-blue-950 text-blue-300 border-blue-800/80";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getTypeLabel = (type: ContradictionType) => {
    switch (type) {
      case "premature_knowledge":
        return "Premature Knowledge";
      case "presence":
        return "Character Presence";
      case "timeline":
        return "Timeline / Travel";
      case "attribute":
        return "Attribute Inconsistency";
      default:
        return type;
    }
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden bg-zinc-950">
      {/* Left List Pane */}
      <div className="w-80 sm:w-96 border-r border-zinc-800 flex flex-col bg-zinc-900/60 shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
              <span>Continuity Warnings</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60 font-mono">
                {contradictions.length}
              </span>
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Use ↑ and ↓ keys to navigate items
            </p>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-2 space-y-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
              <svg className="animate-spin w-5 h-5 text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Verifying plot logic...</span>
            </div>
          ) : contradictions.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No contradictions detected in this draft.
            </div>
          ) : (
            contradictions.map((c, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={c.id || idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-zinc-800/90 border border-indigo-500/50 shadow-md shadow-indigo-500/10"
                      : "hover:bg-zinc-800/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(
                        c.severity
                      )}`}
                    >
                      {c.severity}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium truncate">
                      {getTypeLabel(c.type)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                    {c.explanation}
                  </p>

                  <div className="mt-2 flex items-center space-x-2 text-[10px] text-zinc-400">
                    <span>Evidence:</span>
                    <span className="font-mono text-indigo-400">
                      {c.evidence.map((e) => `Ch.${e.chapter}`).join(" vs ")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-950 p-6 space-y-6">
        {selectedItem ? (
          <>
            {/* Guarantee Callout Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/30 border border-zinc-800 flex items-start space-x-3 shadow-lg">
              <div className="p-2 bg-indigo-950 text-indigo-400 rounded-lg shrink-0 border border-indigo-800/40">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-xs">
                <span className="font-semibold text-zinc-200 block">
                  Author Control Principle
                </span>
                <span className="text-zinc-400 mt-0.5 block leading-relaxed">
                  NarrativeOS never alters your prose or rewrites your manuscript. We highlight exact verbatim passages so you can decide the artistic resolution.
                </span>
              </div>
            </div>

            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span
                  className={`text-xs uppercase font-mono px-2.5 py-1 rounded border font-bold ${getSeverityBadge(
                    selectedItem.severity
                  )}`}
                >
                  {selectedItem.severity} Severity
                </span>
                <span className="text-sm font-semibold text-indigo-300">
                  {getTypeLabel(selectedItem.type)}
                </span>
              </div>
              <h1 className="text-lg font-bold text-zinc-100 leading-snug">
                {selectedItem.explanation}
              </h1>
            </div>

            {/* Side-by-side Evidence Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center space-x-2">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span>Conflicting Evidence Passages ({selectedItem.evidence.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedItem.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
                      <span className="font-mono font-bold text-indigo-400">
                        Passage #{i + 1} · Chapter {ev.chapter}
                      </span>
                      {typeof ev.start === "number" && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Offsets [{ev.start}..{ev.end}]
                        </span>
                      )}
                    </div>

                    {/* Surrounding Context with Highlighted Quote */}
                    <div className="text-xs font-serif leading-relaxed text-zinc-300 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                      {ev.context ? (
                        <div>
                          {ev.context.split(ev.quote).map((part, pIdx, arr) => (
                            <React.Fragment key={pIdx}>
                              <span>{part}</span>
                              {pIdx < arr.length - 1 && (
                                <mark className="bg-rose-500/30 text-rose-200 px-1 py-0.5 rounded font-semibold border border-rose-500/40">
                                  {ev.quote}
                                </mark>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        <mark className="bg-rose-500/30 text-rose-200 px-1 py-0.5 rounded font-semibold border border-rose-500/40 block">
                          "{ev.quote}"
                        </mark>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Fix block */}
            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Suggested Creative Resolution</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {selectedItem.suggested_fix}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-2">
            <p className="text-sm">Select a warning on the left to inspect verbatim evidence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
