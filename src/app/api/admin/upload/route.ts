import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, Permission, Role } from "@/lib/appwrite/server";
import { getSessionUser } from "@/lib/auth/session";
import { BUCKETS } from "@/config/env";
import { fileIdOf, getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED: Record<string, { bucket: string; mime: string[]; maxMB: number; permissions: string[] }> = {
  // PDFs stay locked to the server (streamed via /api/books/:id/file after auth checks).
  pdf: { bucket: BUCKETS.bookPdfs, mime: ["application/pdf"], maxMB: 300, permissions: [] },
  // Covers are shown in public catalogs, so they are publicly readable.
  cover: { bucket: BUCKETS.bookCovers, mime: ["image/jpeg", "image/png", "image/webp"], maxMB: 5, permissions: [Permission.read(Role.any())] },
};

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  const kind = String(formData.get("kind") ?? "");
  const file = formData.get("file");
  const spec = ALLOWED[kind];
  if (!spec) return NextResponse.json({ error: "Unknown upload kind" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate actual MIME type — never trust the extension alone.
  if (!spec.mime.includes(file.type)) {
    return NextResponse.json({ error: `Invalid file type: expected ${spec.mime.join(" or ")}` }, { status: 415 });
  }
  if (file.size > spec.maxMB * 1024 * 1024) {
    return NextResponse.json({ error: `File is too large (max ${spec.maxMB} MB)` }, { status: 413 });
  }

  const { storage } = createAdminClient();
  try {
    const created = await storage.createFile({
      bucketId: spec.bucket,
      fileId: "unique()",
      file: file,
      permissions: spec.permissions,
    });
    // Always return the bare file id (never a URL) — the database stores ids only.
    return NextResponse.json({ fileId: String(created.$id), name: created.name, size: created.sizeOriginal });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Upload failed") }, { status: 502 });
  }
}

/** Delete a previously uploaded file (used for orphan cleanup on failed creates). */
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const fileId = fileIdOf(request.nextUrl.searchParams.get("fileId"));
  const kind = request.nextUrl.searchParams.get("kind");
  const spec = kind ? ALLOWED[kind] : undefined;
  if (!fileId || !spec) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

  const { storage } = createAdminClient();
  await storage.deleteFile({ bucketId: spec.bucket, fileId }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
