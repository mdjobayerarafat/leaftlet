"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}
interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within Providers");
  return ctx;
}

let nextId = 1;

function ToastViewport({ toasts }: { toasts: Toast[] }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "toast-item pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg",
            t.kind === "success" && "border-emerald-300 bg-emerald-50 text-emerald-900",
            t.kind === "error" && "border-red-300 bg-red-50 text-red-900",
            t.kind === "info" && "border-border bg-card text-card-foreground"
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-4), { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const toastValue = useMemo(() => ({ toast }), [toast]);

  return (
    <ThemeProvider>
      <ToastContext.Provider value={toastValue}>
        {children}
        <ToastViewport toasts={toasts} />
      </ToastContext.Provider>
    </ThemeProvider>
  );
}
