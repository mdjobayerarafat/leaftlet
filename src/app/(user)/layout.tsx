import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/providers/page-transition";
import { getSessionUser } from "@/lib/auth/session";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);
  return (
    <>
      <Navbar user={user ? { name: user.name || user.email, isAdmin: user.isAdmin } : null} />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
