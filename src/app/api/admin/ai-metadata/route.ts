import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { generateBookMetadata, matchCategoryId } from "@/lib/ai/book-metadata";
import { AiConfigError } from "@/lib/ai/openrouter";
import { getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/admin/ai-metadata  { pdfFileId }
 * Generates book metadata from the PDF's text using OpenRouter.
 * Admin-only; the API key never leaves the server.
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { pdfFileId?: string };
  try {
    body = (await request.json()) as { pdfFileId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const pdfFileId = String(body.pdfFileId ?? "").trim();
  if (!pdfFileId) {
    return NextResponse.json({ error: "Upload a PDF first, then generate metadata." }, { status: 400 });
  }

  try {
    const metadata = await generateBookMetadata(pdfFileId);
    // Best-effort: link a matching category if one exists with that slug.
    const categoryId = await matchCategoryId(metadata.categoryName);
    return NextResponse.json({ metadata: { ...metadata, categoryId } });
  } catch (error) {
    if (error instanceof AiConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: getErrorMessage(error, "AI generation failed") }, { status: 502 });
  }
}
