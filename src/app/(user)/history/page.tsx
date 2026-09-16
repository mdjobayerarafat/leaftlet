import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getBookById, getUserProgressMap } from "@/lib/books/service";
import { listHistory } from "@/lib/reading/service";
import { BookCover } from "@/components/books/book-cover";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, ProgressBar } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { HistoryRow } from "./history-row";
import { formatRelativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reading history" };

export default async function HistoryPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");

  const history = await listHistory(user.id, 60).catch(() => []);
  const books = await Promise.all(history.map((entry) => getBookById(entry.bookId)));
  const progressMap = await getUserProgressMap(user.id).catch(() => new Map());

  const rows = history
    .map((entry, i) => ({ entry, book: books[i] }))
    .filter((row): row is { entry: typeof history[number]; book: NonNullable<typeof books[number]> } => row.book !== null);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title="Reading history" description="Books you've opened recently." />

      {rows.length === 0 ? (
        <EmptyState
          title="No reading history yet"
          description="Open a book and it will show up here so you can jump back in."
          action={<ButtonLink href="/books">Browse books</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ entry, book }) => {
            const progress = progressMap.get(book.id);
            return (
              <li key={entry.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <BookCover fileId={book.coverFileId} title={book.title} author={book.authorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link href={`/books/${book.slug}`} className="truncate font-medium text-foreground hover:underline">{book.title}</Link>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(entry.lastReadAt)} · page {entry.lastPage}
                    {progress ? ` · ${progress.progressPercentage}%` : ""}
                  </p>
                  {progress ? <ProgressBar value={progress.progressPercentage} className="mt-2 max-w-52" /> : null}
                </div>
                <HistoryRow entryId={entry.id} bookId={book.id} lastPage={entry.lastPage} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
