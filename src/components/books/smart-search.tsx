"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { Button } from "@/components/ui/button";

interface SmartBook {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  categoryName: string;
  coverFileId: string;
  ratingAvg: number;
  ratingCount: number;
}

/** Natural-language search: describes intent, AI matches books by meaning. */
export function SmartSearch() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<SmartBook[] | null>(null);
  const [interpreted, setInterpreted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 3 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: trimmed }),
      });
      const body = (await res.json()) as { books?: SmartBook[]; interpreted?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Smart search failed");
      setBooks(body.books ?? []);
      setInterpreted(body.interpreted ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Smart search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-10 rounded-[3px] border-2 border-border bg-secondary/40 p-5 shadow-pop-sm" aria-label="Smart search">
      <h2 className="heading-mono flex items-center gap-2 text-lg">
        <Sparkles className="h-5 w-5 text-primary" aria-hidden /> Ask the library
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Describe what you feel like reading — the AI finds it by meaning, not keywords.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(query);
        }}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="a beginner-friendly book about database design"
          aria-label="Describe what you want to read"
          className="h-11 w-full rounded-[2px] border-2 border-border bg-input px-3 text-sm"
        />
        <Button type="submit" size="lg" disabled={loading || query.trim().length < 3} className="shrink-0">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Searching…
            </>
          ) : (
            "Find books"
          )}
        </Button>
      </form>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {interpreted && books && books.length > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Interpreted as: <span className="font-medium text-foreground">{interpreted}</span>
        </p>
      ) : null}

      {books && books.length === 0 && !error ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing in the library matches that yet.</p>
      ) : null}

      {books && books.length > 0 ? (
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={{
                id: book.id,
                title: book.title,
                slug: book.slug,
                authorName: book.authorName,
                categoryName: book.categoryName,
                coverFileId: book.coverFileId,
                ratingAvg: book.ratingAvg,
                ratingCount: book.ratingCount,
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
