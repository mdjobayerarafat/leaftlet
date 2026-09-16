import { listCategories } from "@/lib/books/service";
import { PageHeader } from "@/components/layout/page-header";
import { Card, Input, Label, Textarea } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { AdminCategoriesForm } from "@/components/admin/admin-categories-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage categories" };

export default async function AdminCategoriesPage() {
  const categories = await listCategories().catch(() => []);

  return (
    <div>
      <PageHeader title="Categories" description="Organize books into subjects." />
      <AdminCategoriesForm
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description }))}
      />
    </div>
  );
}
