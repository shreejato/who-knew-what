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

  // Facts known by this character
  const knownFacts = facts.filter((f) => character.knows.includes(f.id));

  // Facts existing up to this chapter that character DOES NOT know yet
  const unknownFacts = facts.filter((f) => !character.knows.includes(f.id));

  // Transmissions received by this character
  const receivedTransmissions = edges.filter(
    (e) => e.target === character.id && e.chapter <= currentChapter
  );

  // Transmissions sent by this character to others
  const sentTransmissions = edges.filter(
    (e) => e.source === character.id && e.chapter <= currentChapter
  );

  const getCharacterName = (id: string | null) => {
    if (!id) return "Unknown";
    const found = allNodes.find((n) => n.id === id);
    return found ? found.name : id;
  };

  const getModeBadge = (mode: KnowledgeMode) => {
    switch (mode) {
      case "told":
        return "bg-indigo-950 text-indigo-300 border-indigo-800";
      case "witnessed":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      case "overheard":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "deduced":
        return "bg-purple-950 text-purple-300 border-purple-800";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <aside className="w-96 bg-zinc-900/95 backdrop-blur-md border-l border-zinc-800 flex flex-col h-full z-20 shadow-2xl">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-800 flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <h2 className="text-base font-bold text-zinc-100">{character.name}</h2>
          </div>
          {character.aliases && character.aliases.length > 0 && (
            <p className="text-xs text-zinc-400 mt-0.5">
              Aliases: {character.aliases.join(", ")}
            </p>
          )}
          <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Timeline: Chapter {currentChapter}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          title="Close panel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 text-xs px-2 pt-2 bg-zinc-950/40">
        <button
          onClick={() => setActiveTab("known")}
          className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
            activeTab === "known"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Knows ({knownFacts.length})
        </button>
        <button
          onClick={() => setActiveTab("unknown")}
          className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
            activeTab === "unknown"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Doesn't Know ({unknownFacts.length})
        </button>
        <button
          onClick={() => setActiveTab("transmission")}
          className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
            activeTab === "transmission"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Network
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: What they know */}
        {activeTab === "known" && (
          <div className="space-y-3">
            {knownFacts.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
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
                    className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-200">
                        {fact.claim}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                        Ch. {fact.chapter}
                      </span>
                    </div>

                    {/* How they learned it */}
                    {sourceEdge ? (
                      <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400">
                        <span className="text-zinc-500">Learned via:</span>
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[10px] uppercase font-mono ${getModeBadge(
                            sourceEdge.mode
                          )}`}
                        >
                          {sourceEdge.mode}
                        </span>
                        <span className="text-zinc-500">from</span>
                        <span className="text-zinc-300 font-medium">
                          {getCharacterName(sourceEdge.source)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-400">
                        <span className="text-zinc-500">Origin:</span> Firsthand knowledge / originated in Ch. {fact.chapter}
                      </div>
                    )}

                    {/* Verbatim quote */}
                    {fact.quote && (
                      <blockquote className="border-l-2 border-indigo-500/60 pl-2.5 py-1 text-xs italic text-zinc-400 font-serif bg-zinc-900/50 rounded-r">
                        "{fact.quote}"
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
            <div className="p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-lg text-[11px] text-amber-300/80">
              Key writer safeguard: If this character speaks about any of these facts before learning them, NarrativeOS flags a Premature Knowledge plot hole.
            </div>

            {unknownFacts.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                This character knows all established facts in the story so far!
              </div>
            ) : (
              unknownFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl space-y-1.5 opacity-80"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-zinc-300">{fact.claim}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 shrink-0">
                      Ch. {fact.chapter}
                    </span>
                  </div>
                  <div className="text-[11px] text-rose-400/80 font-medium flex items-center space-x-1">
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
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Who Told {character.name}
              </h4>
              {receivedTransmissions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No direct disclosures received.</p>
              ) : (
                <div className="space-y-2">
                  {receivedTransmissions.map((edge, idx) => {
                    const fact = facts.find((f) => f.id === edge.fact_id);
                    return (
                      <div key={idx} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-indigo-400">
                            {getCharacterName(edge.source)}
                          </span>
                          <span className="text-[10px] text-zinc-500">Ch. {edge.chapter}</span>
                        </div>
                        <p className="text-zinc-300 text-[11px]">{fact?.claim || edge.fact_id}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Told to others */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Who {character.name} Told
              </h4>
              {sentTransmissions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">Has not disclosed facts to others yet.</p>
              ) : (
                <div className="space-y-2">
                  {sentTransmissions.map((edge, idx) => {
                    const fact = facts.find((f) => f.id === edge.fact_id);
                    return (
                      <div key={idx} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-violet-400">
                            {getCharacterName(edge.target)}
                          </span>
                          <span className="text-[10px] text-zinc-500">Ch. {edge.chapter}</span>
                        </div>
                        <p className="text-zinc-300 text-[11px]">{fact?.claim || edge.fact_id}</p>
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
