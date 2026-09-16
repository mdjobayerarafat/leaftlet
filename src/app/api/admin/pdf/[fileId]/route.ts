import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite/server";
import { getSessionUser } from "@/lib/auth/session";
import { BUCKETS } from "@/config/env";
import { fileIdOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/pdf/:fileId
 * Streams raw PDF bytes to admins only. Used by the book form to render the
 * first page as an auto-cover; never public.
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  const user = await getSessionUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { fileId: rawId } = await context.params;
  const fileId = fileIdOf(decodeURIComponent(rawId));
  if (!fileId) {
    return NextResponse.json({ error: "Missing file id" }, { status: 400 });
  }

  const { storage } = createAdminClient();
  try {
    const bytes = await storage.getFileDownload({ bucketId: BUCKETS.bookPdfs, fileId });
    return new NextResponse(bytes as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF could not be loaded" }, { status: 404 });
  }
}
