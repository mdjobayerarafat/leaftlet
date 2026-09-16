import { Navbar } from "@/components/layout/navbar";
import { SideNav } from "@/components/layout/side-nav";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/providers/page-transition";
import { getSessionUser } from "@/lib/auth/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);
  const navUser = user ? { name: user.name || user.email, isAdmin: user.isAdmin } : null;
  return (
    <div className="flex min-h-svh w-full">
      <SideNav user={navUser} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={navUser} />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </div>
    </div>
  );
}
