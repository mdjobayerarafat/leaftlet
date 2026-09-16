import { Skeleton } from "@/components/ui";

export default function CategoriesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading categories">
      <div className="mb-8 border-b-2 border-border pb-5">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2.5" aria-hidden>
        {["w-28", "w-36", "w-24", "w-32", "w-40", "w-28", "w-36", "w-24", "w-32", "w-28"].map((w, i) => (
          <Skeleton key={i} className={"h-10 " + w} />
        ))}
      </div>
    </div>
  );
}
