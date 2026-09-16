import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getBookById, getUserProgressMap } from "@/lib/books/service";
import { listHistory } from "@/lib/reading/service";
import { BookCover } from "@/components/books/book-cover";
import { PageHeader } from "@/components/layout/page-header";
import { Card, ProgressBar } from "@/components/ui";
import { formatRelativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");

  const [progressMap, history] = await Promise.all([
    getUserProgressMap(user.id).catch(() => new Map()),
    listHistory(user.id, 10).catch(() => []),
  ]);

  const all = [...progressMap.values()];
  const completed = all.filter((p) => p.progressPercentage >= 98).length;
  const started = all.filter((p) => p.progressPercentage > 0).length;
  const reading = all.filter((p) => p.progressPercentage > 0 && p.progressPercentage < 98).length;
  const pagesRead = all.reduce((sum, p) => sum + Math.max(0, p.currentPage - 1), 0);

  const recentEntries = await Promise.all(history.slice(0, 6).map((entry) => getBookById(entry.bookId)));
  const recent = history
    .map((entry, i) => ({ entry, book: recentEntries[i] }))
    .filter((row): row is { entry: typeof history[number]; book: NonNullable<typeof recentEntries[number]> } => row.book !== null);

  const stats = [
    { label: "Books started", value: started },
    { label: "Books completed", value: completed },
    { label: "Currently reading", value: reading },
    { label: "Pages read", value: pagesRead.toLocaleString("en-US") },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title="Profile" />

      <Card className="flex items-center gap-4 p-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-2xl font-bold text-primary" aria-hidden>
          {(user.name || user.email).slice(0, 1).toUpperCase()}
        </span>
        <div>
          <p className="text-lg font-semibold text-foreground">{user.name || "Reader"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.isAdmin ? <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">Administrator</span> : null}
        </div>
      </Card>

      <section className="mt-8" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="mb-4 text-lg font-semibold text-foreground">Reading statistics</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {recent.length > 0 ? (
        <section className="mt-10" aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="mb-4 text-lg font-semibold text-foreground">Recent activity</h2>
          <ul className="space-y-2">
            {recent.map(({ entry, book }) => {
              const progress = progressMap.get(book.id);
              return (
                <li key={entry.id}>
                  <Link href={`/read/${book.id}?page=${entry.lastPage}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40">
                    <BookCover fileId={book.coverFileId} title={book.title} author={book.authorName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeDate(entry.lastReadAt)} · page {entry.lastPage}</p>
                      {progress ? <ProgressBar value={progress.progressPercentage} className="mt-1.5 max-w-48" /> : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
