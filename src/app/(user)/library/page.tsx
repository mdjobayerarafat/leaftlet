import Link from "next/link";
import { redirect } from "next/navigation";
import { getBookById, getUserProgressMap } from "@/lib/books/service";
import { listLibrary } from "@/lib/reading/service";
import { getSessionUser } from "@/lib/auth/session";
import { BookCover } from "@/components/books/book-cover";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, ProgressBar } from "@/components/ui";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "My library" };

export default async function LibraryPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");

  const entries = await listLibrary(user.id).catch(() => []);
  const progressMap = await getUserProgressMap(user.id).catch(() => new Map());

  const books = await Promise.all(entries.map((entry) => getBookById(entry.bookId)));
  const valid = entries
    .map((entry, i) => ({ entry, book: books[i] }))
    .filter((item): item is { entry: typeof entries[number]; book: NonNullable<typeof books[number]> } => item.book !== null);

  const reading = valid
    .filter(({ book }) => {
      const progress = progressMap.get(book.id);
      return progress && progress.progressPercentage < 98 && progress.progressPercentage > 0;
    })
    .sort((a, b) => {
      const pa = progressMap.get(a.book.id)!.lastReadAt;
      const pb = progressMap.get(b.book.id)!.lastReadAt;
      return pa < pb ? 1 : -1;
    });

  const notStarted = valid.filter(({ book }) => !progressMap.get(book.id));
  const completed = valid.filter(({ book }) => (progressMap.get(book.id)?.progressPercentage ?? 0) >= 98);

  function BookRow({ book, progress }: { book: NonNullable<typeof books[number]>; progress?: { currentPage: number; totalPages: number; progressPercentage: number; lastReadAt?: string } }) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <BookCover fileId={book.coverFileId} title={book.title} author={book.authorName} size="md" />
        <div className="min-w-0 flex-1">
          <Link href={`/books/${book.slug}`} className="font-semibold text-foreground hover:underline">{book.title}</Link>
          <p className="truncate text-sm text-muted-foreground">{book.authorName}</p>
          {progress ? (
            <div className="mt-2 max-w-56">
              <ProgressBar value={progress.progressPercentage} />
              <p className="mt-1 text-xs text-muted-foreground">
                Page {progress.currentPage} of {progress.totalPages || book.pageCount || "?"} · {progress.progressPercentage}%
                {progress.lastReadAt ? ` · ${formatRelativeDate(progress.lastReadAt)}` : ""}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Not started</p>
          )}
        </div>
        <Link href={`/read/${book.id}`} className={buttonClasses("primary", "sm", "shrink-0")}>
          {progress ? "Continue →" : "Read →"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title="My library" description="Books you've saved and your reading progress." />

      {valid.length === 0 ? (
        <EmptyState
          title="Your library is empty"
          description="Start discovering books and build your personal collection."
          action={<ButtonLink href="/books">Browse books</ButtonLink>}
        />
      ) : (
        <div className="space-y-10">
          {reading.length > 0 ? (
            <section aria-labelledby="lib-reading">
              <h2 id="lib-reading" className="mb-4 text-lg font-semibold text-foreground">Continue reading</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {reading.map(({ book }) => {
                  const progress = progressMap.get(book.id)!;
                  return <BookRow key={book.id} book={book} progress={progress} />;
                })}
              </div>
            </section>
          ) : null}

          {notStarted.length > 0 ? (
            <section aria-labelledby="lib-saved">
              <h2 id="lib-saved" className="mb-4 text-lg font-semibold text-foreground">Saved books</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {notStarted.map(({ book }) => <BookRow key={book.id} book={book} />)}
              </div>
            </section>
          ) : null}

          {completed.length > 0 ? (
            <section aria-labelledby="lib-completed">
              <h2 id="lib-completed" className="mb-4 text-lg font-semibold text-foreground">Completed</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {completed.map(({ book }) => {
                  const progress = progressMap.get(book.id)!;
                  return <BookRow key={book.id} book={book} progress={progress} />;
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
