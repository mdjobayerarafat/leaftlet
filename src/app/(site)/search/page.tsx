import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { listAuthors, listBooks, listCategories } from "@/lib/books/service";
import { getBooksWithProgressFor } from "@/lib/books/progress-view";
import { BookCard } from "@/components/books/book-card";
import { SmartSearch } from "@/components/books/smart-search";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, Input, Select } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

interface Filters {
  q: string;
  categoryId?: string;
  language?: string;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const categoryId = typeof sp.categoryId === "string" && sp.categoryId ? sp.categoryId : undefined;
  const language = typeof sp.language === "string" && sp.language ? sp.language : undefined;
  const user = await getSessionUser().catch(() => null);

  const filters: Filters = { q, categoryId, language };

  const trimmed = q.trim();
  const [bookResult, authors, categories] = await Promise.all([
    trimmed || categoryId || language
      ? listBooks({ q: trimmed || undefined, categoryId, language, limit: 36 }, user)
      : Promise.resolve({ documents: [], total: 0 }),
    trimmed ? listAuthors().catch(() => []) : Promise.resolve([]),
    listCategories().catch(() => []),
  ]);

  const lower = trimmed.toLowerCase();
  const matchedAuthors = trimmed ? authors.filter((a) => a.name.toLowerCase().includes(lower)) : [];
  const matchedCategories = trimmed ? categories.filter((c) => c.name.toLowerCase().includes(lower)) : [];
  const withProgress = await getBooksWithProgressFor(user?.id ?? null, bookResult.documents);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title={trimmed ? `Search results for “${trimmed}”` : "Search"} description={trimmed ? `${bookResult.total} book${bookResult.total === 1 ? "" : "s"} found` : "Find books by title, author, ISBN, or description."} />

      <form className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="search">
        <Input name="q" placeholder="Search the library…" defaultValue={q} aria-label="Search query" />
        <Select name="categoryId" defaultValue={categoryId ?? ""} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select name="language" defaultValue={language ?? ""} aria-label="Filter by language">
          <option value="">All languages</option>
          {["English", "Spanish", "French", "German", "Portuguese", "Arabic", "Hindi", "Bengali"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Select>
        <button type="submit" className={buttonClasses("primary", "md")}>Search</button>
      </form>

      <SmartSearch />

      {trimmed && withProgress.length === 0 && matchedAuthors.length === 0 && matchedCategories.length === 0 ? (
        <EmptyState
          title={`No results for “${trimmed}”`}
          description="Check the spelling or try broader terms. Searching covers title, author, description and ISBN."
        />
      ) : null}

      {matchedAuthors.length > 0 ? (
        <section className="mb-10" aria-labelledby="authors-results">
          <h2 id="authors-results" className="mb-4 text-lg font-semibold text-foreground">Authors</h2>
          <div className="flex flex-wrap gap-2">
            {matchedAuthors.map((author) => (
              <Link key={author.id} href={`/authors/${author.slug}`} className={buttonClasses("outline", "sm")}>
                {author.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {matchedCategories.length > 0 ? (
        <section className="mb-10" aria-labelledby="categories-results">
          <h2 id="categories-results" className="mb-4 text-lg font-semibold text-foreground">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {matchedCategories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`} className={buttonClasses("outline", "sm")}>
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {withProgress.length > 0 ? (
        <section aria-labelledby="books-results">
          <h2 id="books-results" className="mb-6 text-lg font-semibold text-foreground">Books</h2>
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {withProgress.map(({ book, progress }) => (
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
                progress={progress?.progressPercentage ?? undefined}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
