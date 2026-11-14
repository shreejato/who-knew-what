const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function createManuscript(title: string, text: string) {
    const r = await fetch(`${BASE}/manuscripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text }),
    });
    return r.json();
}

export const analyze = (id: string) =>
    fetch(`${BASE}/manuscripts/${id}/analyze`, { method: "POST" }).then(r => r.json());

export const getGraph = (id: string, chapter: number) =>
    fetch(`${BASE}/manuscripts/${id}/graph?chapter=${chapter}`).then(r => r.json());

export const getContradictions = (id: string) =>
    fetch(`${BASE}/manuscripts/${id}/contradictions`).then(r => r.json());