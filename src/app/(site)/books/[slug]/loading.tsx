import { Skeleton } from "@/components/ui";

export default function BookDetailsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading book">
      <Skeleton className="my-6 h-5 w-56" />
      <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
        <div className="mx-auto w-full max-w-72">
          <Skeleton className="aspect-2/3 w-full rounded-[2px] border-2 border-border" />
        </div>
        <div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="mt-3 h-10 w-3/4 max-w-xl" />
          <Skeleton className="mt-3 h-5 w-48" />
          <Skeleton className="mt-6 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-5/6 max-w-2xl" />
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-36" />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t-2 border-border pt-8 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
