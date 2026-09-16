"use client";

import { usePathname } from "next/navigation";

/**
 * Replays a short rise-in whenever the route changes. App Router keeps the
 * layout mounted and swaps `children`, so keying the wrapper by pathname
 * restarts the CSS animation on every navigation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}


