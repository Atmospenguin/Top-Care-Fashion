"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";

type QA = { q: string; a?: string; user?: string; ts: number };

export default function FAQPage() {
  const { isAuthenticated, user } = useAuth();
  const [list, setList] = useState<QA[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    try {
      const r = await fetch("/api/faq", { cache: "no-store" });
      const j = await r.json();
      setList((j.faqs || []).map((x: any) => ({ q: x.question, a: x.answer || undefined, ts: x.id })));
    } catch {
      // fallback to empty
      setList([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    try {
      await fetch("/api/faq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q.trim() }) });
      setQ("");
      await load();
    } catch {
      // show optimistic add locally if POST fails
      setList([{ q: q.trim(), user: user?.username || user?.email, ts: Date.now() }, ...list]);
      setQ("");
    }
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">FAQ</h1>
      <p className="text-sm text-black/70 mt-1">Signed-in users can submit questions (demo stored locally).</p>

      {isAuthenticated ? (
        <form onSubmit={addQuestion} className="mt-6 flex gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Type your question..." className="flex-1 border border-black/10 rounded-md px-3 py-2" />
          <button type="submit" className="rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90">Ask</button>
        </form>
      ) : (
        <p className="mt-6 text-sm">Please sign in to ask.</p>
      )}

      <div className="mt-8 space-y-4">
        {list.length === 0 && <p className="text-sm text-black/60">No questions yet.</p>}
        {list.map((item) => (
          <div key={item.ts} className="rounded-xl border border-black/10 p-4 bg-white">
            <div className="text-sm">Q: {item.q}</div>
            {item.a ? <div className="text-sm mt-1 text-black/70">A: {item.a}</div> : <div className="text-xs text-black/50 mt-1">Awaiting answer</div>}
            {item.user && <div className="text-xs text-black/50 mt-2">From: {item.user}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
