"use client";

import React, { useState } from "react";
import { GraphNode, GraphEdge, Fact, KnowledgeMode } from "@/lib/types";

interface CharacterSidePanelProps {
  character: GraphNode | null;
  allNodes: GraphNode[];
  edges: GraphEdge[];
  facts: Fact[];
  currentChapter: number;
  onClose: () => void;
}

export function CharacterSidePanel({
  character,
  allNodes,
  edges,
  facts,
  currentChapter,
  onClose,
}: CharacterSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"known" | "unknown" | "transmission">("known");

  if (!character) return null;

  const knownFactIds = Array.isArray(character.knows) ? character.knows : [];
  const safeFacts = Array.isArray(facts) ? facts : [];
  const safeEdges = Array.isArray(edges) ? edges : [];
  const safeNodes = Array.isArray(allNodes) ? allNodes : [];
  const safeAliases = Array.isArray(character.aliases) ? character.aliases : [];

  // Facts known by this character
  const knownFacts = safeFacts.filter((f) => knownFactIds.includes(f.id));

  // Facts existing up to this chapter that character DOES NOT know yet
  const unknownFacts = safeFacts.filter((f) => !knownFactIds.includes(f.id));

  // Transmissions received by this character
  const receivedTransmissions = safeEdges.filter(
    (e) => String(e.target) === String(character.id) && e.chapter <= currentChapter
  );

  // Transmissions sent by this character to others
  const sentTransmissions = safeEdges.filter(
    (e) => String(e.source) === String(character.id) && e.chapter <= currentChapter
  );

  const getCharacterName = (id: string | null) => {
    if (!id) return "Unknown";
    const found = safeNodes.find((n) => String(n.id) === String(id) || n.name.toLowerCase() === id.toLowerCase());
    return found ? found.name : id;
  };

  const getModeBadge = (mode: KnowledgeMode | string) => {
    switch (mode) {
      case "told":
        return "bg-[#6C47FF]/20 text-indigo-300 border-[#6C47FF]/40";
      case "witnessed":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "overheard":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "deduced":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      default:
        return "bg-white/[0.06] text-[#A9A9C9] border-white/[0.08]";
    }
  };

  const initials = character.name
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "C";

  return (
    <aside className="w-80 sm:w-96 bg-[#0E0E24] border-l border-white/[0.08] flex flex-col h-full z-20 shadow-2xl shrink-0 animate-fade-in">
      {/* Top Header Card (Reference Image 1 top-right) */}
      <div className="p-5 border-b border-white/[0.06] space-y-4 bg-[#151538]/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6C47FF] to-[#9B7DFF] p-[1.5px] shadow-lg shadow-[#6C47FF]/30 shrink-0">
              <div className="w-full h-full bg-[#151538] rounded-[14px] flex items-center justify-center font-bold text-sm text-white">
                {initials}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">{character.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6C47FF]/20 text-indigo-300 font-semibold border border-[#6C47FF]/40">
                  Tracked Mind
                </span>
              </div>
              {safeAliases.length > 0 && (
                <p className="text-xs text-[#A9A9C9] mt-0.5">
                  Aliases: {safeAliases.join(", ")}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#A9A9C9] hover:text-white p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors"
            title="Close panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick metrics pills */}
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-xl bg-[#151538] text-white border border-white/[0.08] font-medium flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Knows {knownFacts.length} {knownFacts.length === 1 ? "fact" : "facts"}</span>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-[#151538] text-[#A9A9C9] border border-white/[0.08]">
            Timeline: Chapter {currentChapter}
          </span>
        </div>
      </div>

      {/* Pill-style Segmented Tabs */}
      <div className="p-3 border-b border-white/[0.06] bg-[#0E0E24]">
        <div className="flex bg-[#151538] p-1 rounded-xl border border-white/[0.06] text-xs">
          <button
            onClick={() => setActiveTab("known")}
            className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${
              activeTab === "known"
                ? "bg-[#6C47FF] text-white shadow-md shadow-[#6C47FF]/30"
                : "text-[#A9A9C9] hover:text-white"
            }`}
          >
            Knows ({knownFacts.length})
          </button>
          <button
            onClick={() => setActiveTab("unknown")}
            className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${
              activeTab === "unknown"
                ? "bg-[#6C47FF] text-white shadow-md shadow-[#6C47FF]/30"
                : "text-[#A9A9C9] hover:text-white"
            }`}
          >
            Missing ({unknownFacts.length})
          </button>
          <button
            onClick={() => setActiveTab("transmission")}
            className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${
              activeTab === "transmission"
                ? "bg-[#6C47FF] text-white shadow-md shadow-[#6C47FF]/30"
                : "text-[#A9A9C9] hover:text-white"
            }`}
          >
            Network
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* TAB 1: What they know */}
        {activeTab === "known" && (
          <div className="space-y-3">
            {knownFacts.length === 0 ? (
              <div className="text-center py-10 text-[#6F6F94] text-xs">
                No facts registered for {character.name} in or before Chapter {currentChapter}.
              </div>
            ) : (
              knownFacts.map((fact) => {
                const sourceEdge = receivedTransmissions.find(
                  (e) => e.fact_id === fact.id
                );
                return (
                  <div
                    key={fact.id}
                    className="p-3.5 bg-[#151538] border border-white/[0.08] rounded-2xl space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-white leading-snug">
                        {fact.claim}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.06] text-[#A9A9C9] font-mono shrink-0">
                        Ch. {fact.chapter}
                      </span>
                    </div>

                    {/* How they learned it */}
                    {sourceEdge ? (
                      <div className="flex items-center space-x-1.5 text-[11px] text-[#A9A9C9]">
                        <span className="text-[#6F6F94]">Mode:</span>
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[10px] uppercase font-mono font-semibold ${getModeBadge(
                            sourceEdge.mode
                          )}`}
                        >
                          {sourceEdge.mode}
                        </span>
                        <span className="text-[#6F6F94]">from</span>
                        <span className="text-white font-medium">
                          {getCharacterName(sourceEdge.source)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#A9A9C9]">
                        <span className="text-[#6F6F94]">Origin:</span> Firsthand knowledge / Ch. {fact.chapter}
                      </div>
                    )}

                    {/* Verbatim quote */}
                    {fact.quote && (
                      <blockquote className="border-l-2 border-[#6C47FF] pl-2.5 py-1 text-xs italic text-[#A9A9C9] font-serif bg-[#0E0E24]/60 rounded-r-lg">
                        &ldquo;{fact.quote}&rdquo;
                      </blockquote>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: What they don't know yet */}
        {activeTab === "unknown" && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 leading-relaxed">
              <strong>Writer Guardrail:</strong> If {character.name} speaks about any of these facts before learning them, NarrativeOS flags a Premature Knowledge plot hole.
            </div>

            {unknownFacts.length === 0 ? (
              <div className="text-center py-8 text-[#6F6F94] text-xs">
                This character knows all established facts in the story up to this chapter!
              </div>
            ) : (
              unknownFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-3 bg-[#151538]/70 border border-white/[0.06] rounded-xl space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-[#A9A9C9] leading-snug">{fact.claim}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#6F6F94] font-mono shrink-0">
                      Ch. {fact.chapter}
                    </span>
                  </div>
                  <div className="text-[11px] text-rose-400 font-medium flex items-center space-x-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Unrevealed to {character.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Network transmissions */}
        {activeTab === "transmission" && (
          <div className="space-y-4">
            {/* Told by others */}
            <div>
              <h4 className="text-[11px] font-bold text-[#A9A9C9] uppercase tracking-wider mb-2.5">
                Who Told {character.name}
              </h4>
              {receivedTransmissions.length === 0 ? (
                <p className="text-xs text-[#6F6F94] italic">No direct disclosures received.</p>
              ) : (
                <div className="space-y-2">
                  {receivedTransmissions.map((edge, idx) => {
                    const fact = safeFacts.find((f) => f.id === edge.fact_id);
                    return (
                      <div key={idx} className="p-3 bg-[#151538] border border-white/[0.08] rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-indigo-300">
                            {getCharacterName(edge.source)}
                          </span>
                          <span className="text-[10px] text-[#6F6F94] font-mono">Ch. {edge.chapter}</span>
                        </div>
                        <p className="text-[#A9A9C9] text-[11px]">{fact?.claim || edge.fact_id}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Told to others */}
            <div>
              <h4 className="text-[11px] font-bold text-[#A9A9C9] uppercase tracking-wider mb-2.5">
                Who {character.name} Told
              </h4>
              {sentTransmissions.length === 0 ? (
                <p className="text-xs text-[#6F6F94] italic">Has not disclosed facts to others yet.</p>
              ) : (
                <div className="space-y-2">
                  {sentTransmissions.map((edge, idx) => {
                    const fact = safeFacts.find((f) => f.id === edge.fact_id);
                    return (
                      <div key={idx} className="p-3 bg-[#151538] border border-white/[0.08] rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-purple-300">
                            {getCharacterName(edge.target)}
                          </span>
                          <span className="text-[10px] text-[#6F6F94] font-mono">Ch. {edge.chapter}</span>
                        </div>
                        <p className="text-[#A9A9C9] text-[11px]">{fact?.claim || edge.fact_id}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
