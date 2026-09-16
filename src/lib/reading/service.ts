import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/config/env";
import {
  mapBookmark,
  mapHistoryEntry,
  mapLibraryEntry,
  mapNote,
  mapReadingProgress,
} from "@/lib/appwrite/mappers";
import { progressPercent } from "@/lib/utils";
import type { Bookmark, HistoryEntry, LibraryEntry, Note, ReadingProgress } from "@/types";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "main";

const PROGRESS = COLLECTIONS.readingProgress;
const BOOKMARKS = COLLECTIONS.bookmarks;
const NOTES = COLLECTIONS.notes;
const LIBRARY = COLLECTIONS.userLibrary;
const HISTORY = COLLECTIONS.readingHistory;

function assertOwned(userId: string, docUserId: string) {
  if (userId !== docUserId) throw new Error("FORBIDDEN");
}

/* ----------------------------- Reading progress ---------------------------- */

export interface ProgressUpdate {
  userId: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
}

/** Upsert progress for (userId, bookId). Throttled updates are handled by callers. */
export async function upsertProgress({ userId, bookId, currentPage, totalPages }: ProgressUpdate): Promise<ReadingProgress> {
  const { databases } = createAdminClient();
  const percentage = progressPercent(currentPage, totalPages);
  const existing = await findProgress(userId, bookId);

  if (existing) {
    const isAhead = currentPage >= existing.currentPage;
    const completedAt =
      percentage >= 99 && !existing.completedAt ? new Date().toISOString() : existing.completedAt;
    const updated = await databases.updateDocument({
      databaseId: DB_ID,
      collectionId: PROGRESS,
      documentId: existing.id,
      data: {
        currentPage: isAhead ? currentPage : existing.currentPage,
        totalPages,
        progressPercentage: Math.max(percentage, existing.progressPercentage),
        lastReadAt: new Date().toISOString(),
        completedAt,
      },
    });
    return mapReadingProgress(updated);
  }

  const now = new Date().toISOString();
  const created = await databases.createDocument({
    databaseId: DB_ID,
    collectionId: PROGRESS,
    documentId: "unique()",
    data: {
      userId,
      bookId,
      currentPage,
      totalPages,
      progressPercentage: percentage,
      startedAt: now,
      lastReadAt: now,
      completedAt: null,
    },
  });
  return mapReadingProgress(created);
}

async function findProgress(userId: string, bookId: string): Promise<ReadingProgress | null> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: PROGRESS,
    queries: [Query.limit(2), Query.equal("userId", userId), Query.equal("bookId", bookId)],
  });
  return res.documents.length ? mapReadingProgress(res.documents[0]) : null;
}

/* --------------------------------- History --------------------------------- */

export async function recordHistory(userId: string, bookId: string, lastPage: number): Promise<void> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: HISTORY,
    queries: [Query.limit(2), Query.equal("userId", userId), Query.equal("bookId", bookId)],
  });
  const now = new Date().toISOString();
  if (res.documents.length) {
    await databases.updateDocument({
      databaseId: DB_ID,
      collectionId: HISTORY,
      documentId: res.documents[0].$id,
      data: { lastPage, lastReadAt: now },
    });
  } else {
    await databases.createDocument({
      databaseId: DB_ID,
      collectionId: HISTORY,
      documentId: "unique()",
      data: { userId, bookId, lastPage, lastReadAt: now },
    });
  }
}

export async function listHistory(userId: string, limit = 50): Promise<HistoryEntry[]> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: HISTORY,
    queries: [Query.limit(limit), Query.equal("userId", userId), Query.orderDesc("lastReadAt")],
  });
  return res.documents.map(mapHistoryEntry);
}

export async function removeHistory(userId: string, entryId: string): Promise<void> {
  const { databases } = createAdminClient();
  const doc = await databases.getDocument({ databaseId: DB_ID, collectionId: HISTORY, documentId: entryId });
  assertOwned(userId, String(doc.userId));
  await databases.deleteDocument({ databaseId: DB_ID, collectionId: HISTORY, documentId: entryId });
}

/* -------------------------------- Bookmarks -------------------------------- */

export async function listBookmarks(userId: string, bookId?: string): Promise<Bookmark[]> {
  const { databases } = createAdminClient();
  const queries = [Query.limit(100), Query.equal("userId", userId), Query.orderDesc("createdAt")];
  if (bookId) queries.push(Query.equal("bookId", bookId));
  const res = await databases.listDocuments({ databaseId: DB_ID, collectionId: BOOKMARKS, queries });
  return res.documents.map(mapBookmark);
}

export async function addBookmark(userId: string, bookId: string, pageNumber: number, title: string): Promise<Bookmark> {
  const { databases } = createAdminClient();
  const created = await databases.createDocument({
    databaseId: DB_ID,
    collectionId: BOOKMARKS,
    documentId: "unique()",
    data: { userId, bookId, pageNumber, title },
  });
  return mapBookmark(created);
}

export async function removeBookmark(userId: string, bookmarkId: string): Promise<void> {
  const { databases } = createAdminClient();
  const doc = await databases.getDocument({ databaseId: DB_ID, collectionId: BOOKMARKS, documentId: bookmarkId });
  assertOwned(userId, String(doc.userId));
  await databases.deleteDocument({ databaseId: DB_ID, collectionId: BOOKMARKS, documentId: bookmarkId });
}

/* ---------------------------------- Notes ---------------------------------- */

export async function listNotes(userId: string, bookId?: string): Promise<Note[]> {
  const { databases } = createAdminClient();
  const queries = [Query.limit(100), Query.equal("userId", userId), Query.orderDesc("updatedAt")];
  if (bookId) queries.push(Query.equal("bookId", bookId));
  const res = await databases.listDocuments({ databaseId: DB_ID, collectionId: NOTES, queries });
  return res.documents.map(mapNote);
}

export async function createNote(userId: string, bookId: string, pageNumber: number, content: string): Promise<Note> {
  const { databases } = createAdminClient();
  const now = new Date().toISOString();
  const created = await databases.createDocument({
    databaseId: DB_ID,
    collectionId: NOTES,
    documentId: "unique()",
    data: { userId, bookId, pageNumber, content, createdAt: now, updatedAt: now },
  });
  return mapNote(created);
}

export async function updateNote(userId: string, noteId: string, content: string): Promise<Note> {
  const { databases } = createAdminClient();
  const doc = await databases.getDocument({ databaseId: DB_ID, collectionId: NOTES, documentId: noteId });
  assertOwned(userId, String(doc.userId));
  const updated = await databases.updateDocument({
    databaseId: DB_ID,
    collectionId: NOTES,
    documentId: noteId,
    data: { content, updatedAt: new Date().toISOString() },
  });
  return mapNote(updated);
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const { databases } = createAdminClient();
  const doc = await databases.getDocument({ databaseId: DB_ID, collectionId: NOTES, documentId: noteId });
  assertOwned(userId, String(doc.userId));
  await databases.deleteDocument({ databaseId: DB_ID, collectionId: NOTES, documentId: noteId });
}

/* ------------------------------- User library ------------------------------ */

export async function listLibrary(userId: string): Promise<LibraryEntry[]> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: LIBRARY,
    queries: [Query.limit(200), Query.equal("userId", userId), Query.orderDesc("addedAt")],
  });
  return res.documents.map(mapLibraryEntry);
}

export async function isInLibrary(userId: string, bookId: string): Promise<boolean> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: LIBRARY,
    queries: [Query.limit(2), Query.equal("userId", userId), Query.equal("bookId", bookId)],
  });
  return res.documents.length > 0;
}

export async function addToLibrary(userId: string, bookId: string): Promise<void> {
  if (await isInLibrary(userId, bookId)) return;
  const { databases } = createAdminClient();
  await databases.createDocument({
    databaseId: DB_ID,
    collectionId: LIBRARY,
    documentId: "unique()",
    data: { userId, bookId, addedAt: new Date().toISOString() },
  });
}

export async function removeFromLibrary(userId: string, bookId: string): Promise<void> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: LIBRARY,
    queries: [Query.limit(2), Query.equal("userId", userId), Query.equal("bookId", bookId)],
  });
  for (const doc of res.documents) {
    await databases.deleteDocument({ databaseId: DB_ID, collectionId: LIBRARY, documentId: doc.$id });
  }
}
