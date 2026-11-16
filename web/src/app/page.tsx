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
  getBackendHealth,
} from "@/lib/api";
import { GraphResponse, Contradiction, Manuscript, AnalysisSource } from "@/lib/types";

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
  const [backendExtractor, setBackendExtractor] = useState<string>("gemini");
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>("mock");

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

  // Initialize with backend health and Chapter 1 demo data
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [health, data, items] = await Promise.all([
          getBackendHealth(),
          getGraph("m-demo-1", 1),
          getContradictions("m-demo-1"),
        ]);
        if (active) {
          if (health?.extractor) setBackendExtractor(health.extractor);
          if (data) setGraphData(data);
          if (items && items.data && items.data.length > 0) {
            setContradictions(items.data);
            setAnalysisSource(items.isRealApi ? "cached" : "mock");
          }
        }
      } catch (err) {
        console.error("Failed to initialize startup data", err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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
      const analyzeRes = await analyze(m.id);

      // Step 3: Fetch initial chapter graph and contradiction list
      setCurrentChapter(1);
      const [g, c] = await Promise.all([
        getGraph(m.id, 1),
        getContradictions(m.id),
      ]);

      setGraphData(g);
      setContradictions(c.data);
      // Determine truthful source status
      if (analyzeRes.isRealApi && c.isRealApi) {
        setAnalysisSource("live");
      } else if (c.isRealApi) {
        setAnalysisSource("cached");
      } else {
        setAnalysisSource("mock");
      }

      // Transition smoothly to the visual knowledge graph
      setActiveTab("graph");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze manuscript. Please check backend connection.";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0B1E] text-white overflow-hidden">
      {/* Left Sidebar matching Reference Images 1 & 2 */}
      <aside className="w-64 bg-[#0E0E24] border-r border-white/[0.08] flex-col justify-between hidden md:flex shrink-0 z-20">
        <div>
          {/* Logo & Brand Header */}
          <div className="p-6 border-b border-white/[0.06] flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C47FF] to-[#8E54E9] p-[1.5px] shadow-lg shadow-[#6C47FF]/30 shrink-0">
              <div className="w-full h-full bg-[#151538] rounded-[14px] flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none">
                Narrative<span className="text-[#7C5CFF]">OS</span>
              </span>
              <span className="text-[11px] text-[#A9A9C9] tracking-wider uppercase font-medium mt-1 block">
                Write. Analyze. Explore.
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab("upload")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === "upload"
                  ? "bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/35"
                  : "text-[#A9A9C9] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="flex-1 text-left">Manuscript Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === "graph"
                  ? "bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/35"
                  : "text-[#A9A9C9] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="flex-1 text-left">Knowledge Graph</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-indigo-200 font-mono">
                Ch. {currentChapter}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("contradictions")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === "contradictions"
                  ? "bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/35"
                  : "text-[#A9A9C9] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="flex-1 text-left">Plot-Hole Detector</span>
              {contradictions.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                  {contradictions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsModelModalOpen(true)}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs text-[#A9A9C9] hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <svg className="w-4 h-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="flex-1 text-left">Model Benchmark</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#6C47FF]/20 text-indigo-300 font-mono">
                eval
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Tagline / Wave Card matching reference images */}
        <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-[#1C1C45] to-[#12122B] border border-white/[0.08] relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 Q25,20 50,50 T100,50 L100,100 L0,100 Z" fill="#7C5CFF" />
            </svg>
          </div>
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-sm">✨</span>
              <h4 className="text-xs font-bold text-white tracking-tight">Your story. Smarter.</h4>
            </div>
            <p className="text-[11px] text-[#A9A9C9] leading-relaxed">
              Epistemic character tracking & mathematical continuity proofs.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          contradictionCount={contradictions.length}
          manuscriptTitle={manuscript.title}
          chapterCount={manuscript.chapters}
          onOpenModelModal={() => setIsModelModalOpen(true)}
          extractorType={extractorType}
          backendExtractor={backendExtractor}
          analysisSource={analysisSource}
          onReset={() => setActiveTab("upload")}
          isAnalyzing={isAnalyzing}
        />

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "upload" && (
            <UploadView
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              error={error}
              contradictions={contradictions}
              graphData={graphData}
              analysisSource={analysisSource}
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
      </div>

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
