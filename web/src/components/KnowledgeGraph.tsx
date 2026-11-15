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
import { GraphResponse, GraphNode, Fact } from "@/lib/types";
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
        setSelectedCharId(String(graphData.nodes[0].id));
      }
    }
  }, [graphData, selectedCharId]);

  // Compute node positions arranged cleanly in an elliptical layout centered in the canvas
  const nodes: Node[] = useMemo(() => {
    if (!graphData || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
      return [];
    }

    const count = graphData.nodes.length;
    const radiusX = Math.max(240, count * 60);
    const radiusY = Math.max(160, count * 45);
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

      let strokeColor = "#6366f1"; // indigo (told)
      if (mode === "witnessed") strokeColor = "#10b981"; // emerald
      if (mode === "overheard") strokeColor = "#f59e0b"; // amber
      if (mode === "deduced") strokeColor = "#a855f7"; // purple

      const factSnippet = fact?.claim
        ? `: ${fact.claim.slice(0, 22)}${fact.claim.length > 22 ? "…" : ""}`
        : "";

      result.push({
        id: `e-${sourceId}-${targetId}-${edge.fact_id || idx}`,
        source: sourceId,
        target: targetId,
        animated: isRecent,
        label: `${mode.toUpperCase()}${factSnippet}`,
        labelStyle: {
          fill: "#d4d4d8",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "#18181b",
          fillOpacity: 0.9,
          rx: 4,
          ry: 4,
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
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative overflow-hidden bg-zinc-950 w-full">
      {/* Top Slider Toolbar */}
      <div className="bg-zinc-900/90 backdrop-blur border-b border-zinc-800 px-6 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Timeline Scrubber:
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onChapterChange(Math.max(1, currentChapter - 1))}
              disabled={currentChapter <= 1 || isLoading}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300"
              title="Previous chapter"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="px-3 py-1 rounded-lg bg-zinc-800 text-indigo-300 font-mono text-xs font-bold border border-zinc-700">
              Chapter {currentChapter} of {Math.max(1, totalChapters)}
            </span>

            <button
              onClick={() => onChapterChange(Math.min(totalChapters, currentChapter + 1))}
              disabled={currentChapter >= totalChapters || isLoading}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300"
              title="Next chapter"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="flex-1 max-w-md mx-6 flex items-center space-x-3">
          <span className="text-[11px] text-zinc-500 font-mono">Ch. 1</span>
          <input
            type="range"
            min={1}
            max={Math.max(1, totalChapters)}
            value={currentChapter}
            onChange={(e) => onChapterChange(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
          />
          <span className="text-[11px] text-zinc-500 font-mono">Ch. {Math.max(1, totalChapters)}</span>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center space-x-4 text-[11px] text-zinc-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Told</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Witnessed</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Overheard</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Deduced</span>
          </span>
        </div>
      </div>

      {/* Main Canvas & Side Panel Container */}
      <div className="flex-1 flex flex-row relative overflow-hidden min-h-0 w-full" style={{ height: "calc(100% - 56px)" }}>
        {/* React Flow Graph Canvas */}
        <div className="flex-1 h-full w-full relative min-h-[400px]" style={{ width: "100%", height: "100%" }}>
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center z-30">
              <div className="flex items-center space-x-2 text-indigo-400 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-xs font-mono shadow-xl">
                <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
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
              className="bg-zinc-950"
              style={{ width: "100%", height: "100%" }}
            >
              <Background color="#27272a" gap={20} size={1} />
              <Controls className="bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 fill-zinc-300" />
              <MiniMap
                nodeColor={() => "#6366f1"}
                maskColor="rgba(9, 9, 11, 0.85)"
                className="bg-zinc-900 border border-zinc-800 rounded-xl"
              />
            </ReactFlow>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 p-6 text-center">
              <div className="p-3 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-500 mb-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-zinc-300 text-sm font-semibold">No character entities for Chapter {currentChapter}</p>
              <p className="text-zinc-500 text-xs mt-1 max-w-sm">
                No characters were extracted or active up to this chapter. Use the timeline slider above or analyze your manuscript to populate the knowledge graph.
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
