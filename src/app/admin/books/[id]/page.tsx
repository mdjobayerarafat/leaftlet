import { notFound } from "next/navigation";
import { getBookById, listAuthors, listCategories } from "@/lib/books/service";
import { PageHeader } from "@/components/layout/page-header";
import { BookForm } from "@/components/admin/book-form";
import { updateBookAction } from "@/lib/admin/actions";
import { fileIdOf } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit book" };

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [book, authors, categories] = await Promise.all([
    getBookById(id),
    listAuthors().catch(() => []),
    listCategories().catch(() => []),
  ]);
  if (!book) notFound();

  return (
    <div>
      <PageHeader title="Edit book" description={book.title} />
      <BookForm
        mode="edit"
        authors={authors.map((a) => ({ id: a.id, name: a.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: book.id,
          title: book.title,
          slug: book.slug,
          description: book.description,
          authorId: book.authorId,
          categoryId: book.categoryId,
          authorName: book.authorName,
          categoryName: book.categoryName,
          language: book.language,
          publicationYear: book.publicationYear ? String(book.publicationYear) : "",
          isbn: book.isbn,
          publisher: book.publisher,
          pageCount: book.pageCount ? String(book.pageCount) : "",
          tags: book.tags.join(", "),
          status: book.status,
          isFeatured: book.isFeatured,
          allowDownload: book.allowDownload,
          pdfFileId: fileIdOf(book.pdfFileId),
          coverFileId: fileIdOf(book.coverFileId),
        }}
        submitAction={updateBookAction}
      />
    </div>
  );
}
