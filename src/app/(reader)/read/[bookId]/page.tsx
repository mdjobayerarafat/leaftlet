import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getBookById, getProgress } from "@/lib/books/service";
import { listBookmarks, listNotes } from "@/lib/reading/service";
import { EbookReader } from "@/components/reader/ebook-reader";
import { DEFAULT_READER_PREFS, type ReaderPrefs } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reader" };

const PREFS_COOKIE = "ebookd-reader-prefs";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bookId } = await params;
  const sp = await searchParams;
  const user = await getSessionUser().catch(() => null);

  const book = await getBookById(bookId).catch(() => null);
  if (!book) notFound();

  if (book.status !== "published" && !user?.isAdmin) notFound();

  const [progress, bookmarks, notes] = await Promise.all([
    user ? getProgress(user.id, book.id).catch(() => null) : Promise.resolve(null),
    user ? listBookmarks(user.id, book.id).catch(() => []) : Promise.resolve([]),
    user ? listNotes(user.id, book.id).catch(() => []) : Promise.resolve([]),
  ]);

  const cookieStore = await cookies();
  let prefs: ReaderPrefs = { ...DEFAULT_READER_PREFS };
  try {
    const raw = cookieStore.get(PREFS_COOKIE)?.value;
    if (raw) prefs = { ...prefs, ...(JSON.parse(raw) as Partial<ReaderPrefs>) };
  } catch {
    prefs = { ...DEFAULT_READER_PREFS };
  }
  if (prefs.theme === "sepia" || prefs.theme === "dark") {
    // Reader theme is applied client-side by the reader shell.
  }

  const pageParam = typeof sp.page === "string" ? Number(sp.page) : NaN;
  const deepLinkedPage = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : null;
  const initialPage = deepLinkedPage ?? progress?.currentPage ?? 1;

  return (
    <EbookReader
      book={{
        id: book.id,
        title: book.title,
        authorName: book.authorName,
        pdfFileId: book.pdfFileId,
        pageCount: book.pageCount,
        allowDownload: book.allowDownload,
        slug: book.slug,
      }}
      authed={!!user}
      initialPage={initialPage}
      initialProgressPage={deepLinkedPage ? null : (progress?.currentPage ?? null)}
      prefs={prefs}
      bookmarks={bookmarks}
      notes={notes}
    />
  );
}
