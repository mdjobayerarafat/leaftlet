import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { listBooks, listCategories, listAuthors } from "@/lib/books/service";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const [booksResult, categories, authors] = await Promise.all([
    listBooks({ limit: 100, includeDrafts: true }, { id: "x", name: "", email: "", isAdmin: true }),
    listCategories().catch(() => []),
    listAuthors().catch(() => []),
  ]);

  const books = booksResult.documents;
  const published = books.filter((b) => b.status === "published").length;
  const drafts = books.filter((b) => b.status === "draft").length;
  const featured = books.filter((b) => b.isFeatured).length;

  const stats = [
    { label: "Total books", value: books.length, icon: BookOpen, href: "/admin/books" },
    { label: "Published", value: published, href: "/admin/books?status=published" },
    { label: "Drafts", value: drafts, href: "/admin/books?status=draft" },
    { label: "Featured", value: featured, href: "/admin/books" },
    { label: "Categories", value: categories.length, href: "/admin/categories" },
    { label: "Authors", value: authors.length, href: "/admin/authors" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        actions={
          <Link href="/admin/books/new" className="inline-flex items-center rounded-[3px] border-2 border-border bg-primary px-4 py-2 font-mono text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-pop-sm transition-all hover:-translate-y-px hover:shadow-pop">
            + Add book
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="retro-lift block rounded-[3px] border-2 border-border bg-card shadow-pop-sm">
            <div className="p-4">
              <p className="font-mono text-3xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="recent-books">
        <h2 id="recent-books" className="heading-mono mb-4 text-xl">Recently added books</h2>
        {books.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No books yet. Add your first book to get started.</Card>
        ) : (
          <Card className="divide-y divide-border">
            {books.slice(0, 8).map((book) => (
              <Link key={book.id} href={`/admin/books/${book.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{book.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{book.authorName} · {formatDate(book.createdAt)}</p>
                </div>
                <span className="shrink-0 rounded-[2px] border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-muted-foreground">{book.status}</span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
