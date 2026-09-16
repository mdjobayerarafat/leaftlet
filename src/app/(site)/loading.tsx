import { Skeleton } from "@/components/ui";
import { BookCardSkeleton } from "@/components/books/book-card";

/** Shared loading skeleton for catalog pages: header + grid of book cards. */
export default function CatalogLoading({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading content">
      <div className="mb-8 border-b-2 border-border pb-5">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
