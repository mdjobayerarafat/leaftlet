import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite/server";
import { BUCKETS } from "@/config/env";
import { getSessionUser } from "@/lib/auth/session";
import { fileIdOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ fileId: string; }>;
}

/**
 * GET /api/files/:fileId/preview?bucket=book-covers&w=..&h=..
 * Streams an Appwrite file preview. Public buckets are open; private buckets
 * require a signed-in user whose session grants access (Appwrite enforces file permissions).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  // Tolerate URL-shaped ids left in old records (e.g. "http://host/v1/storage/.../files/<id>").
  const { fileId: rawFileId } = await context.params;
  const fileId = fileIdOf(decodeURIComponent(rawFileId));
  const bucket = request.nextUrl.searchParams.get("bucket") ?? BUCKETS.bookCovers;
  const width = Math.min(Number(request.nextUrl.searchParams.get("w") ?? 600) || 600, 1600);
  const heightParam = Number(request.nextUrl.searchParams.get("h") ?? 0) || 0;
  const height = heightParam > 0 ? Math.min(heightParam, 1600) : undefined;

  const allowedBuckets = new Set<string>([
    BUCKETS.bookCovers,
    BUCKETS.authorImages,
    BUCKETS.categoryImages,
    BUCKETS.userAvatars,
  ]);
  if (!allowedBuckets.has(bucket)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getSessionUser();

  try {
    const { storage } = createAdminClient();
    const file = await storage.getFile({ bucketId: bucket, fileId });
    const perms: string[] = file.$permissions ?? [];
    const readTargets = perms.filter((p) => p.startsWith("read(")).map((p) => p.slice(5));
    // Public if readable by any/guests; signed-in users count for users/user:<id> grants.
    const isPublic =
      readTargets.some((t) => t === '"any")' || t === '"guests")') ||
      (!!user && readTargets.some((t) => t === '"users")' || t === `"user:${user.id}")`));
    if (!isPublic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const result = await storage.getFilePreview({ bucketId: bucket, fileId, width, height });
    return new NextResponse(result as unknown as BodyInit, {
      headers: {
        "Content-Type": file.mimeType ?? "image/*",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
