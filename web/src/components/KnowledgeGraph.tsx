"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import { GraphResponse } from "@/lib/types";
import { CharacterNode } from "./CharacterNode";
import { CharacterSidePanel } from "./CharacterSidePanel";

interface KnowledgeGraphProps {
  graphData: GraphResponse | null;
  currentChapter: number;
  totalChapters: number;
  onChapterChange: (chapter: number) => void;
  isLoading?: boolean;
}

const nodeTypes = {
  characterNode: CharacterNode,
};

export function KnowledgeGraph({
  graphData,
  currentChapter,
  totalChapters,
  onChapterChange,
  isLoading = false,
}: KnowledgeGraphProps) {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  // Set default selection to first character if none selected or if selection no longer in graph
  useEffect(() => {
    if (graphData?.nodes && graphData.nodes.length > 0) {
      const exists = graphData.nodes.some((n) => String(n.id) === selectedCharId);
      if (!selectedCharId || !exists) {
        const timer = setTimeout(() => {
          setSelectedCharId(String(graphData.nodes[0].id));
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [graphData, selectedCharId]);

  // Compute node positions arranged cleanly in an elliptical layout centered in the canvas
  const nodes: Node[] = useMemo(() => {
    if (!graphData || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
      return [];
    }

    const count = graphData.nodes.length;
    const radiusX = Math.max(260, count * 70);
    const radiusY = Math.max(180, count * 50);
    const centerX = 400;
    const centerY = 280;

    return graphData.nodes.map((node, i) => {
      let x = centerX - 100;
      let y = centerY - 45;

      if (count > 1) {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        x = centerX + radiusX * Math.cos(angle) - 100;
        y = centerY + radiusY * Math.sin(angle) - 45;
      }

      const nodeId = String(node.id || `char-${i}`);
      const knows = Array.isArray(node.knows) ? node.knows : [];

      return {
        id: nodeId,
        type: "characterNode",
        position: { x, y },
        data: {
          id: nodeId,
          name: node.name || "Unknown",
          aliases: Array.isArray(node.aliases) ? node.aliases : [],
          knownCount: knows.length,
          isSelected: nodeId === selectedCharId,
        },
      };
    });
  }, [graphData, selectedCharId]);

  // Compute edges with colors by transmission mode and validate source/target exist
  const edges: Edge[] = useMemo(() => {
    if (!graphData || !Array.isArray(graphData.edges) || !Array.isArray(graphData.nodes)) {
      return [];
    }

    const validNodeIds = new Set(graphData.nodes.map((n) => String(n.id)));
    const nameToId = new Map(
      graphData.nodes.map((n) => [String(n.name).toLowerCase().trim(), String(n.id)])
    );

    const safeFacts = Array.isArray(graphData.facts) ? graphData.facts : [];
    const result: Edge[] = [];

    for (let idx = 0; idx < graphData.edges.length; idx++) {
      const edge = graphData.edges[idx];
      let sourceId = String(edge.source || "").trim();
      let targetId = String(edge.target || "").trim();

      // Resolve by name if LLM extracted name instead of ID
      if (!validNodeIds.has(sourceId) && nameToId.has(sourceId.toLowerCase())) {
        sourceId = nameToId.get(sourceId.toLowerCase())!;
      }
      if (!validNodeIds.has(targetId) && nameToId.has(targetId.toLowerCase())) {
        targetId = nameToId.get(targetId.toLowerCase())!;
      }

      // Only render edge if both nodes actually exist in the canvas
      if (!validNodeIds.has(sourceId) || !validNodeIds.has(targetId)) {
        continue;
      }

      const fact = safeFacts.find((f) => f.id === edge.fact_id);
      const isRecent = edge.chapter === currentChapter;
      const mode = (edge.mode || "told").toLowerCase();

      let strokeColor = "#6C47FF"; // vivid violet (told)
      if (mode === "witnessed") strokeColor = "#10B981"; // emerald
      if (mode === "overheard") strokeColor = "#F59E0B"; // amber
      if (mode === "deduced") strokeColor = "#A855F7"; // purple

      const factSnippet = fact?.claim
        ? `: ${fact.claim.slice(0, 24)}${fact.claim.length > 24 ? "…" : ""}`
        : "";

      result.push({
        id: `e-${sourceId}-${targetId}-${edge.fact_id || idx}`,
        source: sourceId,
        target: targetId,
        animated: isRecent,
        label: `${mode.toUpperCase()}${factSnippet}`,
        labelStyle: {
          fill: "#E2E2F0",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "#151538",
          fillOpacity: 0.95,
          rx: 6,
          ry: 6,
        },
        style: {
          stroke: strokeColor,
          strokeWidth: isRecent ? 2.5 : 1.5,
          opacity: isRecent ? 1 : 0.65,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 14,
          height: 14,
        },
      });
    }

    return result;
  }, [graphData, currentChapter]);

  const selectedNode = useMemo(() => {
    if (!graphData || !Array.isArray(graphData.nodes) || !selectedCharId) return null;
    return graphData.nodes.find((n) => String(n.id) === selectedCharId) || null;
  }, [graphData, selectedCharId]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4.25rem)] relative overflow-hidden bg-[#0B0B1E] w-full">
      {/* Top Timeline Scrubber & Legend Toolbar (Matching reference images) */}
      <div className="bg-[#0E0E24]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9A9C9] flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-[#6C47FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Timeline Scrubber:</span>
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onChapterChange(Math.max(1, currentChapter - 1))}
              disabled={currentChapter <= 1 || isLoading}
              className="p-1.5 rounded-lg bg-[#151538] hover:bg-[#1E1E4E] border border-white/[0.06] disabled:opacity-40 text-white transition-colors"
              title="Previous chapter"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="px-3 py-1 rounded-xl bg-[#6C47FF]/15 text-indigo-300 font-mono text-xs font-bold border border-[#6C47FF]/30">
              Chapter {currentChapter} of {Math.max(1, totalChapters)}
            </span>

            <button
              onClick={() => onChapterChange(Math.min(totalChapters, currentChapter + 1))}
              disabled={currentChapter >= totalChapters || isLoading}
              className="p-1.5 rounded-lg bg-[#151538] hover:bg-[#1E1E4E] border border-white/[0.06] disabled:opacity-40 text-white transition-colors"
              title="Next chapter"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="flex-1 max-w-md mx-4 flex items-center space-x-3">
          <span className="text-[11px] text-[#6F6F94] font-mono">Ch. 1</span>
          <input
            type="range"
            min={1}
            max={Math.max(1, totalChapters)}
            value={currentChapter}
            onChange={(e) => onChapterChange(Number(e.target.value))}
            className="w-full accent-[#6C47FF] cursor-pointer h-1.5 bg-[#1C1C45] rounded-lg"
          />
          <span className="text-[11px] text-[#6F6F94] font-mono">Ch. {Math.max(1, totalChapters)}</span>
        </div>

        {/* Legend Pills with Glowing Markers */}
        <div className="hidden lg:flex items-center space-x-3 text-[11px] text-[#A9A9C9] bg-[#151538] px-3 py-1.5 rounded-xl border border-white/[0.08]">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6C47FF] shadow-sm shadow-[#6C47FF]" />
            <span>Told</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-sm shadow-[#10B981]" />
            <span>Witnessed</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-sm shadow-[#F59E0B]" />
            <span>Overheard</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A855F7] shadow-sm shadow-[#A855F7]" />
            <span>Deduced</span>
          </span>
        </div>
      </div>

      {/* Main Canvas & Side Panel Container */}
      <div className="flex-1 flex flex-row relative overflow-hidden min-h-0 w-full" style={{ height: "calc(100% - 56px)" }}>
        {/* React Flow Graph Canvas */}
        <div className="flex-1 h-full w-full relative min-h-[400px]" style={{ width: "100%", height: "100%" }}>
          {isLoading && (
            <div className="absolute inset-0 bg-[#0B0B1E]/75 backdrop-blur-xs flex items-center justify-center z-30">
              <div className="flex items-center space-x-2.5 text-indigo-300 bg-[#151538] border border-white/[0.08] px-5 py-3 rounded-2xl text-xs font-mono shadow-2xl">
                <svg className="animate-spin w-4 h-4 text-[#6C47FF]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Synchronizing timeline for Chapter {currentChapter}...</span>
              </div>
            </div>
          )}

          {nodes.length > 0 ? (
            <ReactFlow
              key={`rf-canvas-ch-${graphData?.chapter ?? currentChapter}-${nodes.length}`}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedCharId(node.id)}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.1}
              maxZoom={2.0}
              className="bg-[#0B0B1E]"
              style={{ width: "100%", height: "100%" }}
            >
              <Background color="#1C1C45" gap={22} size={1} />
              <Controls className="!bg-[#151538] !border-white/[0.08] !rounded-xl text-white shadow-xl" />
              <MiniMap
                nodeColor={() => "#6C47FF"}
                maskColor="rgba(11, 11, 30, 0.85)"
                className="!bg-[#151538] !border-white/[0.08] !rounded-2xl"
              />
            </ReactFlow>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0B1E] p-6 text-center">
              <div className="p-4 bg-[#151538] rounded-2xl border border-white/[0.08] text-[#6F6F94] mb-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-white text-sm font-semibold">No character entities for Chapter {currentChapter}</p>
              <p className="text-[#A9A9C9] text-xs mt-1 max-w-sm">
                No characters were active up to this chapter. Use the timeline scrubber above to explore other chapters.
              </p>
            </div>
          )}
        </div>

        {/* Character Side Panel */}
        {selectedNode && (
          <CharacterSidePanel
            character={selectedNode}
            allNodes={graphData?.nodes || []}
            edges={graphData?.edges || []}
            facts={graphData?.facts || []}
            currentChapter={currentChapter}
            onClose={() => setSelectedCharId(null)}
          />
        )}
      </div>
    </div>
  );
}
