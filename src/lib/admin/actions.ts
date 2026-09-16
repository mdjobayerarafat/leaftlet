"use server";

import { revalidatePath } from "next/cache";
import { Query } from "node-appwrite";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS, BUCKETS } from "@/config/env";
import { fileIdOf, slugify, getErrorMessage } from "@/lib/utils";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "main";

export interface AdminActionState {
  error?: string;
  ok?: boolean;
  createdId?: string;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optionalStr(formData: FormData, key: string): string {
  const value = str(formData, key);
  return value.length > 0 ? value : "";
}

function numField(formData: FormData, key: string): number {
  const value = Number(str(formData, key));
  return Number.isFinite(value) ? value : 0;
}

/* ---------------------------------- Books ---------------------------------- */

export async function createBookAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();

    const title = str(formData, "title");
    if (title.length < 2) return { error: "Title is required." };

    const pdfFileId = optionalStr(formData, "pdfFileId");
    const coverFileId = optionalStr(formData, "coverFileId");
    if (!pdfFileId) return { error: "Please upload a PDF file." };

    const slug = slugify(optionalStr(formData, "slug") || title);
    const { databases } = createAdminClient();

    // Prevent duplicate slugs.
    const existing = await databases.listDocuments({
      databaseId: DB_ID,
      collectionId: COLLECTIONS.books,
      queries: [Query.equal("slug", [slug])],
    });
    if (existing.documents.length > 0) return { error: "A book with this slug already exists." };

    const created = await databases.createDocument({
      databaseId: DB_ID,
      collectionId: COLLECTIONS.books,
      documentId: "unique()",
      data: {
        title,
        slug,
        description: optionalStr(formData, "description"),
        authorId: optionalStr(formData, "authorId"),
        categoryId: optionalStr(formData, "categoryId"),
        authorName: optionalStr(formData, "authorName"),
        categoryName: optionalStr(formData, "categoryName"),
        language: optionalStr(formData, "language") || "English",
        publicationYear: numField(formData, "publicationYear"),
        isbn: optionalStr(formData, "isbn"),
        publisher: optionalStr(formData, "publisher"),
        pageCount: numField(formData, "pageCount"),
        pdfFileId,
        coverFileId,
        tags: str(formData, "tags") ? str(formData, "tags").split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: str(formData, "status") || "draft",
        isFeatured: formData.get("isFeatured") === "on",
        allowDownload: formData.get("allowDownload") === "on",
      },
    });

    revalidatePath("/admin/books");
    revalidatePath("/books");
    return { ok: true, createdId: created.$id };
  } catch (error) {
    return { error: getErrorMessage(error, "Could not create the book.") };
  }
}

export async function updateBookAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
    const id = str(formData, "id");
    if (!id) return { error: "Missing book id." };

    const title = str(formData, "title");
    if (title.length < 2) return { error: "Title is required." };

    // Capture the existing record first: we need the old slug for
    // revalidation and the old file ids for cleanup.
    const { databases: dbForLookup, storage } = createAdminClient();
    const existingDoc = await dbForLookup.getDocument({
      databaseId: DB_ID,
      collectionId: COLLECTIONS.books,
      documentId: id,
    }).catch(() => null);
    if (!existingDoc) return { error: "Book not found." };
    const bookSlugBefore = String(existingDoc.slug ?? "");

    const slug = slugify(optionalStr(formData, "slug") || title);

    // Prevent slug collisions with a different book.
    const slugClash = await dbForLookup.listDocuments({
      databaseId: DB_ID,
      collectionId: COLLECTIONS.books,
      queries: [Query.equal("slug", [slug])],
    });
    if (slugClash.documents.some((doc) => doc.$id !== id)) {
      return { error: "A book with this slug already exists." };
    }

    // Empty string means "the file was removed on the form".
    const pdfFileId = optionalStr(formData, "pdfFileId");
    const coverFileId = optionalStr(formData, "coverFileId");

    await dbForLookup.updateDocument({
      databaseId: DB_ID,
      collectionId: COLLECTIONS.books,
      documentId: id,
      data: {
        title,
        slug,
        description: optionalStr(formData, "description"),
        authorId: optionalStr(formData, "authorId"),
        categoryId: optionalStr(formData, "categoryId"),
        authorName: optionalStr(formData, "authorName"),
        categoryName: optionalStr(formData, "categoryName"),
        language: optionalStr(formData, "language") || "English",
        publicationYear: numField(formData, "publicationYear"),
        isbn: optionalStr(formData, "isbn"),
        publisher: optionalStr(formData, "publisher"),
        pageCount: numField(formData, "pageCount"),
        pdfFileId,
        coverFileId,
        tags: str(formData, "tags") ? str(formData, "tags").split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: str(formData, "status") || "draft",
        isFeatured: formData.get("isFeatured") === "on",
        allowDownload: formData.get("allowDownload") === "on",
      },
    });

    // Clean up files that were removed on the form (replacements were already
    // deleted client-side at upload time).
    const removePdfFileId = str(formData, "removePdfFileId");
    const removeCoverFileId = str(formData, "removeCoverFileId");
    if (removePdfFileId && removePdfFileId !== pdfFileId) await storage.deleteFile({ bucketId: BUCKETS.bookPdfs, fileId: removePdfFileId }).catch(() => undefined);
    if (removeCoverFileId && removeCoverFileId !== coverFileId) await storage.deleteFile({ bucketId: BUCKETS.bookCovers, fileId: removeCoverFileId }).catch(() => undefined);

    // Revalidate the public book page (slug may have changed) for both the
    // old and new slug.
    revalidatePath("/admin/books");
    revalidatePath(`/admin/books/${id}`);
    revalidatePath("/books");
    if (bookSlugBefore !== slug) revalidatePath(`/books/${bookSlugBefore}`);
    revalidatePath(`/books/${slug}`);
    return { ok: true };
  } catch (error) {
    return { error: getErrorMessage(error, "Could not update the book.") };
  }
}

export async function deleteBookAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { databases, storage } = createAdminClient();
  try {
    const doc = await databases.getDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.books, documentId: id });
    // Best-effort cleanup of storage files to avoid orphans.
    for (const [bucket, field] of [
      [BUCKETS.bookPdfs, "pdfFileId"],
      [BUCKETS.bookCovers, "coverFileId"],
    ] as const) {
      const fileId = fileIdOf(typeof doc[field] === "string" ? (doc[field] as string) : "");
      if (fileId) {
        await storage.deleteFile({ bucketId: bucket, fileId }).catch(() => undefined);
      }
    }
    await databases.deleteDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.books, documentId: id });
  } catch {
    // Book may already be deleted.
  }
  revalidatePath("/admin/books");
  revalidatePath("/books");
}

export async function setBookStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["draft", "published", "archived"].includes(status)) return;

  const { databases } = createAdminClient();
  await databases.updateDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.books, documentId: id, data: { status } });
  revalidatePath("/admin/books");
  revalidatePath("/books");
}

export async function toggleFeaturedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const featured = String(formData.get("featured") ?? "") === "true";
  if (!id) return;

  const { databases } = createAdminClient();
  await databases.updateDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.books, documentId: id, data: { isFeatured: featured } });
  revalidatePath("/admin/books");
  revalidatePath("/");
}

/* -------------------------------- Categories ------------------------------- */

export async function upsertCategoryAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
    const name = str(formData, "name");
    if (name.length < 2) return { error: "Name is required." };
    const id = optionalStr(formData, "id");
    const data = {
      name,
      slug: slugify(optionalStr(formData, "slug") || name),
      description: optionalStr(formData, "description"),
    };
    const { databases } = createAdminClient();
    if (id) {
      await databases.updateDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.categories, documentId: id, data });
    } else {
      await databases.createDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.categories, documentId: "unique()", data });
    }
    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    return { ok: true };
  } catch (error) {
    return { error: getErrorMessage(error, "Could not save the category.") };
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { databases } = createAdminClient();
  await databases.deleteDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.categories, documentId: id }).catch(() => undefined);
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
}

/* --------------------------------- Authors --------------------------------- */

export async function upsertAuthorAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
    const name = str(formData, "name");
    if (name.length < 2) return { error: "Name is required." };
    const id = optionalStr(formData, "id");
    const data = {
      name,
      slug: slugify(optionalStr(formData, "slug") || name),
      bio: optionalStr(formData, "bio"),
    };
    const { databases } = createAdminClient();
    if (id) {
      await databases.updateDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.authors, documentId: id, data });
    } else {
      await databases.createDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.authors, documentId: "unique()", data });
    }
    revalidatePath("/admin/authors");
    revalidatePath("/authors");
    return { ok: true };
  } catch (error) {
    return { error: getErrorMessage(error, "Could not save the author.") };
  }
}

export async function deleteAuthorAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { databases } = createAdminClient();
  await databases.deleteDocument({ databaseId: DB_ID, collectionId: COLLECTIONS.authors, documentId: id }).catch(() => undefined);
  revalidatePath("/admin/authors");
  revalidatePath("/authors");
}
