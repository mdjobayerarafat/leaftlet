import { listAuthors } from "@/lib/books/service";
import { PageHeader } from "@/components/layout/page-header";
import { AdminAuthorsForm } from "@/components/admin/admin-authors-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage authors" };

export default async function AdminAuthorsPage() {
  const authors = await listAuthors().catch(() => []);

  return (
    <div>
      <PageHeader title="Authors" description="Manage author records and bios." />
      <AdminAuthorsForm authors={authors.map((a) => ({ id: a.id, name: a.name, slug: a.slug, bio: a.bio }))} />
    </div>
  );
}
