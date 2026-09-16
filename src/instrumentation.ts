/**
 * Next.js instrumentation — runs once at server startup, BEFORE any route or
 * page module is evaluated. Installing the fetch-compat shim here guarantees
 * node-appwrite's internal fetch wrapper (node-fetch-native-with-agent) — which
 * captures globalThis.fetch at its own module-eval time — captures the
 * sanitized version, regardless of app-level import ordering.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await import("@/lib/appwrite/compat");
}
