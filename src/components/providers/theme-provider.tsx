"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

export type ThemeChoice = "light" | "sepia" | "dark" | "system";
export type ResolvedTheme = "light" | "sepia" | "dark";

interface ThemeContextValue {
  theme: ThemeChoice;
  resolved: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "ebookd-theme";
const THEME_CHANGE_EVENT = "ebookd-theme-change";

function themeOrder(): ThemeChoice[] {
  return ["light", "sepia", "dark", "system"];
}

/* ------------------------- External store: theme choice ------------------------- */

function subscribeTheme(onChange: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

function getThemeSnapshot(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    return stored && themeOrder().includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function getServerThemeSnapshot(): ThemeChoice {
  return "system";
}

/* --------------------- External store: system color scheme --------------------- */

function subscribeSystemDark(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSystemDarkSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSystemDarkSnapshot(): boolean {
  return false;
}

/* --------------------------------- Provider --------------------------------- */

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read theme + system preference through useSyncExternalStore so the server
  // render and the first client render agree (no hydration mismatch), while
  // still tracking the real stored/system values after mount.
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const systemDark = useSyncExternalStore(subscribeSystemDark, getSystemDarkSnapshot, getServerSystemDarkSnapshot);

  const resolved: ResolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme === "sepia" ? "sepia" : theme === "dark" ? "dark" : "light";

  // Apply the resolved theme to the DOM (external system update — no setState).
  // The first application (pre-hydration script already set it) skips the
  // animation; later switches cross-fade every color with a short wash.
  const firstApply = useRef(true);
  useEffect(() => {
    const root = document.documentElement;
    if (firstApply.current) {
      firstApply.current = false;
      root.classList.remove("light", "sepia", "dark");
      root.classList.add(resolved);
      return;
    }
    // Circular wash from the viewport center where the View Transitions API
    // exists; a simple cross-fade everywhere else.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => {
        root.classList.remove("light", "sepia", "dark");
        root.classList.add(resolved);
      });
    } else {
      root.classList.add("theme-transition");
      root.classList.remove("light", "sepia", "dark");
      root.classList.add(resolved);
      window.setTimeout(() => root.classList.remove("theme-transition"), 400);
    }
  }, [resolved]);

  const persist = useCallback((next: ThemeChoice) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable — theme applies for this session only.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const setTheme = useCallback(
    (next: ThemeChoice) => {
      persist(next);
    },
    [persist]
  );

  const cycle = useCallback(() => {
    const current = getThemeSnapshot();
    persist(themeOrder()[(themeOrder().indexOf(current) + 1) % themeOrder().length]);
  }, [persist]);

  const value = useMemo(() => ({ theme, resolved, setTheme, cycle }), [theme, resolved, setTheme, cycle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Inline script that applies the stored theme before first paint (no flash). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("ebookd-theme")||"system";var m=window.matchMedia("(prefers-color-scheme: dark)").matches;var c=t==="dark"?"dark":t==="sepia"?"sepia":(t==="system"&&m)?"dark":"light";document.documentElement.classList.add(c)}catch(e){}})();`;
