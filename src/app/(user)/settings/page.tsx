import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui";
import { SettingsThemePicker } from "./settings-theme-picker";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title="Settings" description="Preferences for your account on this device." />

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 font-semibold text-foreground">Appearance</h2>
          <SettingsThemePicker />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-semibold text-foreground">Account</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-foreground">{user.name || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium text-foreground">{user.isAdmin ? "Administrator" : "Reader"}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="mb-2 font-semibold text-foreground">Session</h2>
          <p className="mb-4 text-sm text-muted-foreground">Sign out of this device. Your reading progress is saved automatically.</p>
          <SignOutButton />
        </Card>
      </div>
    </div>
  );
}
