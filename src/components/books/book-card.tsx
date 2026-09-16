"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { Badge, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface BookCardData {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  categoryName?: string;
  coverFileId: string;
  ratingAvg?: number;
  ratingCount?: number;
}

export function BookCard({
  book,
  progress,
  size = "md",
}: {
  book: BookCardData;
  /** 0–100 reading progress; omit when the user hasn't started. */
  progress?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();

  return (
    <div className={cn("group relative flex flex-col", size === "lg" && "sm:flex-row sm:gap-5")}>
      <div className="relative">
        <Link
          href={`/books/${book.slug}`}
          aria-label={`View details for ${book.title}`}
          className="block rounded-md transition-transform duration-150 group-hover:-translate-y-0.5"
        >
          <BookCover fileId={book.coverFileId} title={book.title} author={book.authorName} size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"} />
        </Link>

        {/* Hover actions: revealed on hover/focus with pointer; always visible on
            touch devices where :hover never fires. */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex flex-col gap-1.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 touch:pointer-events-auto touch:opacity-100">
          <button
            type="button"
            onClick={() => router.push(`/read/${book.id}`)}
            className="w-full rounded-md bg-primary px-2 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Read now
          </button>
          <Link
            href={`/books/${book.slug}`}
            className="w-full rounded-md bg-card px-2 py-2 text-center text-xs font-medium text-foreground hover:bg-muted"
          >
            Details
          </Link>
        </div>
      </div>

      <div className={cn("mt-3 flex flex-1 flex-col", size === "lg" && "sm:mt-0 sm:justify-center")}>
        {book.categoryName ? <span className="mb-1 text-xs text-muted-foreground">{book.categoryName}</span> : null}
        <Link href={`/books/${book.slug}`} className="line-clamp-2 font-semibold leading-snug text-foreground hover:underline">
          {book.title}
        </Link>
        <span className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{book.authorName}</span>

        {book.ratingAvg && book.ratingCount ? (
          <span className="mt-1.5 inline-flex items-center gap-0.5" aria-label={`Rated ${book.ratingAvg.toFixed(1)} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "star-pop h-4 w-4",
                  star <= Math.round(book.ratingAvg!) ? "fill-star text-star" : "fill-muted text-muted-foreground/40"
                )}
                aria-hidden
              />
            ))}
          </span>
        ) : null}

        {typeof progress === "number" ? (
          <div className="mt-2">
            <ProgressBar value={progress} />
            <span className="mt-1 block text-xs text-muted-foreground">{progress}%</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="flex flex-col" aria-hidden>
      <div className="shimmer aspect-2/3 w-full rounded-[2px] border-2 border-border bg-muted" />
      <div className="shimmer mt-3 h-4 w-4/5 rounded bg-muted" />
      <div className="shimmer mt-1.5 h-3.5 w-3/5 rounded bg-muted" />
    </div>
  );
}
