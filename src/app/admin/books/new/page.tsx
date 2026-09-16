import { listAuthors, listCategories } from "@/lib/books/service";
import { PageHeader } from "@/components/layout/page-header";
import { BookForm } from "@/components/admin/book-form";
import { createBookAction } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add book" };

export default async function NewBookPage() {
  const [authors, categories] = await Promise.all([listAuthors().catch(() => []), listCategories().catch(() => [])]);

  return (
    <div>
      <PageHeader title="Add book" description="Upload a PDF, add metadata, and publish." />
      <BookForm
        mode="create"
        authors={authors.map((a) => ({ id: a.id, name: a.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          title: "",
          slug: "",
          description: "",
          authorId: "",
          categoryId: "",
          authorName: "",
          categoryName: "",
          language: "English",
          publicationYear: "",
          isbn: "",
          publisher: "",
          pageCount: "",
          tags: "",
          status: "published",
          isFeatured: false,
          allowDownload: false,
          pdfFileId: "",
          coverFileId: "",
        }}
        submitAction={createBookAction}
      />
    </div>
  );
}
