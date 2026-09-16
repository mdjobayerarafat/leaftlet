import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getBookById } from "@/lib/books/service";
import { askAboutBook } from "@/lib/ai/discovery";
import { AiConfigError } from "@/lib/ai/openrouter";
import { getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/ai/ask { bookId, question } — pre-reading Q&A about a book. */
export async function POST(request: NextRequest) {
  let body: { bookId?: string; question?: string };
  try {
    body = (await request.json()) as { bookId?: string; question?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const bookId = String(body.bookId ?? "").trim();
  const question = String(body.question ?? "").trim();
  if (!bookId || !question) {
    return NextResponse.json({ error: "Missing bookId or question" }, { status: 400 });
  }

  // Public: any visitor may ask about a published book (rate-limited by UI).
  const book = await getBookById(bookId);
  if (!book || book.status !== "published") {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  try {
    const answer = await askAboutBook(book, question);
    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof AiConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: getErrorMessage(error, "Could not answer") }, { status: 502 });
  }
}
