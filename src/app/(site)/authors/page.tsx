import Link from "next/link";
import { listAuthors } from "@/lib/books/service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Authors" };
export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default async function AuthorsPage() {
  const authors = await listAuthors().catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title="Authors" description="The people behind the books." />
      {authors.length === 0 ? (
        <EmptyState title="No authors yet" description="Authors added by administrators will appear here." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {authors.map((author) => (
            <Link
              key={author.id}
              href={`/authors/${author.slug}`}
              className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
            >
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary" aria-hidden>
                {initials(author.name)}
              </span>
              <span className="text-sm font-semibold text-foreground">{author.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
