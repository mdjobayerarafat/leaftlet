import { getUserProgressMap } from "@/lib/books/service";
import type { Book, ReadingProgress } from "@/types";

export interface BookWithProgress {
  book: Book;
  progress: ReadingProgress | null;
}

/** Join a list of books with the viewer's reading progress (no-op when signed out). */
export async function getBooksWithProgressFor(userId: string | null, books: Book[]): Promise<BookWithProgress[]> {
  if (!userId || books.length === 0) return books.map((book) => ({ book, progress: null }));
  const map = await getUserProgressMap(userId).catch(() => new Map<string, ReadingProgress>());
  return books.map((book) => ({ book, progress: map.get(book.id) ?? null }));
}
