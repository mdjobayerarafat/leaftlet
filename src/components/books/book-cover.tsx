import Image from "next/image";
import { cn, fileIdOf } from "@/lib/utils";

const MATS = [
  "linear-gradient(150deg,#f6c453,#e8862e)",
  "linear-gradient(150deg,#f2884b,#c23a1d)",
  "linear-gradient(150deg,#88b04b,#4a6d2c)",
  "linear-gradient(150deg,#5b7c99,#2f4858)",
  "linear-gradient(150deg,#b56a9b,#6d2f5b)",
  "linear-gradient(150deg,#d9a35c,#8a5a24)",
];

function matFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return MATS[hash % MATS.length];
}

/** Renders a book cover from Appwrite storage, or a deterministic placeholder. */
export function BookCover({
  fileId,
  title,
  author,
  size = "md",
  className,
}: {
  fileId?: string | null;
  title: string;
  author?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-12 h-[72px]",
    md: "w-28 h-40",
    lg: "w-40 h-60",
    xl: "w-48 h-72",
  } as const;

  const dims = { sm: { w: 96, h: 144 }, md: { w: 224, h: 320 }, lg: { w: 320, h: 480 }, xl: { w: 384, h: 544 } };

  if (fileId) {
    const id = fileIdOf(fileId);
    if (!id) return null;
    const url = `/api/files/${encodeURIComponent(id)}/preview?bucket=book-covers&w=${dims[size].w}&h=${dims[size].h}`;
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[2px] border-2 border-border bg-card p-1 shadow-pop-sm",
          sizeClasses[size],
          className
        )}
      >
        <div className="relative h-full w-full overflow-hidden">
          <Image src={url} alt={`Cover of ${title}`} fill sizes="(max-width: 768px) 30vw, 224px" className="object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-between overflow-hidden rounded-[2px] border-2 border-border p-1 shadow-pop-sm",
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={`Cover of ${title}`}
    >
      <div className="flex h-full w-full flex-col justify-between p-2" style={{ background: matFor(title), color: "#1c1710" }}>
        <span className="line-clamp-3 font-mono text-[10px] font-bold leading-snug sm:text-[11px]">{title}</span>
        <span className="truncate text-[9px] font-semibold opacity-80">{author ?? "Unknown"}</span>
      </div>
    </div>
  );
}
