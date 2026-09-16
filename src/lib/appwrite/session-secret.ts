/**
 * Email/password session creation for modern Appwrite versions.
 *
 * Newer Appwrite releases no longer include the session secret in the JSON
 * response — it only travels in the `Set-Cookie: a_session_<projectId>` header
 * (a base64 JSON blob of { id, secret }). This helper captures that value so it
 * can be stored in our own httpOnly cookie and later passed to setSession().
 *
 * Plain fetch (no SDK client) because the SDK's typed response exposes an empty
 * `secret` field on these Appwrite versions.
 */

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function createEmailPasswordSessionSecret(email: string, password: string): Promise<string> {
  const endpoint = required(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, "NEXT_PUBLIC_APPWRITE_ENDPOINT");
  const project = required(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID, "NEXT_PUBLIC_APPWRITE_PROJECT_ID");

  const response = await fetch(`${endpoint}/account/sessions/email`, {
    method: "POST",
    headers: { "X-Appwrite-Project": project, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Invalid email or password.");
  }

  const cookieName = `a_session_${project}`;
  const setCookies = response.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    // Exact match — skips the `..._legacy` variant.
    if (cookie.startsWith(`${cookieName}=`)) {
      return cookie.split(";")[0].slice(cookieName.length + 1);
    }
  }
  throw new Error("Session could not be established.");
}
