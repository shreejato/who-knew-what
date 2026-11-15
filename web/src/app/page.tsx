"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { UploadView } from "@/components/UploadView";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { ContradictionsView } from "@/components/ContradictionsView";
import { ModelComparisonModal } from "@/components/ModelComparisonModal";
import {
  createManuscript,
  analyze,
  getGraph,
  getContradictions,
} from "@/lib/api";
import { GraphResponse, Contradiction, Manuscript } from "@/lib/types";
import { SAMPLE_STORY } from "@/lib/mockData";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"upload" | "graph" | "contradictions">("upload");
  const [manuscript, setManuscript] = useState<Manuscript>({
    id: "m-demo-1",
    title: "The Blackwood Manor Mystery",
    chapters: 4,
  });
  const [currentChapter, setCurrentChapter] = useState(1);
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [extractorType, setExtractorType] = useState<"gemini" | "adapted">("gemini");

  // Load initial graph data for the demo manuscript
  const loadGraphForChapter = useCallback(
    async (mid: string, ch: number) => {
      setIsGraphLoading(true);
      try {
        const data = await getGraph(mid, ch);
        setGraphData(data);
      } catch (err) {
        console.error("Failed to load graph for chapter", ch, err);
      } finally {
        setIsGraphLoading(false);
      }
    },
    []
  );

  // Initialize with Chapter 1 data and mock contradictions on startup
  useEffect(() => {
    loadGraphForChapter("m-demo-1", 1);
    getContradictions("m-demo-1").then((items) => {
      if (items && items.length > 0) {
        setContradictions(items);
      }
    });
  }, [loadGraphForChapter]);

  // Handle chapter scrubber slider changes
  const handleChapterChange = async (chapter: number) => {
    setCurrentChapter(chapter);
    await loadGraphForChapter(manuscript.id, chapter);
  };

  // Full analysis workflow
  const handleAnalyze = async (title: string, text: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // Step 1: Create manuscript
      const m = await createManuscript(title, text);
      setManuscript(m);

      // Step 2: Trigger analysis pipeline
      await analyze(m.id);

      // Step 3: Fetch initial chapter graph and contradiction list
      setCurrentChapter(1);
      const [g, c] = await Promise.all([
        getGraph(m.id, 1),
        getContradictions(m.id),
      ]);

      setGraphData(g);
      setContradictions(c);

      // Transition smoothly to the visual knowledge graph
      setActiveTab("graph");
    } catch (err: any) {
      setError(err?.message || "Failed to analyze manuscript. Please check backend connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        contradictionCount={contradictions.length}
        manuscriptTitle={manuscript.title}
        chapterCount={manuscript.chapters}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        extractorType={extractorType}
        onReset={() => setActiveTab("upload")}
      />

      {/* Main Interactive View Tabs */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "upload" && (
          <UploadView
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            error={error}
          />
        )}

        {activeTab === "graph" && (
          <KnowledgeGraph
            graphData={graphData}
            currentChapter={currentChapter}
            totalChapters={manuscript.chapters}
            onChapterChange={handleChapterChange}
            isLoading={isGraphLoading}
          />
        )}

        {activeTab === "contradictions" && (
          <ContradictionsView
            contradictions={contradictions}
            isLoading={isAnalyzing}
          />
        )}
      </main>

      {/* Adaption Model Evaluation Modal */}
      <ModelComparisonModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        currentExtractor={extractorType}
        onToggleExtractor={setExtractorType}
      />
    </div>
  );
}
