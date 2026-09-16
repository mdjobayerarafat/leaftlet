"use server";

import { ID } from "node-appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, createEmailPasswordSessionSecret } from "@/lib/appwrite/server";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";
import { signOut } from "@/lib/auth/session";
import { getErrorMessage } from "@/lib/utils";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function setSessionCookie(secret: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export interface AuthFormState {
  error?: string;
  success?: string;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Please enter your name." };
  if (!isEmail(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  let createdUserId = "";
  try {
    const { account } = createAdminClient();
    const created = await account.create({ userId: ID.unique(), email, password, name });
    createdUserId = created.$id;
    const secret = await createEmailPasswordSessionSecret(email, password);
    await setSessionCookie(secret);
  } catch (error) {
    return { error: getErrorMessage(error, "Could not create your account.") };
  }

  // Best effort: create the user profile document (no-op on failure).
  try {
    const { databases } = createAdminClient();
    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "main",
      "user_profiles",
      ID.unique(),
      { userId: createdUserId, role: "user" }
    );
  } catch {
    // Profile doc is optional; auth works without it.
  }

  redirect("/");
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isEmail(email)) return { error: "Please enter a valid email address." };
  if (!password) return { error: "Please enter your password." };

  try {
    const secret = await createEmailPasswordSessionSecret(email, password);
    await setSessionCookie(secret);
  } catch (error) {
    return { error: getErrorMessage(error, "Invalid email or password.") };
  }
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/");
}

export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isEmail(email)) return { error: "Please enter a valid email address." };
  try {
    const { account } = createAdminClient();
    await account.createRecovery({
      email,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`,
    });
  } catch {
    // Always report success to avoid account enumeration.
  }
  return { success: "If that email exists, a recovery link is on its way." };
}
