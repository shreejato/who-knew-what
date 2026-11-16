export type KnowledgeMode = "witnessed" | "told" | "overheard" | "deduced";

export type ContradictionType =
  | "premature_knowledge"
  | "presence"
  | "timeline"
  | "attribute";

export type ContradictionSeverity = "high" | "medium" | "low";

export interface Character {
  id: string;
  name: string;
  aliases?: string[];
}

export interface Fact {
  id: string;
  claim: string;
  chapter: number;
  quote: string;
  start?: number;
  end?: number;
}

export interface KnowledgeEvent {
  character_id: string;
  fact_id: string;
  chapter: number;
  mode: KnowledgeMode;
  source_character_id: string | null;
  quote: string;
}

export interface Reference {
  character_id: string;
  fact_id: string;
  chapter: number;
  quote: string;
  start?: number;
  end?: number;
}

export interface StoryEvent {
  id: string;
  chapter: number;
  summary: string;
  time_marker?: string | null;
  location?: string;
  participants: string[];
  quote: string;
}

export interface EvidenceItem {
  chapter: number;
  quote: string;
  start?: number;
  end?: number;
  context?: string;
}

export interface Contradiction {
  id: string;
  type: ContradictionType;
  severity: ContradictionSeverity;
  explanation: string;
  evidence: EvidenceItem[];
  suggested_fix: string;
}

export interface GraphNode {
  id: string;
  name: string;
  knows: string[]; // array of fact_ids known up to current chapter
  aliases?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  fact_id: string;
  mode: KnowledgeMode;
  chapter: number;
}

export interface GraphResponse {
  chapter: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  facts: Fact[];
}

export interface Manuscript {
  id: string;
  title: string;
  chapters: number;
  text?: string;
}

export type AnalysisSource = "live" | "cached" | "mock";

export interface EvalMetric {
  metric: string;
  gemini: string | number;
  adapted: string | number;
  delta: string;
}
