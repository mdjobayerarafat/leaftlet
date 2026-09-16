import { Skeleton } from "@/components/ui";
import { BookCardSkeleton } from "@/components/books/book-card";

export default function BooksLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading books">
      <div className="mb-8 border-b-2 border-border pb-5">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-3 h-4 w-56" />
      </div>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
