import Link from "next/link";
import { BookOpen } from "lucide-react";
import { SITE_NAME } from "@/config/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 pb-safe pt-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold text-foreground">
        <BookOpen className="h-6 w-6 text-primary" aria-hidden />
        <span className="text-xl">{SITE_NAME}</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
