"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Library, LogOut, Menu, Search, Settings, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export interface NavbarUser {
  name: string;
  isAdmin: boolean;
}

/**
 * Retro top banner: full-width yellow band with a big bordered search field,
 * matching the reference design. Nav links live in the desktop SideNav rail;
 * this bar carries search, account, and the mobile menu.
 */
export function Navbar({ user }: { user: NavbarUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/books", label: "Books" },
    { href: "/categories", label: "Categories" },
    { href: "/authors", label: "Authors" },
    ...(user ? [{ href: "/library", label: "My library" }] : []),
  ];

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-secondary">
      <div className="flex h-20 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 md:hidden" aria-label="Leaflet home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg shadow-pop-sm" aria-hidden>🔥</span>
        </Link>

        <form onSubmit={submitSearch} className="mx-auto w-full max-w-2xl" role="search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/70" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, author, or topic"
              aria-label="Search books"
              className="h-12 border-2 pl-11 text-base shadow-pop-sm"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink href="/login" variant="outline" size="sm">Sign in</ButtonLink>
              <ButtonLink href="/register" size="sm">Get started</ButtonLink>
            </div>
          )}

          <button
            type="button"
            className="rounded-[3px] border-2 border-border bg-card p-2 shadow-pop-sm text-foreground sm:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t-2 border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-[3px] border-2 border-transparent px-3 py-2.5 font-mono text-sm font-bold",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "border-border bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user ? (
              <div className="mt-2 flex gap-2">
                <ButtonLink href="/login" variant="outline" className="flex-1">Sign in</ButtonLink>
                <ButtonLink href="/register" className="flex-1">Get started</ButtonLink>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-1">
                <Link href="/bookmarks" className="rounded-[3px] px-3 py-2.5 text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  Bookmarks
                </Link>
                <Link href="/notes" className="rounded-[3px] px-3 py-2.5 text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  Notes
                </Link>
                <Link href="/settings" className="rounded-[3px] px-3 py-2.5 text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  Settings
                </Link>
                {user.isAdmin ? (
                  <Link href="/admin" className="rounded-[3px] px-3 py-2.5 font-mono text-sm font-bold text-primary hover:bg-muted" onClick={() => setMobileOpen(false)}>
                    Admin dashboard
                  </Link>
                ) : null}
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function UserMenu({ user }: { user: NavbarUser }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-primary font-mono text-sm font-bold text-primary-foreground shadow-pop-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user.name.slice(0, 1).toUpperCase()}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-52 rounded-[3px] border-2 border-border bg-card p-1.5 shadow-pop" role="menu">
          <div className="px-3 py-2">
            <p className="truncate font-mono text-sm font-bold">{user.name}</p>
            {user.isAdmin ? <span className="text-xs text-muted-foreground">Administrator</span> : null}
          </div>
          <div className="my-1 h-0.5 bg-border" />
          <Link href="/library" className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-sm hover:bg-muted" role="menuitem"><Library className="h-4 w-4" /> My library</Link>
          <Link href="/bookmarks" className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-sm hover:bg-muted" role="menuitem">Bookmarks</Link>
          <Link href="/notes" className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-sm hover:bg-muted" role="menuitem">Notes</Link>
          <Link href="/settings" className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-sm hover:bg-muted" role="menuitem"><Settings className="h-4 w-4" /> Settings</Link>
          {user.isAdmin ? (
            <Link href="/admin" className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-sm hover:bg-muted" role="menuitem">Admin dashboard</Link>
          ) : null}
          <div className="my-1 h-0.5 bg-border" />
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2 rounded-[3px] px-3 py-2 text-left text-sm text-danger hover:bg-muted" role="menuitem">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
