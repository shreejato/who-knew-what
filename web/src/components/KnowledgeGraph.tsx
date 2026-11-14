"use client";

import React, { useMemo, useState, useEffect } from "react";
import "@xyflow/react/dist/style.css";
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

  // Set default selection to first character if none selected
  useEffect(() => {
    if (graphData?.nodes && graphData.nodes.length > 0 && !selectedCharId) {
      setSelectedCharId(graphData.nodes[0].id);
    }
  }, [graphData, selectedCharId]);

  // Compute node positions arranged cleanly in an elliptical layout
  const nodes: Node[] = useMemo(() => {
    if (!graphData || !graphData.nodes) return [];

    const count = graphData.nodes.length;
    const radiusX = Math.max(220, count * 55);
    const radiusY = Math.max(160, count * 40);
    const centerX = 360;
    const centerY = 240;

    return graphData.nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / Math.max(1, count) - Math.PI / 2;
      const x = centerX + radiusX * Math.cos(angle) - 90;
      const y = centerY + radiusY * Math.sin(angle) - 40;

      return {
        id: node.id,
        type: "characterNode",
        position: { x, y },
        data: {
          id: node.id,
          name: node.name,
          aliases: node.aliases,
          knownCount: node.knows.length,
          isSelected: node.id === selectedCharId,
        },
      };
    });
  }, [graphData, selectedCharId]);

  // Compute edges with colors by transmission mode
  const edges: Edge[] = useMemo(() => {
    if (!graphData || !graphData.edges) return [];

    return graphData.edges.map((edge, idx) => {
      const fact = graphData.facts.find((f) => f.id === edge.fact_id);
      const isRecent = edge.chapter === currentChapter;

      let strokeColor = "#6366f1"; // indigo (told)
      if (edge.mode === "witnessed") strokeColor = "#10b981"; // emerald
      if (edge.mode === "overheard") strokeColor = "#f59e0b"; // amber
      if (edge.mode === "deduced") strokeColor = "#a855f7"; // purple

      return {
        id: `e-${edge.source}-${edge.target}-${idx}`,
        source: edge.source,
        target: edge.target,
        animated: isRecent,
        label: `${edge.mode.toUpperCase()}${fact ? `: ${fact.claim.slice(0, 24)}...` : ""}`,
        labelStyle: {
          fill: "#d4d4d8",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "#18181b",
          fillOpacity: 0.85,
          rx: 4,
          ry: 4,
        },
        style: {
          stroke: strokeColor,
          strokeWidth: isRecent ? 2.5 : 1.5,
          opacity: isRecent ? 1 : 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 14,
          height: 14,
        },
      };
    });
  }, [graphData, currentChapter]);

  const selectedNode = useMemo(() => {
    if (!graphData || !selectedCharId) return null;
    return graphData.nodes.find((n) => n.id === selectedCharId) || null;
  }, [graphData, selectedCharId]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative overflow-hidden bg-zinc-950">
      {/* Top Slider Toolbar */}
      <div className="bg-zinc-900/90 backdrop-blur border-b border-zinc-800 px-6 py-3 flex items-center justify-between z-10">
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
          <span className="text-[11px] text-zinc-500 font-mono">Ch. {totalChapters}</span>
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
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Deduced</span>
          </span>
        </div>
      </div>

      {/* Main Canvas & Side Panel Container */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* React Flow Graph */}
        <div className="flex-1 h-full relative">
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-30">
              <div className="flex items-center space-x-2 text-indigo-400 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-mono">
                <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Synchronizing timeline for Chapter {currentChapter}...</span>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedCharId(node.id)}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={1.8}
            className="bg-zinc-950"
          >
            <Background color="#27272a" gap={20} size={1} />
            <Controls className="bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 fill-zinc-300" />
            <MiniMap
              nodeColor={() => "#6366f1"}
              maskColor="rgba(9, 9, 11, 0.85)"
              className="bg-zinc-900 border border-zinc-800 rounded-xl"
            />
          </ReactFlow>

          {/* Empty state overlay if no characters */}
          {(!graphData || graphData.nodes.length === 0) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-zinc-400 text-sm">No characters extracted yet.</p>
              <p className="text-zinc-600 text-xs mt-1">
                Upload or analyze a manuscript to populate the knowledge graph.
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
