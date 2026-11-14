"use client";
import { useState } from "react";
import { createManuscript, analyze, getGraph, getContradictions } from "@/lib/api";

const SAMPLE = "Chapter 1\nMara met Hale at the old house.\nChapter 2\nInspector Rao arrived.";

export default function Home() {
  const [text, setText] = useState(SAMPLE);
  const [out, setOut] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setBusy(true);
    setErr("");
    try {
      const m = await createManuscript("Demo", text);
      await analyze(m.id);
      const graph = await getGraph(m.id, 1);
      const contradictions = await getContradictions(m.id);
      setOut({ manuscript: m, graph, contradictions });
    } catch (e) {
      setErr(String(e));
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <h1 className="text-2xl font-bold">who-knew-what</h1>
      <textarea
        className="w-full h-40 border rounded p-2 text-black"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={run}
        disabled={busy}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {busy ? "Analyzing..." : "Analyze"}
      </button>
      {err && <p className="text-red-600">{err}</p>}
      {out !== null && (
        <pre className="text-xs bg-gray-100 text-black p-3 rounded overflow-auto">
          {JSON.stringify(out, null, 2)}
        </pre>
      )}
    </main>
  );
}