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
        return "bg-rose-500/15 text-rose-300 border-rose-500/40";
      case "medium":
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
      case "low":
        return "bg-blue-500/15 text-blue-300 border-blue-500/40";
      default:
        return "bg-white/[0.06] text-[#A9A9C9] border-white/[0.08]";
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
    <div className="flex-1 flex h-[calc(100vh-4.25rem)] overflow-hidden bg-[#0B0B1E]">
      {/* Left List Pane (Matching Reference Image 2 Plot-Hole Detector list) */}
      <div className="w-80 sm:w-96 border-r border-white/[0.08] flex flex-col bg-[#0E0E24] shrink-0">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Plot-Hole Detector</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold">
                {contradictions.length} {contradictions.length === 1 ? "issue" : "issues"}
              </span>
            </h2>
            <p className="text-[11px] text-[#6F6F94] mt-0.5">
              Use ↑ and ↓ keys to cycle detected issues
            </p>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#6F6F94] space-y-2">
              <svg className="animate-spin w-5 h-5 text-[#6C47FF] mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Verifying plot logic...</span>
            </div>
          ) : contradictions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6F6F94] space-y-1">
              <div className="w-8 h-8 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-white">Consistent Manuscript</p>
              <p>No contradictions detected in this draft.</p>
            </div>
          ) : (
            contradictions.map((c, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={c.id || idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-[#1E1E4E] border-[#7C5CFF] shadow-[0_0_16px_rgba(108,71,255,0.3)] ring-1 ring-[#6C47FF]/50"
                      : "bg-[#151538]/70 border-white/[0.06] hover:bg-[#151538] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-bold ${getSeverityBadge(
                        c.severity
                      )}`}
                    >
                      {c.severity}
                    </span>
                    <span className="text-[11px] text-[#A9A9C9] font-medium truncate">
                      {getTypeLabel(c.type)}
                    </span>
                  </div>

                  <p className="text-xs text-white line-clamp-2 leading-relaxed">
                    {c.explanation}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#6F6F94]">
                    <span>Evidence Chapters:</span>
                    <span className="font-mono text-indigo-300 font-semibold">
                      {c.evidence.map((e) => `Ch.${e.chapter}`).join(" vs ")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Pane (Matching Reference Image 1 & 2 Comparison panels) */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0B0B1E] p-6 space-y-6">
        {selectedItem ? (
          <>
            {/* Author Control Guarantee Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#151538] via-[#151538] to-[#1E1E4E] border border-white/[0.08] flex items-start space-x-3.5 shadow-xl">
              <div className="w-10 h-10 bg-[#6C47FF]/20 text-[#7C5CFF] rounded-xl shrink-0 border border-[#6C47FF]/40 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block text-sm">
                  Author Control Principle
                </span>
                <span className="text-[#A9A9C9] mt-0.5 block leading-relaxed">
                  NarrativeOS never alters your prose or rewrites your draft. We identify exact conflicting evidence passages so you remain in full creative command.
                </span>
              </div>
            </div>

            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span
                  className={`text-xs uppercase font-mono px-2.5 py-0.5 rounded-full border font-bold ${getSeverityBadge(
                    selectedItem.severity
                  )}`}
                >
                  {selectedItem.severity} Severity
                </span>
                <span className="text-xs font-semibold text-indigo-400">
                  {getTypeLabel(selectedItem.type)}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {selectedItem.explanation}
              </h1>
            </div>

            {/* Side-by-side Evidence Cards with Round "VS" Badge (Matching Reference Image 1 bottom-right) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#A9A9C9] uppercase tracking-wider flex items-center space-x-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span>Conflicting Evidence Passages ({selectedItem.evidence.length})</span>
              </h3>

              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {selectedItem.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-5 bg-[#151538] border border-white/[0.08] rounded-2xl space-y-3.5 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.06]">
                        <span className="font-mono font-bold text-indigo-300 flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-cyan-400" : "bg-purple-400"}`} />
                          <span>Passage #{i + 1} · Chapter {ev.chapter}</span>
                        </span>
                        {typeof ev.start === "number" && (
                          <span className="text-[10px] text-[#6F6F94] font-mono">
                            Offsets [{ev.start}..{ev.end}]
                          </span>
                        )}
                      </div>

                      {/* Surrounding Context with Highlighted Quote */}
                      <div className="text-xs font-serif leading-relaxed text-[#E2E2F0] bg-[#0E0E24] p-4 rounded-xl border border-white/[0.06] mt-3">
                        {ev.context ? (
                          <div>
                            {ev.context.split(ev.quote).map((part, pIdx, arr) => (
                              <React.Fragment key={pIdx}>
                                <span>{part}</span>
                                {pIdx < arr.length - 1 && (
                                  <mark className="bg-rose-500/25 text-rose-200 px-1.5 py-0.5 rounded font-semibold border border-rose-500/40">
                                    {ev.quote}
                                  </mark>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        ) : (
                          <mark className="bg-rose-500/25 text-rose-200 px-1.5 py-0.5 rounded font-semibold border border-rose-500/40 block">
                            &ldquo;{ev.quote}&rdquo;
                          </mark>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 text-[10px] text-[#6F6F94] flex items-center justify-between">
                      <span>Verbatim exact match</span>
                      <span className="text-[#10B981] font-medium flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>
                ))}

                {/* Central Round "VS" Badge (hidden on single column mobile) */}
                {selectedItem.evidence.length >= 2 && (
                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1C1C45] border-2 border-[#6C47FF] items-center justify-center text-[11px] font-extrabold text-white shadow-xl shadow-black/60 pointer-events-none z-10">
                    VS
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Fix block */}
            <div className="p-5 bg-[#151538] border border-white/[0.08] rounded-2xl space-y-3 shadow-lg">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#10B981]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Suggested Creative Resolution</span>
              </div>
              <p className="text-xs text-[#E2E2F0] leading-relaxed font-sans">
                {selectedItem.suggested_fix}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#6F6F94] space-y-2">
            <p className="text-sm">Select a warning on the left to inspect verbatim evidence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
