"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { cn } from "@/lib/utils";

interface RecBook {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  categoryName: string;
  coverFileId: string;
}

export function AiRecommendations({ bookId, signedIn }: { bookId: string; signedIn: boolean }) {
  const [books, setBooks] = useState<RecBook[] | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const body = (await res.json()) as { books?: RecBook[]; reason?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Could not load recommendations");
      setBooks(body.books ?? []);
      setReason(body.reason ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load recommendations");
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  // Only signed-in users get personalized picks; the section renders nothing otherwise.
  // Fetch fires after paint (timeout) so the synchronous effect never cascades a render.
  const autoLoaded = useRef(false);
  useEffect(() => {
    if (!signedIn || autoLoaded.current) return;
    autoLoaded.current = true;
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [signedIn, load]);

  if (!signedIn) return null;

  return (
    <section className="mt-14 border-t-2 border-border pt-8" aria-labelledby="ai-recs">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="ai-recs" className="heading-mono flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden /> Readers of this book also suggest
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-[2px] border-2 border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase shadow-pop-sm hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Refresh"}
        </button>
      </div>

      {reason ? <p className="mb-5 max-w-2xl text-sm text-muted-foreground">{reason}</p> : null}

      {error ? (
        <p className="rounded-[3px] border-2 border-border bg-card px-4 py-3 text-sm text-danger shadow-pop-sm">{error}</p>
      ) : null}

      {loading && !books ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading recommendations">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-3" aria-hidden>
              <div className="shimmer aspect-2/3 w-full max-w-40 rounded-[2px] border-2 border-border bg-muted" />
              <div className="shimmer h-4 w-4/5 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : null}

      {books && books.length === 0 && !error ? (
        <p className="text-sm text-muted-foreground">No other books fit yet — the library is still growing.</p>
      ) : null}

      {books && books.length > 0 ? (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <div key={book.id} className="flex flex-col">
              <Link href={`/books/${book.slug}`} aria-label={`View details for ${book.title}`} className="w-fit">
                <BookCover fileId={book.coverFileId} title={book.title} author={book.authorName} size="md" />
              </Link>
              <Link href={`/books/${book.slug}`} className={cn("mt-3 line-clamp-2 font-semibold leading-snug text-foreground hover:underline")}>
                {book.title}
              </Link>
              <span className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{book.authorName}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
