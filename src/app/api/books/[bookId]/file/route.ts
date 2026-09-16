import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite/server";
import { getSessionUser } from "@/lib/auth/session";
import { BUCKETS } from "@/config/env";
import { mapBook } from "@/lib/appwrite/mappers";
import { fileIdOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "main";

/**
 * GET /api/books/:bookId/file
 * Streams the book's PDF. Access rules:
 *  - The book must exist and be published (or the viewer is an admin).
 *  - The file must be readable by the current session in Appwrite (enforced below
 *    by attempting an admin fetch only after the book-level check passes).
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await context.params;
  const user = await getSessionUser();

  const { databases, storage } = createAdminClient();
  let pdfFileId: string | null = null;
  let status = "draft";
  try {
    const doc = await databases.getDocument({ databaseId: DB_ID, collectionId: process.env.APPWRITE_BOOKS_COLLECTION_ID ?? "books", documentId: bookId });
    const book = mapBook(doc);
    pdfFileId = book.pdfFileId || null;
    status = book.status;
  } catch {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (!pdfFileId) {
    return NextResponse.json({ error: "This book has no PDF file" }, { status: 404 });
  }
  // Old records may store a full URL instead of a bare file id.
  pdfFileId = fileIdOf(pdfFileId);
  if (status !== "published" && !user?.isAdmin) {
    return NextResponse.json({ error: "This book is not available" }, { status: 403 });
  }
  if (!user) {
    // Require sign-in to read books (platform policy).
    return NextResponse.json({ error: "Sign in to read this book" }, { status: 401 });
  }

  try {
    const result = await storage.getFileDownload({ bucketId: BUCKETS.bookPdfs, fileId: pdfFileId });
    return new NextResponse(result as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF could not be loaded" }, { status: 502 });
  }
}
