import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { smartSearch } from "@/lib/ai/discovery";
import { AiConfigError } from "@/lib/ai/openrouter";
import { getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/ai/search { q } — natural-language catalog search. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  let body: { q?: string };
  try {
    body = (await request.json()) as { q?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const q = String(body.q ?? "").trim();
  if (q.length < 3) {
    return NextResponse.json({ error: "Describe what you'd like to read (at least a few words)." }, { status: 400 });
  }

  try {
    const result = await smartSearch(q);
    return NextResponse.json({
      interpreted: result.interpreted,
      books: result.books.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        authorName: b.authorName,
        categoryName: b.categoryName,
        coverFileId: b.coverFileId,
        ratingAvg: b.ratingAvg,
        ratingCount: b.ratingCount,
      })),
    });
  } catch (error) {
    if (error instanceof AiConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: getErrorMessage(error, "Smart search unavailable") }, { status: 502 });
  }
}
