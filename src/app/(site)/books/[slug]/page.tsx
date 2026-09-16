import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Bookmark as BookmarkIcon, Share2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getBookBySlug, getProgress } from "@/lib/books/service";
import { isInLibrary } from "@/lib/reading/service";
import { BookCover } from "@/components/books/book-cover";
import { BookActions } from "@/components/books/book-actions";
import { AiRecommendations } from "@/components/books/ai-recommendations";
import { AskAboutBook } from "@/components/books/ask-about-book";
import { Badge, EmptyState } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug).catch(() => null);
  if (!book) return { title: "Book not found" };
  return {
    title: book.title,
    description: book.description.slice(0, 160),
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      title: book.title,
      description: book.description.slice(0, 160),
      type: "book",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BookDetailsPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug).catch(() => null);
  if (!book) notFound();

  const user = await getSessionUser().catch(() => null);
  const [progress, inLibrary] = await Promise.all([
    user ? getProgress(user.id, book.id).catch(() => null) : Promise.resolve(null),
    user ? isInLibrary(user.id, book.id).catch(() => false) : Promise.resolve(false),
  ]);

  const details: Array<[string, string]> = [
    ["Author", book.authorName],
    ["Category", book.categoryName],
    ["Language", book.language],
    ["Published", book.publicationYear ? String(book.publicationYear) : "—"],
    ["Pages", book.pageCount ? String(book.pageCount) : "—"],
    ["Publisher", book.publisher || "—"],
    ["ISBN", book.isbn || "—"],
    ["Added", formatDate(book.createdAt)],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <nav className="py-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/books" className="hover:text-foreground">Books</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{book.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="mx-auto w-fit">
            <BookCover fileId={book.coverFileId} title={book.title} author={book.authorName} size="xl" className="shadow-lg" />
          </div>
          {book.ratingAvg > 0 ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              ★ {book.ratingAvg.toFixed(1)} · {book.ratingCount} rating{book.ratingCount === 1 ? "" : "s"}
              {book.readerCount > 0 ? ` · ${book.readerCount} reader${book.readerCount === 1 ? "" : "s"}` : ""}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{book.categoryName}</Badge>
            <Badge>{book.language}</Badge>
            {book.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{book.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{book.authorName}</p>

          {book.description ? (
            <p className="mt-6 max-w-2xl leading-relaxed text-foreground/90">{book.description}</p>
          ) : null}

          <div className="mt-8">
            <BookActions
              bookId={book.id}
              slug={book.slug}
              title={book.title}
              authed={!!user}
              inLibrary={inLibrary}
              progress={progress ? { currentPage: progress.currentPage, percentage: progress.progressPercentage, totalPages: progress.totalPages } : null}
            />
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-8 sm:grid-cols-3">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <AskAboutBook bookId={book.id} />
        </div>
      </div>

      <AiRecommendations bookId={book.id} signedIn={!!user} />
    </div>
  );
}
