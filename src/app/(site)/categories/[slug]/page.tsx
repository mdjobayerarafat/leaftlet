import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCategoryBySlug, listBooks } from "@/lib/books/service";
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
  const category = await getCategoryBySlug(slug).catch(() => null);
  return { title: category ? category.name : "Category not found" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) notFound();

  const user = await getSessionUser().catch(() => null);
  const { documents: books } = await listBooks({ categoryId: category.id, limit: 48 }, user);
  const withProgress = await getBooksWithProgressFor(user?.id ?? null, books);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title={category.name} description={category.description || `Books in ${category.name}`} />
      {books.length === 0 ? (
        <EmptyState title="No books in this category yet" action={<ButtonLink href="/books">Browse all books</ButtonLink>} />
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
