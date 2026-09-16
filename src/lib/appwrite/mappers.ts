import type {
  Author,
  Book,
  BookRef,
  Bookmark,
  Category,
  Highlight,
  HighlightColor,
  HighlightPosition,
  HistoryEntry,
  LibraryEntry,
  Note,
  ReadingProgress,
  Review,
  ReviewStatus,
} from "@/types";

type AppwriteDoc = Record<string, unknown>;

function str(doc: AppwriteDoc, key: string, fallback = ""): string {
  const value = doc[key];
  return typeof value === "string" ? value : fallback;
}

function num(doc: AppwriteDoc, key: string, fallback = 0): number {
  const value = doc[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function bool(doc: AppwriteDoc, key: string, fallback = false): boolean {
  const value = doc[key];
  return typeof value === "boolean" ? value : fallback;
}

/** Accepts stored string or already-parsed JSON for positionData. */
function parsePosition(doc: AppwriteDoc): HighlightPosition | null {
  const raw = doc.positionData;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as HighlightPosition).rects)) {
      return parsed as HighlightPosition;
    }
  } catch {
    // Malformed position data — treat as none.
  }
  return null;
}

export function mapBook(doc: AppwriteDoc & { $id: string }): Book {
  return {
    id: doc.$id,
    title: str(doc, "title"),
    slug: str(doc, "slug"),
    description: str(doc, "description"),
    authorId: str(doc, "authorId"),
    categoryId: str(doc, "categoryId"),
    language: str(doc, "language", "English"),
    publicationYear: num(doc, "publicationYear"),
    isbn: str(doc, "isbn"),
    publisher: str(doc, "publisher"),
    pageCount: num(doc, "pageCount"),
    pdfFileId: str(doc, "pdfFileId"),
    coverFileId: str(doc, "coverFileId"),
    tags: Array.isArray(doc.tags) ? (doc.tags as unknown[]).filter((t): t is string => typeof t === "string") : [],
    status: (str(doc, "status", "draft") as Book["status"]) ?? "draft",
    isFeatured: bool(doc, "isFeatured"),
    allowDownload: bool(doc, "allowDownload", true),
    authorName: str(doc, "authorName", "Unknown author"),
    categoryName: str(doc, "categoryName", "Uncategorized"),
    ratingAvg: num(doc, "ratingAvg"),
    ratingCount: num(doc, "ratingCount"),
    readerCount: num(doc, "readerCount"),
    createdAt: str(doc, "createdAt", str(doc, "$createdAt")),
    updatedAt: str(doc, "updatedAt", str(doc, "$updatedAt")),
  };
}

export function mapAuthor(doc: AppwriteDoc & { $id: string }): Author {
  return {
    id: doc.$id,
    name: str(doc, "name"),
    slug: str(doc, "slug"),
    bio: str(doc, "bio"),
    photoFileId: str(doc, "photoFileId"),
    createdAt: str(doc, "createdAt", str(doc, "$createdAt")),
    updatedAt: str(doc, "updatedAt", str(doc, "$updatedAt")),
  };
}

export function mapCategory(doc: AppwriteDoc & { $id: string }): Category {
  return {
    id: doc.$id,
    name: str(doc, "name"),
    slug: str(doc, "slug"),
    description: str(doc, "description"),
    coverFileId: str(doc, "coverFileId"),
    createdAt: str(doc, "createdAt", str(doc, "$createdAt")),
    updatedAt: str(doc, "updatedAt", str(doc, "$updatedAt")),
  };
}

export function mapReadingProgress(doc: AppwriteDoc & { $id: string }): ReadingProgress {
  return {
    id: doc.$id,
    userId: str(doc, "userId"),
    bookId: str(doc, "bookId"),
    currentPage: num(doc, "currentPage", 1),
    totalPages: num(doc, "totalPages"),
    progressPercentage: num(doc, "progressPercentage"),
    startedAt: str(doc, "startedAt", str(doc, "$createdAt")),
    lastReadAt: str(doc, "lastReadAt", str(doc, "$updatedAt")),
    completedAt: str(doc, "completedAt") || null,
  };
}

export function mapBookmark(doc: AppwriteDoc & { $id: string }): Bookmark {
  return {
    id: doc.$id,
    userId: str(doc, "userId"),
    bookId: str(doc, "bookId"),
    pageNumber: num(doc, "pageNumber", 1),
    title: str(doc, "title"),
    createdAt: str(doc, "createdAt", str(doc, "$createdAt")),
  };
}

export function mapNote(doc: AppwriteDoc & { $id: string }): Note {
  return {
    id: doc.$id,
    userId: str(doc, "userId"),
    bookId: str(doc, "bookId"),
    pageNumber: num(doc, "pageNumber", 1),
    content: str(doc, "content"),
    createdAt: str(doc, "createdAt", str(doc, "$createdAt")),
    updatedAt: str(doc, "updatedAt", str(doc, "$updatedAt")),
  };
}

export function mapHighlight(doc: AppwriteDoc & { $id: string }): Highlight {
  return {
    id: doc.$id,
    userId: str(doc, "userId"),
    bookId: str(doc, "bookId"),
    pageNumber: num(doc, "pageNumber", 1),
    selectedText: str(doc, "selectedText"),
    positionData: parsePosition(doc),
    color: (str(doc, "color", "yellow") as HighlightColor) ?? "yellow",
    note: str(doc, "note"),
    createdAt: str(doc, "createdAt", str(doc, "$createdAt")),
  };
}

export function mapLibraryEntry(doc: AppwriteDoc & { $id: string }): LibraryEntry {
  return {
    id: doc.$id,
    userId: str(doc, "userId"),
    bookId: str(doc, "bookId"),
    addedAt: str(doc, "addedAt", str(doc, "$createdAt")),
  };
}

export function mapHistoryEntry(doc: AppwriteDoc & { $id: string }): HistoryEntry {
  return {
    id: doc.$id,
    userId: str(doc, "userId"),
    bookId: str(doc, "bookId"),
    lastPage: num(doc, "lastPage", 1),
    lastReadAt: str(doc, "lastReadAt", str(doc, "$updatedAt")),
  };
}

export function mapReview(doc: AppwriteDoc & { $id: string }): Review {
  return {
    id: doc.$id,
    userId: str(doc, "userId"),
    bookId: str(doc, "bookId"),
    userName: str(doc, "userName", "Reader"),
    rating: num(doc, "rating"),
    review: str(doc, "review"),
    status: (str(doc, "status", "approved") as ReviewStatus) ?? "approved",
    createdAt: str(doc, "createdAt", str(doc, "$createdAt")),
    updatedAt: str(doc, "updatedAt", str(doc, "$updatedAt")),
  };
}

/**
 * Build a lightweight BookRef from a Book document. If `progress` fields are
 * supplied they override defaults (used for progress-aware listings).
 */
export function mapBookRef(book: Book, overrides?: Partial<BookRef>): BookRef {
  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    coverFileId: book.coverFileId,
    authorName: book.authorName,
    pageCount: book.pageCount,
    allowDownload: book.allowDownload,
    status: book.status,
    pdfFileId: book.pdfFileId,
    ...overrides,
  };
}
