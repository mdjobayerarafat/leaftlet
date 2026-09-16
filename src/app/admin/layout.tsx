import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="heading-mono text-2xl">Sign in required</h1>
        <p className="mt-2 text-muted-foreground">You need to sign in with an administrator account.</p>
        <Link href="/login" className="mt-6 inline-block rounded-[3px] border-2 border-border bg-primary px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-pop-sm">
          Go to sign in
        </Link>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="heading-mono text-2xl">Access denied</h1>
        <p className="mt-2 text-muted-foreground">This area is restricted to administrators.</p>
        <Link href="/" className="mt-6 inline-block rounded-[3px] border-2 border-border bg-card px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-wide text-foreground shadow-pop-sm">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Nav sits above content on mobile (scrollable row) and beside it on desktop. */}
      <div className="flex flex-col gap-6 py-6 lg:flex-row lg:gap-8 lg:py-10">
        <aside className="lg:w-56 lg:shrink-0 lg:border-r-2 lg:border-border">
          <AdminNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
