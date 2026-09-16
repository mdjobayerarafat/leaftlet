import "server-only";

import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/server";
import { aiJson } from "@/lib/ai/openrouter";
import { COLLECTIONS, BUCKETS } from "@/config/env";
import { fileIdOf } from "@/lib/utils";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "main";

export interface GeneratedMetadata {
  title: string;
  description: string;
  authorName: string;
  categoryName: string;
  language: string;
  publisher: string;
  publicationYear: number;
  pageCount: number;
  isbn: string;
  tags: string[];
}

const SYSTEM = `You are a librarian cataloging books for a digital library.
You will receive the book's title and author (plus, when available, raw text sampled from the PDF).
First identify the exact book edition, using web search when offered. Then produce bibliographic metadata:
Rules:
- title: the book's official title, max 120 chars
- authorName: the primary author
- categoryName: pick ONE best-fit category from this list if plausible, otherwise invent a short one: Programming, Computer Science, Mathematics, Physics, Literature, History, Business, Self Development, Engineering, Science, Poetry, Philosophy, Fiction, Non-fiction
- description: 2-4 sentence factual synopsis of the book based on reliable sources (max 500 chars), neutral tone, no marketing language, no quotes
- language: the book's language as an English name (e.g. "English")
- publisher: the original/first-edition publisher, or "" if unknown
- publicationYear: first publication year as a number, 0 if unknown
- pageCount: typical printed page count for the standard edition, 0 if unknown
- tags: 3-6 short lowercase topical tags
Prefer verifiable data from search results over guesses; when something cannot be determined, return "" or 0 rather than inventing it.
Respond with ONLY a JSON object with exactly these keys:
{"title":"","description":"","authorName":"","categoryName":"","language":"","publisher":"","publicationYear":0,"pageCount":0,"isbn":"","tags":[]}`;

/** Pulls a text sample of the PDF (first pages + any title-page hits). */
async function samplePdfText(pdfFileId: string): Promise<string> {
  // Dynamic import: pdfjs-dist on the server requires node canvas shims we
  // avoid — we only need text, which the legacy build handles headlessly.
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const { storage } = createAdminClient();
  const bytes = await storage.getFileDownload({ bucketId: BUCKETS.bookPdfs, fileId: pdfFileId });
  const data = new Uint8Array(bytes as ArrayBuffer);

  const doc = await getDocument({ data, useSystemFonts: false, isEvalSupported: false, verbosity: 0 }).promise;
  const pagesToRead = Math.min(doc.numPages, 8);
  const chunks: string[] = [];
  for (let page = 1; page <= pagesToRead; page++) {
    try {
      const pdfPage = await doc.getPage(page);
      const content = await pdfPage.getTextContent();
      const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ").replace(/\s+/g, " ").trim();
      if (text) chunks.push(text);
      pdfPage.cleanup();
    } catch {
      // Skip unreadable pages.
    }
  }
  await doc.destroy();
  return chunks.join("\n\n").slice(0, 20_000);
}

/** Generates metadata for a book PDF by id, researching the book online. */
export async function generateBookMetadata(pdfFileId: string): Promise<GeneratedMetadata> {
  const id = fileIdOf(pdfFileId);
  if (!id) throw new Error("No PDF file id provided.");

  // The PDF text is only a hint for identifying the book; the bibliographic
  // data comes from web search (description, year, publisher, page count).
  let textHint = "";
  try {
    textHint = await samplePdfText(id);
  } catch {
    textHint = "";
  }
  const usableHint = textHint.replace(/\s+/g, "").length >= 40 ? textHint : "";

  const fallbackTitle = `Book ${id.slice(0, 6)}`;
  const result = await aiJson<Partial<GeneratedMetadata>>({
    system: SYSTEM,
    user: usableHint
      ? `Identify this book and produce its metadata. Text sampled from the PDF:\n\n${usableHint.slice(0, 12_000)}`
      : "Identify this book from the sampled text and produce its metadata.",
    webSearch: true,
  });

  const str = (value: unknown, max: number, fallback = ""): string => {
    const s = String(value ?? "").trim();
    return s ? s.slice(0, max) : fallback;
  };
  const int = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  };

  return {
    title: str(result.title, 120) || fallbackTitle,
    description: str(result.description, 500),
    authorName: str(result.authorName, 80),
    categoryName: str(result.categoryName, 60),
    language: str(result.language, 40) || "English",
    publisher: str(result.publisher, 80),
    publicationYear: int(result.publicationYear),
    pageCount: int(result.pageCount),
    isbn: str(result.isbn, 20).replace(/[^0-9Xx-]/g, ""),
    tags: Array.isArray(result.tags) ? result.tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6) : [],
  };
}

/** Suggests a category id from the generated category name, if it exists. */
export async function matchCategoryId(name: string): Promise<string> {
  if (!name) return "";
  const { databases } = createAdminClient();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLLECTIONS.categories,
    queries: [Query.equal("slug", [slug])],
  }).catch(() => null);
  return res?.documents[0]?.$id ?? "";
}
