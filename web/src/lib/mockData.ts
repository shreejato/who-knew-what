import { GraphResponse, Contradiction, EvalMetric } from "./types";

export const SAMPLE_STORY = `Chapter 1
The autumn mist hung heavy over Blackwood Manor. Mara Voss stepped across the threshold, her gloved fingers trembling against the damp iron railing. Inside the dimly lit study, Arthur Hale was pacing behind the mahogany desk. "He had changed the will that week," Hale whispered urgently, staring at the floorboards. "Everything now passes to the conservatory trust, leaving us destitute." Mara listened in silence, noticing the unpaid bank summonses scattered across his desk. Hale owed more than he could ever repay.

Chapter 2
Dawn arrived with the shrill whistle of the London train. Inspector Rao stepped onto the gravel driveway of Blackwood Manor, taking notes in his worn ledger. In the drawing room, Rao turned sharply to Mara. "Hale owes sixty thousand pounds to creditors in the city," Rao declared, tapping his ledger. Later, inspecting the library shelves, Rao murmured to himself: "Rao said the new will explained everything, and that the motive was clear as crystal." Yet no one in the village had spoken a word of any will.

Chapter 3
By noon, the autopsy report arrived by courier from Dover. Mara sat by the drawing room fire, turning over the apothecary ledger she had discovered beneath the parlor rug. Arsenic trioxide had been purchased in Dover three days before the death. When Inspector Rao entered the library looking for correspondence, Mara looked up calmly. "Hale told me that the will was changed," Mara said, handing him the copy. Rao stiffened, reading the clause for the first time.

Chapter 4
Night had fallen when the inquest assembled in the village hall. Rao read from the official constable log: "Rao first learned of the will from the lawyer during the formal reading on Thursday." Later, the constable noted that Hale had arrived in London at 8:15 PM on Tuesday night, having signed the innkeeper's ledger in the Strand. Yet Mara testified under oath that Hale was dining with her at Blackwood Manor in Dover until 8:00 PM that very same evening.`;

export const MOCK_GRAPHS_BY_CHAPTER: Record<number, GraphResponse> = {
  1: {
    chapter: 1,
    nodes: [
      { id: "c1", name: "Mara Voss", knows: ["f1"], aliases: ["Ms. Voss"] },
      { id: "c2", name: "Arthur Hale", knows: ["f1", "f2"], aliases: ["Hale"] },
      { id: "c3", name: "Inspector Rao", knows: [], aliases: ["Rao"] },
    ],
    edges: [
      { source: "c2", target: "c1", fact_id: "f1", mode: "told", chapter: 1 },
    ],
    facts: [
      {
        id: "f1",
        claim: "The will was changed to pass everything to the conservatory trust",
        chapter: 1,
        quote: "He had changed the will that week, leaving us destitute.",
        start: 184,
        end: 242,
      },
      {
        id: "f2",
        claim: "Hale owes more than he can repay to city creditors",
        chapter: 1,
        quote: "Hale owed more than he could ever repay.",
        start: 350,
        end: 390,
      },
    ],
  },
  2: {
    chapter: 2,
    nodes: [
      { id: "c1", name: "Mara Voss", knows: ["f1"], aliases: ["Ms. Voss"] },
      { id: "c2", name: "Arthur Hale", knows: ["f1", "f2"], aliases: ["Hale"] },
      { id: "c3", name: "Inspector Rao", knows: ["f2"], aliases: ["Rao"] },
    ],
    edges: [
      { source: "c2", target: "c1", fact_id: "f1", mode: "told", chapter: 1 },
    ],
    facts: [
      {
        id: "f1",
        claim: "The will was changed to pass everything to the conservatory trust",
        chapter: 1,
        quote: "He had changed the will that week, leaving us destitute.",
        start: 184,
        end: 242,
      },
      {
        id: "f2",
        claim: "Hale owes more than he can repay to city creditors",
        chapter: 1,
        quote: "Hale owed more than he could ever repay.",
        start: 350,
        end: 390,
      },
      {
        id: "f3",
        claim: "Rao discovered Hale's sixty thousand pound debt",
        chapter: 2,
        quote: "Hale owes sixty thousand pounds to creditors in the city.",
        start: 620,
        end: 677,
      },
    ],
  },
  3: {
    chapter: 3,
    nodes: [
      { id: "c1", name: "Mara Voss", knows: ["f1", "f4"], aliases: ["Ms. Voss"] },
      { id: "c2", name: "Arthur Hale", knows: ["f1", "f2"], aliases: ["Hale"] },
      { id: "c3", name: "Inspector Rao", knows: ["f1", "f2"], aliases: ["Rao"] },
    ],
    edges: [
      { source: "c2", target: "c1", fact_id: "f1", mode: "told", chapter: 1 },
      { source: "c1", target: "c3", fact_id: "f1", mode: "told", chapter: 3 },
    ],
    facts: [
      {
        id: "f1",
        claim: "The will was changed to pass everything to the conservatory trust",
        chapter: 1,
        quote: "He had changed the will that week, leaving us destitute.",
        start: 184,
        end: 242,
      },
      {
        id: "f2",
        claim: "Hale owes more than he can repay to city creditors",
        chapter: 1,
        quote: "Hale owed more than he could ever repay.",
        start: 350,
        end: 390,
      },
      {
        id: "f3",
        claim: "Rao discovered Hale's sixty thousand pound debt",
        chapter: 2,
        quote: "Hale owes sixty thousand pounds to creditors in the city.",
        start: 620,
        end: 677,
      },
      {
        id: "f4",
        claim: "Arsenic trioxide was purchased in Dover three days prior",
        chapter: 3,
        quote: "Arsenic trioxide had been purchased in Dover three days before the death.",
        start: 1100,
        end: 1173,
      },
    ],
  },
  4: {
    chapter: 4,
    nodes: [
      { id: "c1", name: "Mara Voss", knows: ["f1", "f4", "f5"], aliases: ["Ms. Voss"] },
      { id: "c2", name: "Arthur Hale", knows: ["f1", "f2", "f5"], aliases: ["Hale"] },
      { id: "c3", name: "Inspector Rao", knows: ["f1", "f2", "f4", "f5"], aliases: ["Rao"] },
    ],
    edges: [
      { source: "c2", target: "c1", fact_id: "f1", mode: "told", chapter: 1 },
      { source: "c1", target: "c3", fact_id: "f1", mode: "told", chapter: 3 },
      { source: "c1", target: "c3", fact_id: "f4", mode: "witnessed", chapter: 3 },
    ],
    facts: [
      {
        id: "f1",
        claim: "The will was changed to pass everything to the conservatory trust",
        chapter: 1,
        quote: "He had changed the will that week, leaving us destitute.",
        start: 184,
        end: 242,
      },
      {
        id: "f2",
        claim: "Hale owes more than he can repay to city creditors",
        chapter: 1,
        quote: "Hale owed more than he could ever repay.",
        start: 350,
        end: 390,
      },
      {
        id: "f3",
        claim: "Rao discovered Hale's debt",
        chapter: 2,
        quote: "Hale owes sixty thousand pounds to creditors in the city.",
        start: 620,
        end: 677,
      },
      {
        id: "f4",
        claim: "Arsenic trioxide was purchased in Dover",
        chapter: 3,
        quote: "Arsenic trioxide had been purchased in Dover three days before the death.",
        start: 1100,
        end: 1173,
      },
      {
        id: "f5",
        claim: "Hale's whereabouts on Tuesday night conflict",
        chapter: 4,
        quote: "Hale had arrived in London at 8:15 PM on Tuesday night.",
        start: 1510,
        end: 1565,
      },
    ],
  },
};

export const MOCK_CONTRADICTIONS: Contradiction[] = [
  {
    id: "x1",
    type: "premature_knowledge",
    severity: "high",
    explanation:
      "Inspector Rao discusses the modified will as motive in Chapter 2, but Mara does not disclose the will until Chapter 3, and Rao's own ledger in Chapter 4 confirms he only learned of it at Thursday's reading.",
    evidence: [
      {
        chapter: 2,
        quote: "Rao said the new will explained everything, and that the motive was clear as crystal.",
        start: 720,
        end: 805,
        context: "Later, inspecting the library shelves, Rao murmured to himself: 'Rao said the new will explained everything, and that the motive was clear as crystal.' Yet no one in the village had spoken a word of any will.",
      },
      {
        chapter: 4,
        quote: "Rao first learned of the will from the lawyer during the formal reading on Thursday.",
        start: 1380,
        end: 1465,
        context: "Rao read from the official constable log: 'Rao first learned of the will from the lawyer during the formal reading on Thursday.'",
      },
    ],
    suggested_fix:
      "Remove Rao's internal mention of the will in Chapter 2, or introduce a scene where an anonymous clerk leaks the testament prior to his arrival at Blackwood Manor.",
  },
  {
    id: "x2",
    type: "presence",
    severity: "high",
    explanation:
      "Arthur Hale cannot be dining with Mara in Dover until 8:00 PM and simultaneously signing an inn register in London at 8:15 PM on Tuesday.",
    evidence: [
      {
        chapter: 4,
        quote: "Mara testified under oath that Hale was dining with her at Blackwood Manor in Dover until 8:00 PM that very same evening.",
        start: 1620,
        end: 1740,
        context: "Yet Mara testified under oath that Hale was dining with her at Blackwood Manor in Dover until 8:00 PM that very same evening.",
      },
      {
        chapter: 4,
        quote: "Hale had arrived in London at 8:15 PM on Tuesday night, having signed the innkeeper's ledger in the Strand.",
        start: 1480,
        end: 1588,
        context: "Later, the constable noted that Hale had arrived in London at 8:15 PM on Tuesday night, having signed the innkeeper's ledger in the Strand.",
      },
    ],
    suggested_fix:
      "Adjust the timeline by at least 3 hours for train transit, or establish that an impostor signed the Strand ledger using Hale's alias.",
  },
  {
    id: "x3",
    type: "timeline",
    severity: "medium",
    explanation:
      "The inquest cites the autopsy report arriving from Dover at noon on Day 3, yet the courier was dispatched only after sunset on Day 3.",
    evidence: [
      {
        chapter: 3,
        quote: "By noon, the autopsy report arrived by courier from Dover.",
        start: 940,
        end: 998,
        context: "By noon, the autopsy report arrived by courier from Dover. Mara sat by the drawing room fire...",
      },
    ],
    suggested_fix:
      "Change the time of the courier's arrival to 'By dusk' or state that the post rider rode through the previous night.",
  },
];

export const MOCK_EVAL_METRICS: EvalMetric[] = [
  {
    metric: "JSON Output Validity",
    gemini: "89.2%",
    adapted: "98.7%",
    delta: "+9.5%",
  },
  {
    metric: "Verbatim Quote Exactness",
    gemini: "84.5%",
    adapted: "97.1%",
    delta: "+12.6%",
  },
  {
    metric: "Knowledge Extraction F1",
    gemini: "0.78",
    adapted: "0.91",
    delta: "+0.13",
  },
  {
    metric: "Contradiction Detection F1",
    gemini: "0.74",
    adapted: "0.88",
    delta: "+0.14",
  },
  {
    metric: "Average Inference Latency",
    gemini: "2,450 ms",
    adapted: "1,120 ms",
    delta: "-54.3%",
  },
];
