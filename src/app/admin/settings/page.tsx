import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin settings" };

export default async function AdminSettingsPage() {
  const checks = [
    { label: "Appwrite endpoint", ok: !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, hint: "NEXT_PUBLIC_APPWRITE_ENDPOINT" },
    { label: "Appwrite project ID", ok: !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID, hint: "NEXT_PUBLIC_APPWRITE_PROJECT_ID" },
    { label: "Server API key", ok: !!process.env.APPWRITE_API_KEY, hint: "APPWRITE_API_KEY (server-only)" },
    { label: "Database ID", ok: !!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID, hint: "NEXT_PUBLIC_APPWRITE_DATABASE_ID" },
  ];

  return (
    <div>
      <PageHeader title="Settings" description="Deployment diagnostics for this Appwrite-backed installation." />
      <Card className="divide-y divide-border shadow-pop-sm">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-mono text-sm font-bold text-foreground">{check.label}</p>
              <p className="text-xs text-muted-foreground">{check.hint}</p>
            </div>
            {check.ok ? (
              <span className="flex items-center gap-1.5 rounded-[2px] border-2 border-border bg-secondary px-2 py-0.5 font-mono text-xs font-bold text-secondary-foreground"><CheckCircle2 className="h-4 w-4" /> OK</span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-[2px] border-2 border-border bg-danger px-2 py-0.5 font-mono text-xs font-bold text-white"><XCircle className="h-4 w-4" /> Missing</span>
            )}
          </div>
        ))}
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">
        Environment variables are set outside the application (see <code>.env.example</code>). Run <code>npm run appwrite:setup</code> to
        provision collections, attributes and buckets automatically.
      </p>
    </div>
  );
}
