import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getAuthorBySlug, listBooks } from "@/lib/books/service";
import { getBooksWithProgressFor } from "@/lib/books/progress-view";
import { BookCard } from "@/components/books/book-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug).catch(() => null);
  return { title: author ? author.name : "Author not found" };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug).catch(() => null);
  if (!author) notFound();

  const user = await getSessionUser().catch(() => null);
  const { documents: books } = await listBooks({ authorId: author.id, limit: 48 }, user);
  const withProgress = await getBooksWithProgressFor(user?.id ?? null, books);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title={author.name} description={author.bio || undefined} />
      {books.length === 0 ? (
        <EmptyState title="No books by this author yet" action={<ButtonLink href="/books">Browse all books</ButtonLink>} />
      ) : (
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
      )}
    </div>
  );
}
