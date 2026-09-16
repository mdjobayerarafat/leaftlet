import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl">📖</p>
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you&rsquo;re looking for doesn&rsquo;t exist, or the book is no longer available.
      </p>
      <div className="mt-2 flex gap-3">
        <Link href="/" className={buttonClasses("primary", "md")}>Back to home</Link>
        <Link href="/books" className={buttonClasses("outline", "md")}>Browse books</Link>
      </div>
    </div>
  );
}
