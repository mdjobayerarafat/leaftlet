import "server-only";

import { createAdminClient } from "@/lib/appwrite/server";
import { aiJson } from "@/lib/ai/openrouter";
import { COLLECTIONS } from "@/config/env";
import { mapBook } from "@/lib/appwrite/mappers";
import { Query } from "node-appwrite";
import type { Book } from "@/types";
import type { SessionUser } from "@/lib/auth/session";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "main";

/** Compact catalog snapshot sent to the model (id + the fields it ranks on). */
interface CatalogEntry {
  id: string;
  title: string;
  authorName: string;
  categoryName: string;
  language: string;
  description: string;
  tags: string[];
}

/** Loads up to `limit` published books for grounding. */
async function catalogSnapshot(limit = 60): Promise<CatalogEntry[]> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLLECTIONS.books,
    queries: [Query.equal("status", "published"), Query.limit(limit)],
  });
  return res.documents.map((doc) => {
    const book = mapBook(doc);
    return {
      id: book.id,
      title: book.title,
      authorName: book.authorName,
      categoryName: book.categoryName,
      language: book.language,
      description: book.description.slice(0, 220),
      tags: book.tags,
    };
  });
}

function renderCatalog(entries: CatalogEntry[]): string {
  return entries
    .map(
      (e) =>
        `- id: ${e.id} | title: ${e.title} | author: ${e.authorName} | category: ${e.categoryName} | language: ${e.language} | tags: ${e.tags.join(", ") || "none"} | description: ${e.description || "none"}`
    )
    .join("\n");
}

/** Keeps only published, non-excluded books, in the model's ranking order. */
function pickRankedBooks(ids: unknown, catalog: CatalogEntry[], exclude: Set<string>, max: number): CatalogEntry[] {
  if (!Array.isArray(ids)) return [];
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const picked: CatalogEntry[] = [];
  for (const raw of ids) {
    const entry = byId.get(String(raw));
    if (!entry || exclude.has(entry.id) || picked.some((p) => p.id === entry.id)) continue;
    picked.push(entry);
    if (picked.length >= max) break;
  }
  return picked;
}

/* ----------------------------- Recommendations ----------------------------- */

const RECOMMEND_SYSTEM = `You are a librarian recommending books from THIS library's catalog.
You get the catalog plus the reader's history. Recommend books from the catalog ONLY — never invent ids.
Rank by genuine fit to the reader's interests. Skip the books the reader already has in their history.
Respond with ONLY JSON: {"ids":["..."],"reason":"one short sentence (max 140 chars) explaining the theme of your picks"}`;

export interface RecommendationResult {
  books: Book[];
  reason: string;
}

export async function recommendForUser(book: Book, historyTitles: string[], max = 4): Promise<RecommendationResult> {
  const catalog = await catalogSnapshot();
  if (catalog.length <= 1) return { books: [], reason: "" };

  const exclude = new Set<string>([book.id]);
  const result = await aiJson<{ ids?: string[]; reason?: string }>({
    system: RECOMMEND_SYSTEM,
    user: `Catalog:\n${renderCatalog(catalog)}\n\nCurrent book: "${book.title}" by ${book.authorName} (category: ${book.categoryName}).\nReader's recently read books: ${historyTitles.slice(0, 12).join("; ") || "none yet"}.`,
    maxChars: 20_000,
  });

  return {
    books: pickRankedBooks(result.ids, catalog, exclude, max).map((e) => ({ ...emptyBook(), ...e } as Book),
    ),
    reason: String(result.reason ?? "").slice(0, 140),
  };
}

/** Catalog entries carry display fields only; fill the rest with neutral defaults for the card UI. */
function emptyBook(): Partial<Book> {
  return {
    slug: "",
    description: "",
    authorId: "",
    categoryId: "",
    isbn: "",
    publisher: "",
    pageCount: 0,
    pdfFileId: "",
    coverFileId: "",
    status: "published",
    isFeatured: false,
    allowDownload: false,
    ratingAvg: 0,
    ratingCount: 0,
    readerCount: 0,
    createdAt: "",
    updatedAt: "",
  };
}

/* ------------------------------- Smart search ------------------------------ */

const SMART_SEARCH_SYSTEM = `You match a reader's natural-language request to books in THIS library's catalog.
Consider meaning, topics, difficulty hints ("beginner-friendly"), tone, and language.
Rank the best matches first. Use ONLY ids from the catalog. If nothing fits, return an empty list.
Respond with ONLY JSON: {"ids":["..."],"interpreted":"the reader's intent restated in max 80 chars"}`;

export interface SmartSearchResult {
  books: Book[];
  interpreted: string;
}

export async function smartSearch(query: string, max = 12): Promise<SmartSearchResult> {
  const catalog = await catalogSnapshot();
  if (catalog.length === 0) return { books: [], interpreted: "" };

  const result = await aiJson<{ ids?: string[]; interpreted?: string }>({
    system: SMART_SEARCH_SYSTEM,
    user: `Catalog:\n${renderCatalog(catalog)}\n\nReader's request: "${query.slice(0, 300)}"`,
    maxChars: 20_000,
  });

  return {
    books: pickRankedBooks(result.ids, catalog, new Set(), max).map((e) => ({ ...emptyBook(), ...e } as Book)),
    interpreted: String(result.interpreted ?? "").slice(0, 80),
  };
}

/* ------------------------------ Ask before read ---------------------------- */

const ASK_SYSTEM = `You answer reader questions about a specific book, before they read it.
You get the book's metadata and the library catalog. Answer briefly (max 90 words), factually, and helpfully:
reading time estimates from page count (assume ~250 words/page), difficulty, what the book covers, who it suits.
If the question is about something the book does not determine (e.g. exact price elsewhere), say you don't know.
Respond with ONLY JSON: {"answer":""}`;

export async function askAboutBook(book: Book, question: string): Promise<string> {
  const trimmed = question.trim().slice(0, 500);
  if (!trimmed) throw new Error("Type a question first.");

  const result = await aiJson<{ answer?: string }>({
    system: ASK_SYSTEM,
    user: `Book: "${book.title}" by ${book.authorName}\nCategory: ${book.categoryName} | Language: ${book.language} | Pages: ${book.pageCount || "unknown"} | Published: ${book.publicationYear || "unknown"} | Publisher: ${book.publisher || "unknown"}\nDescription: ${book.description || "none"}\nTags: ${book.tags.join(", ") || "none"}\n\nReader's question: ${trimmed}`,
    webSearch: true,
    maxChars: 4_000,
  });

  const answer = String(result.answer ?? "").trim();
  if (!answer) throw new Error("The AI could not answer that. Try rephrasing.");
  return answer.slice(0, 900);
}

/** Reader's recently read titles (for personalizing recommendations). */
export async function recentHistoryTitles(userId: string, limit = 12): Promise<string[]> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLLECTIONS.readingHistory,
    queries: [Query.equal("userId", userId), Query.orderDesc("lastReadAt"), Query.limit(limit)],
  });
  const titles: string[] = [];
  for (const doc of res.documents) {
    try {
      const bookDoc = await databases.getDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.books, documentId: String(doc.bookId ?? "") });
      titles.push(String(bookDoc.title ?? "").slice(0, 80));
    } catch {
      // Book may have been deleted; skip.
    }
  }
  return titles;
}
