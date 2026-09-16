"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, FolderTree, PenLine, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/authors", label: "Authors", icon: PenLine },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex gap-1.5 overflow-x-auto pb-1 max-lg:border-b-2 max-lg:border-border max-lg:pb-3 lg:flex-col"
      aria-label="Admin"
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-[3px] border-2 px-3 py-2 font-mono text-sm font-bold uppercase tracking-wide transition-all max-lg:px-3.5 max-lg:py-2.5",
              active
                ? "border-border bg-primary text-primary-foreground shadow-pop-sm"
                : "border-transparent bg-card text-muted-foreground shadow-pop-sm hover:text-foreground",
              // Small min touch target on phones.
              "max-lg:border-border"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
