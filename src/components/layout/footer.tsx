import Link from "next/link";
import { BookOpen } from "lucide-react";
import { SITE_NAME } from "@/config/env";

export function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 pb-safe sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm shadow-pop-sm" aria-hidden>🔥</span>
            <span className="font-mono font-bold text-foreground">{SITE_NAME}</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Footer">
            <Link href="/books" className="hover:text-foreground">Books</Link>
            <Link href="/categories" className="hover:text-foreground">Categories</Link>
            <Link href="/authors" className="hover:text-foreground">Authors</Link>
            <Link href="/search" className="hover:text-foreground">Search</Link>
          </nav>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {SITE_NAME}. Read comfortably.</p>
        </div>
      </div>
    </footer>
  );
}
