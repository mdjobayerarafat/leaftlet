import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState, Input } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";

  let users: Array<{ $id: string; name: string; email: string; labels: string[]; creationDate: string }> = [];
  let error: string | null = null;

  try {
    const { users: usersService } = createAdminClient();
    const res = await usersService.list({ queries: [Query.limit(100), ...(q ? [Query.search("name", q)] : [])] });
    users = res.users.map((u) => ({ $id: u.$id, name: u.name, email: u.email, labels: u.labels ?? [], creationDate: u.$createdAt }));
  } catch {
    error = "Could not load users. Verify APPWRITE_API_KEY has users.read scope.";
  }

  return (
    <div>
      <PageHeader title="Users" description={`${users.length} registered account${users.length === 1 ? "" : "s"}`} />

      <form className="mb-6 flex items-center gap-3" role="search">
        <Input name="q" placeholder="Search by name…" defaultValue={q} className="max-w-xs" aria-label="Search users" />
        <button type="submit" className="rounded-[3px] border-2 border-border bg-card px-4 py-2 font-mono text-sm font-bold uppercase tracking-wide text-foreground shadow-pop-sm transition-all hover:-translate-y-px hover:shadow-pop">Search</button>
      </form>

      {error ? (
        <EmptyState title="Users unavailable" description={error} />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="Registered users will appear here." />
      ) : (
        <Card className="overflow-x-auto shadow-pop-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr className="border-b-2 border-border font-mono text-xs font-bold uppercase tracking-wide text-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.$id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-[2px] border px-2 py-0.5 font-mono text-xs font-bold uppercase ${user.labels.includes("admin") ? "border-border bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"}`}>
                      {user.labels.includes("admin") ? "admin" : "user"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.creationDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
