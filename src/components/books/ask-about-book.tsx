"use client";

import { useState } from "react";
import { Loader2, MessageCircleQuestion, Send, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Is this book good for beginners?",
  "How long does it take to read?",
  "What will I learn from it?",
];

/** Small pre-reading Q&A box on the book details page. */
export function AskAboutBook({ bookId }: { bookId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asked, setAsked] = useState("");

  async function ask(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 3 || loading) return;
    setLoading(true);
    setError(null);
    setAsked(trimmed);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, question: trimmed }),
      });
      const body = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !body.answer) throw new Error(body.error ?? "Could not answer");
      setAnswer(body.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not answer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 rounded-[3px] border-2 border-border bg-card p-5 shadow-pop-sm" aria-label="Ask about this book">
      <h2 className="heading-mono flex items-center gap-2 text-lg">
        <MessageCircleQuestion className="h-5 w-5 text-primary" aria-hidden /> Ask before you read
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Is this book good for beginners?"
          aria-label="Your question about this book"
          className="h-10 w-full rounded-[2px] border-2 border-border bg-input px-3 text-sm"
        />
        <button
          type="submit"
          disabled={loading || question.trim().length < 3}
          aria-label="Ask"
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[2px] border-2 border-border bg-primary px-4 font-mono text-sm font-bold uppercase text-primary-foreground shadow-pop-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          Ask
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuestion(s);
              void ask(s);
            }}
            disabled={loading}
            className="rounded-[2px] border-2 border-border bg-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {answer ? (
        <div className="mt-4 rounded-[3px] border-2 border-border bg-secondary/50 p-4">
          <p className="mb-1 flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden /> Answer {asked ? `· “${asked.slice(0, 40)}${asked.length > 40 ? "…" : ""}”` : ""}
          </p>
          <p className="text-sm leading-relaxed text-foreground">{answer}</p>
        </div>
      ) : null}
    </section>
  );
}
