import Link from "next/link";
import { listBooks } from "@/lib/books/service";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState, Input, Select } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { AdminBookRowActions } from "@/components/admin/admin-book-row-actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage books" };

const ADMIN_VIEWER = { id: "admin", name: "Admin", email: "", isAdmin: true } as const;

export default async function AdminBooksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";

  const result = await listBooks({ q: q || undefined, limit: 100, includeDrafts: true }, ADMIN_VIEWER);
  let books = result.documents;
  if (status === "published" || status === "draft" || status === "archived") {
    books = books.filter((b) => b.status === status);
  }

  return (
    <div>
      <PageHeader
        title="Books"
        description={`${result.total} book${result.total === 1 ? "" : "s"} total`}
        actions={
          <Link href="/admin/books/new" className={buttonClasses("primary", "md")}>
            + Add book
          </Link>
        }
      />

      <form className="mb-6 flex flex-wrap items-center gap-3" role="search">
        <Input name="q" placeholder="Search books…" defaultValue={q} className="max-w-xs" aria-label="Search books" />
        <Select name="status" defaultValue={status} className="max-w-40" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
        <button type="submit" className={buttonClasses("outline", "md")}>Filter</button>
      </form>

      {books.length === 0 ? (
        <EmptyState title="No books found" description="Adjust the filters or add a new book." />
      ) : (
        <Card className="overflow-x-auto shadow-pop-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr className="border-b-2 border-border font-mono text-xs font-bold uppercase tracking-wide text-foreground">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-muted/40">
                  <td className="max-w-64 px-4 py-3">
                    <Link href={`/admin/books/${book.id}`} className="font-medium text-foreground hover:underline">
                      {book.title}
                    </Link>
                    {book.isFeatured ? <span className="ml-2 rounded-[2px] border-2 border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold text-secondary-foreground">FEATURED</span> : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{book.authorName}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-[2px] border border-border bg-muted px-2 py-0.5 font-mono text-xs font-bold uppercase text-muted-foreground">{book.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(book.createdAt)}</td>
                  <td className="px-4 py-3">
                    <AdminBookRowActions id={book.id} status={book.status} isFeatured={book.isFeatured} title={book.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
