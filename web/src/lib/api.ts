import { GraphResponse, Contradiction, Manuscript } from "./types";
import {
  MOCK_GRAPHS_BY_CHAPTER,
  MOCK_CONTRADICTIONS,
} from "./mockData";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function createManuscript(
  title: string,
  text: string
): Promise<Manuscript> {
  if (FORCE_MOCK) {
    const chapters = Math.max(1, (text.match(/chapter\s+\d+/gi) || []).length);
    return { id: "mock-m1", title, chapters: chapters || 4 };
  }

  try {
    const r = await fetch(`${BASE}/manuscripts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    return {
      id: data.id,
      title: title || "Untitled Manuscript",
      chapters: data.chapters || 4,
    };
  } catch (err) {
    console.warn("Backend unavailable, using mock manuscript", err);
    const chapters = Math.max(1, (text.match(/chapter\s+\d+/gi) || []).length);
    return { id: "mock-fallback", title: title || "Demo Manuscript", chapters: chapters || 4 };
  }
}

export async function analyze(id: string): Promise<{ status: string }> {
  if (FORCE_MOCK || id.startsWith("mock-")) {
    await new Promise((res) => setTimeout(res, 800));
    return { status: "done" };
  }

  try {
    const r = await fetch(`${BASE}/manuscripts/${id}/analyze`, {
      method: "POST",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.warn("Backend analysis failed, falling back to mock", err);
    return { status: "done" };
  }
}

export async function getGraph(
  id: string,
  chapter: number = 1
): Promise<GraphResponse> {
  if (FORCE_MOCK || id.startsWith("mock-")) {
    return MOCK_GRAPHS_BY_CHAPTER[chapter] || MOCK_GRAPHS_BY_CHAPTER[1];
  }

  try {
    const r = await fetch(`${BASE}/manuscripts/${id}/graph?chapter=${chapter}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    
    // If backend returns simple mock without multi-chapter differences, augment with local chapter data
    if (data.nodes && (!data.facts || data.facts.length === 0)) {
      const local = MOCK_GRAPHS_BY_CHAPTER[chapter] || MOCK_GRAPHS_BY_CHAPTER[1];
      return { ...data, facts: local.facts };
    }
    return data;
  } catch (err) {
    console.warn("Using mock graph fallback for chapter", chapter, err);
    return MOCK_GRAPHS_BY_CHAPTER[chapter] || MOCK_GRAPHS_BY_CHAPTER[1];
  }
}

export async function getContradictions(
  id: string
): Promise<Contradiction[]> {
  if (FORCE_MOCK || id.startsWith("mock-")) {
    return MOCK_CONTRADICTIONS;
  }

  try {
    const r = await fetch(`${BASE}/manuscripts/${id}/contradictions`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return MOCK_CONTRADICTIONS;
  } catch (err) {
    console.warn("Using mock contradictions fallback", err);
    return MOCK_CONTRADICTIONS;
  }
}
