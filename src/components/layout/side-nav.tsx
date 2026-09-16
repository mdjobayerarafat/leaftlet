"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Compass, Home, Library, LogIn, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export interface SideNavUser {
  name: string;
  isAdmin: boolean;
}

/** Retro icon rail: logo up top, labelled icon nav below (desktop only). */
export function SideNav({ user }: { user: SideNavUser | null }) {
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();
  const [themeKey, setThemeKey] = useState(0);
  const prevTheme = useRef(resolved);

  // Re-key the icon when the theme changes so the spin animation replays.
  useEffect(() => {
    if (prevTheme.current !== resolved) {
      prevTheme.current = resolved;
      setThemeKey((k) => k + 1);
    }
  }, [resolved]);

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/categories", label: "Category", icon: Compass },
    { href: "/library", label: "Library", icon: Library, auth: true },
    { href: "/bookmarks", label: "Saved", icon: Bookmark, auth: true },
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <aside className="sticky top-0 hidden h-svh w-28 shrink-0 flex-col items-center gap-1 border-r-2 border-border bg-card px-2 py-6 md:flex">
      <Link href="/" className="flame mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl shadow-pop-sm" aria-label="Leaflet home">
        <span aria-hidden className="flame-emoji">🔥</span>
      </Link>

      <nav className="flex w-full flex-col items-stretch gap-1" aria-label="Sidebar">
        {items.map(({ href, label, icon: Icon, auth }) => {
          if (auth && !user) return null;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "nav-nudge flex flex-col items-center gap-1 rounded-[3px] px-1 py-2.5 text-xs font-semibold transition-colors",
                isActive(href) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => setTheme(resolved === "dark" ? "light" : resolved === "light" ? "sepia" : "dark")}
          className="flex flex-col items-center gap-1 rounded-[3px] px-1 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
          aria-label={`Switch theme (current: ${resolved})`}
          title={`Theme: ${resolved}`}
        >
          <span key={themeKey} className="icon-swap inline-flex">
            {resolved === "dark" ? <SunMedium className="h-5 w-5" aria-hidden /> : <MoonStar className="h-5 w-5" aria-hidden />}
          </span>
          Theme
        </button>
        {!user ? (
          <Link
            href="/login"
            className="flex flex-col items-center gap-1 rounded-[3px] px-1 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <LogIn className="h-5 w-5" aria-hidden />
            Sign in
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
