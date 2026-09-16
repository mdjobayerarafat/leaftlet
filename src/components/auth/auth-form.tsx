export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
