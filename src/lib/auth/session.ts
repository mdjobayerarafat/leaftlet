import "server-only";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/appwrite/server";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

/** Read the current user from the Appwrite session cookie. Returns null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const secret = cookieStore.get(SESSION_COOKIE)?.value;
  if (!secret) return null;
  try {
    const { account } = await createSessionClient();
    const user = await account.get();
    return {
      id: user.$id,
      name: user.name,
      email: user.email,
      isAdmin: Array.isArray(user.labels) && user.labels.includes("admin"),
    };
  } catch {
    return null;
  }
}

/** Server-action guard: throws when not authenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("AUTH_REQUIRED");
  return user;
}

/** Server-action guard: throws when the caller is not an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("FORBIDDEN");
  return user;
}

/** Sign out server-side: delete the Appwrite session and clear the cookie. */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  const secret = cookieStore.get(SESSION_COOKIE)?.value;
  if (secret) {
    try {
      const { account } = await createSessionClient();
      await account.deleteSession("current");
    } catch {
      // Session may already be invalid; clearing the cookie is enough.
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}
