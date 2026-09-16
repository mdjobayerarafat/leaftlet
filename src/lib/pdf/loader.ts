"use client";

import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { TocItem } from "@/types";

let workerConfigured = false;

async function ensureWorker(): Promise<void> {
  if (workerConfigured) return;
  // pdfjs v5 supports worker via URL; the .mjs worker ships in the package.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  workerConfigured = true;
}

export async function loadPdf(url: string): Promise<PDFDocumentProxy> {
  await ensureWorker();
  return pdfjs.getDocument({ url, withCredentials: false }).promise;
}

/** Extract the document outline; returns [] when the PDF has no bookmarks. */
export async function extractOutline(doc: PDFDocumentProxy): Promise<TocItem[]> {
  try {
    const outline = await doc.getOutline();
    if (!outline || outline.length === 0) return [];
    const items: TocItem[] = [];
    for (const entry of outline) {
      let pageIndex: number | null = null;
      try {
        const dest = typeof entry.dest === "string" ? await doc.getDestination(entry.dest) : entry.dest;
        if (dest && typeof dest[0] === "object" && dest[0] !== null) {
          const index = await doc.getPageIndex(dest[0] as never);
          pageIndex = index;
        }
      } catch {
        pageIndex = null;
      }
      const item: TocItem = {
        title: String(entry.title ?? "Untitled"),
        pageIndex: pageIndex ?? 0,
      };
      if (Array.isArray(entry.items) && entry.items.length > 0) {
        // Only one nesting level for a clean UI.
        item.children = [];
        for (const child of entry.items as typeof outline) {
          try {
            const cdest = typeof child.dest === "string" ? await doc.getDestination(child.dest) : child.dest;
            let cIndex = 0;
            if (cdest && typeof cdest[0] === "object" && cdest[0] !== null) {
              cIndex = await doc.getPageIndex(cdest[0] as never);
            }
            item.children.push({ title: String(child.title ?? "Untitled"), pageIndex: cIndex });
          } catch {
            // Skip malformed children.
          }
        }
      }
      items.push(item);
    }
    return items;
  } catch {
    return [];
  }
}

/* ------------------------- Text extraction + caching ------------------------ */

type TextCacheEntry = {
  pages: Map<number, string>;
  allPagesLoaded: boolean;
};

const textCaches = new Map<string, TextCacheEntry>();

function cacheFor(url: string): TextCacheEntry {
  let entry = textCaches.get(url);
  if (!entry) {
    entry = { pages: new Map(), allPagesLoaded: false };
    textCaches.set(url, entry);
  }
  return entry;
}

/** Get (and cache) the text of one page. */
export async function getPageText(doc: PDFDocumentProxy, url: string, pageNumber: number): Promise<string> {
  const cache = cacheFor(url);
  const cached = cache.pages.get(pageNumber);
  if (cached !== undefined) return cached;
  try {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    cache.pages.set(pageNumber, text);
    return text;
  } catch {
    return "";
  }
}

/**
 * Extract text for all pages (chunked to keep the UI responsive) and cache it.
 * Used for in-book search; subsequent searches run against the cache.
 */
export async function extractAllText(
  doc: PDFDocumentProxy,
  url: string,
  onProgress?: (done: number, total: number) => void
): Promise<Map<number, string>> {
  const cache = cacheFor(url);
  if (cache.allPagesLoaded) return cache.pages;

  const total = doc.numPages;
  const CHUNK = 8;
  for (let start = 1; start <= total; start += CHUNK) {
    const end = Math.min(start + CHUNK - 1, total);
    await Promise.all(
      Array.from({ length: end - start + 1 }, (_, i) => getPageText(doc, url, start + i))
    );
    onProgress?.(end, total);
  }
  cache.allPagesLoaded = true;
  return cache.pages;
}
