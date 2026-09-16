import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getBookById, getUserProgressMap, listBooks, listCategories, listFeaturedBooks } from "@/lib/books/service";
import { BookCard } from "@/components/books/book-card";
import { BookCover } from "@/components/books/book-cover";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser().catch(() => null);

  const [featured, recentResult, categories] = await Promise.all([
    listFeaturedBooks(4, user),
    listBooks({ limit: 8, sort: "newest" }, user),
    listCategories().catch(() => [] as Awaited<ReturnType<typeof listCategories>>),
  ]);
  const recent = recentResult.documents;

  // Continue-reading entries for signed-in users (most recent first).
  let continueReading: Array<{ id: string; slug: string; title: string; authorName: string; coverFileId: string; progress: number }> = [];
  if (user) {
    try {
      const progressMap = await getUserProgressMap(user.id);
      const entries = [...progressMap.values()]
        .filter((p) => p.progressPercentage < 98)
        .sort((a, b) => (a.lastReadAt < b.lastReadAt ? 1 : -1))
        .slice(0, 4);
      const books = await Promise.all(entries.map((p) => getBookById(p.bookId)));
      continueReading = entries
        .map((p, i) => {
          const book = books[i];
          if (!book) return null;
          return {
            id: book.id,
            slug: book.slug,
            title: book.title,
            authorName: book.authorName,
            coverFileId: book.coverFileId,
            progress: p.progressPercentage,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    } catch {
      continueReading = [];
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="border-b-2 border-border py-14 sm:py-16">
        <div className="max-w-2xl">
          <h1 className="heading-mono text-4xl leading-tight sm:text-5xl">
            Your digital library, anywhere.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover books, open them in a comfortable reader, and pick up exactly where you left off — on any device.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/books" size="lg">Browse books</ButtonLink>
            <ButtonLink href="/search" size="lg" variant="outline">Search the library</ButtonLink>
          </div>
        </div>
      </section>

      {/* Continue reading */}
      {continueReading.length > 0 ? (
        <section className="py-12" aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="mb-6 text-xl font-semibold text-foreground">Continue reading</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {continueReading.map((entry) => (
              <Link
                key={entry.id}
                href={`/read/${entry.id}`}
                className="group flex items-center gap-4 rounded-[3px] border-2 border-border bg-card p-4 shadow-pop-sm transition-shadow hover:shadow-pop"
              >
                <BookCover fileId={entry.coverFileId} title={entry.title} author={entry.authorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{entry.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{entry.authorName}</p>
                  <ProgressBar value={entry.progress} className="mt-2" />
                  <p className="mt-1 text-xs text-muted-foreground">{entry.progress}% · continue →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Featured */}
      {featured.length > 0 ? (
        <section className="py-12" aria-labelledby="featured-heading">
          <div className="mb-6 flex items-end justify-between">
            <h2 id="featured-heading" className="heading-mono text-2xl">Featured books</h2>
            <Link href="/books" className="font-mono text-sm font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((book, index) => (
              <div key={book.id} className="rise-in" style={{ animationDelay: `${index * 60}ms` }}>
                <BookCard
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
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Categories */}
      {categories.length > 0 ? (
        <section className="py-12" aria-labelledby="categories-heading">
          <div className="mb-6 flex items-end justify-between">
            <h2 id="categories-heading" className="heading-mono text-2xl">Categories</h2>
            <Link href="/categories" className="font-mono text-sm font-bold text-primary hover:underline">All →</Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categories.slice(0, 12).map((category, index) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="rise-in rounded-[2px] border-2 border-border bg-card px-4 py-2 font-mono text-sm font-bold text-foreground shadow-pop-sm transition-all hover:-translate-y-px hover:bg-primary hover:text-primary-foreground hover:shadow-pop"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Recently added */}
      <section className="py-12" aria-labelledby="recent-heading">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="recent-heading" className="heading-mono text-2xl">Recently added</h2>
          <Link href="/books?sort=newest" className="font-mono text-sm font-bold text-primary hover:underline">More →</Link>
        </div>
        {recent.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((book, index) => (
              <div key={book.id} className="rise-in" style={{ animationDelay: `${index * 60}ms` }}>
                <BookCard
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
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[3px] border-2 border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <h3 className="heading-mono text-lg">The library is just getting started</h3>
            <p className="mt-1 text-sm text-muted-foreground">Books added by administrators will appear here.</p>
            <Link href="/login" className={`${buttonClasses("outline", "md", "mt-6")}`}>Sign in as admin to add books</Link>
          </div>
        )}
      </section>
    </div>
  );
}
