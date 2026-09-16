import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEFAULT_READER_PREFS, type ReaderPrefs } from "@/types";

export const dynamic = "force-dynamic";

const PREFS_COOKIE = "ebookd-reader-prefs";

function parse(value: string | undefined): ReaderPrefs {
  if (!value) return { ...DEFAULT_READER_PREFS };
  try {
    const parsed = JSON.parse(value) as Partial<ReaderPrefs>;
    return {
      theme: parsed.theme === "sepia" || parsed.theme === "dark" ? parsed.theme : "light",
      zoom: typeof parsed.zoom === "number" && parsed.zoom >= 0.5 && parsed.zoom <= 2 ? parsed.zoom : 1,
      fit: parsed.fit === "none" || parsed.fit === "page" ? parsed.fit : "width",
      layout: parsed.layout === "double" || parsed.layout === "continuous" ? parsed.layout : "single",
      showThumbnails: parsed.showThumbnails === true,
      showPageNumber: parsed.showPageNumber !== false,
      showProgressBar: parsed.showProgressBar !== false,
    };
  } catch {
    return { ...DEFAULT_READER_PREFS };
  }
}

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json(parse(cookieStore.get(PREFS_COOKIE)?.value));
}

export async function POST(request: NextRequest) {
  let body: { prefs?: Partial<ReaderPrefs> };
  try {
    body = (await request.json()) as { prefs?: Partial<ReaderPrefs> };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const prefs = parse(JSON.stringify(body.prefs ?? {}));
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PREFS_COOKIE, JSON.stringify(prefs), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
