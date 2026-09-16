import { Skeleton } from "@/components/ui";

export default function LibraryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading library">
      <div className="mb-8 border-b-2 border-border pb-5">
        <Skeleton className="h-9 w-44" />
      </div>
      <Skeleton className="mb-6 h-6 w-40" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-[3px] border-2 border-border bg-card p-4" aria-hidden>
            <Skeleton className="h-[72px] w-12" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
              <Skeleton className="mt-3 h-2 w-full" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="mb-6 mt-12 h-6 w-32" />
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col" aria-hidden>
            <Skeleton className="aspect-2/3 w-full rounded-[2px] border-2 border-border" />
            <Skeleton className="mt-3 h-4 w-4/5" />
            <Skeleton className="mt-1.5 h-3.5 w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
