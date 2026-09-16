import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark as BookmarkIcon } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getBookById } from "@/lib/books/service";
import { listBookmarks } from "@/lib/reading/service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, Input, Textarea } from "@/components/ui";
import { BookmarkRow } from "./bookmark-row";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");

  const bookmarks = await listBookmarks(user.id).catch(() => []);
  const books = await Promise.all(bookmarks.map((b) => getBookById(b.bookId)));

  const rows = bookmarks
    .map((bookmark, i) => ({ bookmark, book: books[i] }))
    .filter((row): row is { bookmark: typeof bookmarks[number]; book: NonNullable<typeof books[number]> } => row.book !== null)
    .sort((a, b) => (a.bookmark.createdAt < b.bookmark.createdAt ? 1 : -1));

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title="My bookmarks" description="Pages you've flagged while reading." />

      {rows.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon className="h-10 w-10" />}
          title="No bookmarks yet"
          description="Bookmark important pages while reading — they'll be waiting for you here."
          action={<Link href="/books" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Browse books</Link>}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ bookmark, book }) => (
            <BookmarkRow key={bookmark.id} bookmark={bookmark} book={book} />
          ))}
        </ul>
      )}
    </div>
  );
}
