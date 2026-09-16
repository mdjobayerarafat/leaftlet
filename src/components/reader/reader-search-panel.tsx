"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { extractAllText } from "@/lib/pdf/loader";

interface SearchResult {
  page: number;
  snippet: string;
}

export function ReaderSearchPanel({
  doc,
  pdfUrl,
  onGoToPage,
  onClose,
}: {
  doc: PDFDocumentProxy;
  pdfUrl: string;
  onGoToPage: (page: number) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [indexed, setIndexed] = useState(0);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const textCache = useRef<Map<number, string> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Index text once per document, lazily on first search.
  async function ensureIndexed() {
    if (textCache.current) return textCache.current;
    setIndexing(true);
    const pages = await extractAllText(doc, pdfUrl, (done, totalCount) => {
      setIndexed(done);
      setTotal(totalCount);
    });
    textCache.current = pages;
    setIndexing(false);
    return pages;
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      const id = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(id);
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const pages = await ensureIndexed();
        const lower = q.toLowerCase();
        const found: SearchResult[] = [];
        for (const [page, text] of pages) {
          if (found.length >= 50) break;
          const idx = text.toLowerCase().indexOf(lower);
          if (idx !== -1) {
            const start = Math.max(0, idx - 40);
            const snippet = text.slice(start, Math.min(text.length, idx + q.length + 60));
            found.push({ page, snippet: `…${snippet}…` });
          }
        }
        setResults(found);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-4" aria-label="Search in book">
      <div className="flex items-center justify-between">
        <h2 className="heading-mono text-lg">Search in book</h2>
        <button type="button" onClick={onClose} aria-label="Close search" className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-muted hover:shadow-pop-sm">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this book…"
          aria-label="Search text"
          className="h-10 w-full rounded-[2px] border-2 border-border bg-input pl-9 pr-3 text-sm"
        />
      </div>

      {indexing ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Indexing text… {total > 0 ? `${Math.round((indexed / total) * 100)}%` : ""}
        </p>
      ) : null}

      {searching ? <p className="text-xs text-muted-foreground">Searching…</p> : null}

      {!searching && query.trim().length >= 2 ? (
        <p className="text-xs text-muted-foreground">{results.length} result{results.length === 1 ? "" : "s"}</p>
      ) : null}

      <ul className="space-y-2">
        {results.map((result) => (
          <li key={result.page}>
            <button
              type="button"
              onClick={() => onGoToPage(result.page)}
              className="w-full rounded-[3px] border-2 border-border bg-card p-3 text-left shadow-pop-sm hover:bg-muted"
            >
              <span className="font-mono text-xs font-bold text-primary">Page {result.page}</span>
              <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{result.snippet}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
