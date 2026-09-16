import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUserProgressMap, listBooks, listCategories } from "@/lib/books/service";
import { BookCard } from "@/components/books/book-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, Input, Select } from "@/components/ui";
import { ButtonLink, buttonClasses } from "@/components/ui/button";

export const metadata = { title: "Books" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface Filters {
  q?: string;
  categoryId?: string;
  language?: string;
  sort: "newest" | "oldest" | "title";
  page: number;
}

function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (key: string) => {
    const v = sp[key];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };
  const sort = one("sort");
  return {
    q: one("q"),
    categoryId: one("categoryId"),
    language: one("language"),
    sort: sort === "oldest" || sort === "title" ? sort : "newest",
    page: Math.max(1, Number(one("page")) || 1),
  };
}

export default async function BooksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const user = await getSessionUser().catch(() => null);

  const [result, categories] = await Promise.all([
    listBooks({
      q: filters.q,
      categoryId: filters.categoryId,
      language: filters.language,
      sort: filters.sort,
      limit: PAGE_SIZE,
      offset: (filters.page - 1) * PAGE_SIZE,
    }, user),
    listCategories().catch(() => []),
  ]);

  const { documents: books, total } = result;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const progressMap = user ? await getUserProgressMap(user.id).catch(() => new Map()) : new Map();

  function pageHref(page: number): string {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.language) params.set("language", filters.language);
    params.set("sort", filters.sort);
    params.set("page", String(page));
    return `/books?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title="Books" description={`${total} book${total === 1 ? "" : "s"} in the library`} />

      <form className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="search">
        <Input name="q" placeholder="Search title, author, ISBN…" defaultValue={filters.q} aria-label="Search books" />
        <Select name="categoryId" defaultValue={filters.categoryId ?? ""} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select name="language" defaultValue={filters.language ?? ""} aria-label="Filter by language">
          <option value="">All languages</option>
          {["English", "Spanish", "French", "German", "Portuguese", "Arabic", "Hindi", "Bengali"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Select>
        <Select name="sort" defaultValue={filters.sort} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </Select>
        <input type="hidden" name="page" value="1" />
        <div className="sm:col-span-2 lg:col-span-4">
          <button type="submit" className={buttonClasses("primary", "md")}>Apply filters</button>
        </div>
      </form>

      {books.length === 0 ? (
        <EmptyState
          title="No books found"
          description="Try different filters, or check back soon — the library grows regularly."
          action={<ButtonLink href="/books">Clear filters</ButtonLink>}
        />
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {books.map((book) => {
            const progress = progressMap instanceof Map ? progressMap.get(book.id) : undefined;
            return (
              <BookCard
                key={book.id}
                book={{
                  id: book.id,
                  title: book.title,
                  slug: book.slug,
                  authorName: book.authorName,
                  categoryName: book.categoryName,
                  coverFileId: book.coverFileId,
                  ratingAvg: book.ratingAvg,
                  ratingCount: book.ratingCount,
                }}
                progress={progress ? progress.progressPercentage : undefined}
              />
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
          {filters.page > 1 ? (
            <Link href={pageHref(filters.page - 1)} className={buttonClasses("outline", "sm")}>← Previous</Link>
          ) : null}
          <span className="px-3 text-sm text-muted-foreground">Page {filters.page} of {totalPages}</span>
          {filters.page < totalPages ? (
            <Link href={pageHref(filters.page + 1)} className={buttonClasses("outline", "sm")}>Next →</Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
