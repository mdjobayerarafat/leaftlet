import Link from "next/link";
import { listCategories } from "@/lib/books/service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories().catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title="Categories" description="Browse the library by subject." />
      {categories.length === 0 ? (
        <EmptyState title="No categories yet" description="Categories created by administrators will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
            >
              <h2 className="font-semibold text-foreground">{category.name}</h2>
              {category.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{category.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
