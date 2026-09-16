import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getBookById } from "@/lib/books/service";
import { recommendForUser, recentHistoryTitles } from "@/lib/ai/discovery";
import { AiConfigError } from "@/lib/ai/openrouter";
import { getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/ai/recommendations { bookId } — "Readers of this book also suggest…" */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to get recommendations" }, { status: 401 });
  }

  let body: { bookId?: string };
  try {
    body = (await request.json()) as { bookId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const bookId = String(body.bookId ?? "").trim();
  if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 });

  try {
    const book = await getBookById(bookId);
    if (!book || book.status !== "published") {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    const history = await recentHistoryTitles(user.id).catch(() => []);
    const result = await recommendForUser(book, history);
    return NextResponse.json({
      reason: result.reason,
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
    return NextResponse.json({ error: getErrorMessage(error, "Recommendations unavailable") }, { status: 502 });
  }
}
