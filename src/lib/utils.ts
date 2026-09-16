export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Normalizes a storage file id. Older records (and some client flows) stored
 * the full Appwrite file URL instead of the bare id; this extracts the id
 * segment so previews and deletes keep working.
 */
export function fileIdOf(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) return raw;
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    // .../storage/buckets/<bucket>/files/<fileId>
    const filesIdx = parts.lastIndexOf("files");
    if (filesIdx !== -1 && parts[filesIdx + 1]) return parts[filesIdx + 1];
    return parts[parts.length - 1] ?? raw;
  } catch {
    return raw;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatRelativeDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 365 * 24 * 3600e3],
    ["month", 30 * 24 * 3600e3],
    ["week", 7 * 24 * 3600e3],
    ["day", 24 * 3600e3],
    ["hour", 3600e3],
    ["minute", 60e3],
  ];
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (abs >= ms) return fmt.format(Math.round(diffMs / ms), unit);
  }
  return "just now";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function progressPercent(currentPage: number, totalPages: number): number {
  if (!totalPages || totalPages <= 0) return 0;
  return clamp(Math.round((currentPage / totalPages) * 100), 0, 100);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  if (typeof error === "string" && error.length > 0) return error;
  return fallback;
}
