import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS } from "@/config/env";
import { mapAuthor, mapBook, mapCategory, mapReadingProgress } from "@/lib/appwrite/mappers";
import type { Author, Book, Category, ReadingProgress } from "@/types";
import type { BooksQuery } from "@/lib/books/types";
import type { SessionUser } from "@/lib/auth/session";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "main";

const BOOKS = COLLECTIONS.books;
const AUTHORS = COLLECTIONS.authors;
const CATEGORIES = COLLECTIONS.categories;
const PROGRESS = COLLECTIONS.readingProgress;

function publishedFilter(): string[] {
  return [Query.equal("status", "published")];
}

export async function listBooks(
  params: BooksQuery = {},
  viewer: SessionUser | null = null
): Promise<{ documents: Book[]; total: number }> {
  const isAdmin = !!viewer?.isAdmin;
  const queries: string[] = [];
  if (!isAdmin || !params.includeDrafts) queries.push(...publishedFilter());
  if (params.categoryId) queries.push(Query.equal("categoryId", params.categoryId));
  if (params.authorId) queries.push(Query.equal("authorId", params.authorId));
  if (params.language) queries.push(Query.equal("language", params.language));
  if (params.featured === true) queries.push(Query.equal("isFeatured", true));
  if (params.q) queries.push(Query.search("search_text", params.q));
  if (params.sort === "title") queries.push(Query.orderAsc("title"));
  else if (params.sort === "oldest") queries.push(Query.orderAsc("createdAt"));
  else queries.push(Query.orderDesc("createdAt"));
  queries.push(Query.limit(params.limit ?? 24));
  queries.push(Query.offset(params.offset ?? 0));

  const { databases } = createAdminClient();
  const res = await databases.listDocuments({ databaseId: DB_ID, collectionId: BOOKS, queries });
  return { documents: res.documents.map(mapBook), total: res.total };
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: BOOKS,
    queries: [Query.limit(2), ...publishedFilter(), Query.equal("slug", slug)],
  });
  return res.documents.length ? mapBook(res.documents[0]) : null;
}

export async function getBookById(id: string): Promise<Book | null> {
  const { databases } = createAdminClient();
  try {
    const doc = await databases.getDocument({ databaseId: DB_ID, collectionId: BOOKS, documentId: id });
    return mapBook(doc);
  } catch {
    return null;
  }
}

export async function listCategories(): Promise<Category[]> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: CATEGORIES,
    queries: [Query.limit(50), Query.orderAsc("name")],
  });
  return res.documents.map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: CATEGORIES,
    queries: [Query.limit(2), Query.equal("slug", slug)],
  });
  return res.documents.length ? mapCategory(res.documents[0]) : null;
}

export async function listAuthors(limit = 60): Promise<Author[]> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: AUTHORS,
    queries: [Query.limit(limit), Query.orderAsc("name")],
  });
  return res.documents.map(mapAuthor);
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: AUTHORS,
    queries: [Query.limit(2), Query.equal("slug", slug)],
  });
  return res.documents.length ? mapAuthor(res.documents[0]) : null;
}

export async function getProgress(userId: string, bookId: string): Promise<ReadingProgress | null> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments({
    databaseId: DB_ID,
    collectionId: PROGRESS,
    queries: [Query.limit(2), Query.equal("userId", userId), Query.equal("bookId", bookId)],
  });
  return res.documents.length ? mapReadingProgress(res.documents[0]) : null;
}

/** Progress map for the current user across all their books. */
export async function getUserProgressMap(userId: string): Promise<Map<string, ReadingProgress>> {
  const { databases } = createAdminClient();
  const map = new Map<string, ReadingProgress>();
  let offset = 0;
  for (;;) {
    const res = await databases.listDocuments({
      databaseId: DB_ID,
      collectionId: PROGRESS,
      queries: [Query.limit(100), Query.offset(offset), Query.equal("userId", userId), Query.orderDesc("lastReadAt")],
    });
    for (const doc of res.documents) {
      const progress = mapReadingProgress(doc);
      map.set(progress.bookId, progress);
    }
    if (res.documents.length < 100) break;
    offset += 100;
  }
  return map;
}

export async function listFeaturedBooks(limit = 8, viewer: SessionUser | null = null): Promise<Book[]> {
  const { documents } = await listBooks({ featured: true, limit, sort: "newest" }, viewer);
  return documents;
}

export { DB_ID as DATABASE_ID };
