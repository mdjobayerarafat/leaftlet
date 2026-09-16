import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[2px] border-2 border-border bg-input px-3 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[2px] border-2 border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 min-h-24",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-[2px] border-2 border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props} />;
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-danger">{children}</p>;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[3px] border-2 border-border bg-card", className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-[3px] border border-border/60 bg-muted", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-muted-foreground">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full border border-border bg-muted", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[2px] border-2 border-border bg-secondary px-2 py-0.5 font-mono text-xs font-bold text-secondary-foreground",
        className
      )}
      {...props}
    />
  );
}
