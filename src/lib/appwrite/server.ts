import "server-only";
import "@/lib/appwrite/compat";
import { Account, Client, Databases, Storage, Users, Query, Permission, Role } from "node-appwrite";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/** Admin client using the server-only API key. Never import from client components. */
export function createAdminClient(): {
  account: Account;
  databases: Databases;
  storage: Storage;
  users: Users;
} {
  const client = new Client()
    .setEndpoint(required(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, "NEXT_PUBLIC_APPWRITE_ENDPOINT"))
    .setProject(required(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID, "NEXT_PUBLIC_APPWRITE_PROJECT_ID"))
    .setKey(required(process.env.APPWRITE_API_KEY, "APPWRITE_API_KEY"));

  return {
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
    users: new Users(client),
  };
}

/** Session client that acts as the logged-in user via their session cookie. */
export async function createSessionClient(): Promise<{
  account: Account;
  databases: Databases;
  storage: Storage;
}> {
  const cookieStore = await cookies();
  const secret = cookieStore.get(SESSION_COOKIE)?.value;
  if (!secret) throw new Error("No session cookie present");

  const client = new Client()
    .setEndpoint(required(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, "NEXT_PUBLIC_APPWRITE_ENDPOINT"))
    .setProject(required(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID, "NEXT_PUBLIC_APPWRITE_PROJECT_ID"))
    .setSession(secret);

  return {
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

export { Query, Permission, Role };
export { createEmailPasswordSessionSecret } from "@/lib/appwrite/session-secret";
