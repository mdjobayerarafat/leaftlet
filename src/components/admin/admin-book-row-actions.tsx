"use client";

import { useTransition } from "react";
import { Archive, Eye, Star, Trash2 } from "lucide-react";
import { deleteBookAction, setBookStatusAction, toggleFeaturedAction } from "@/lib/admin/actions";
import { useToast } from "@/components/providers/providers";
import { getErrorMessage } from "@/lib/utils";

export function AdminBookRowActions({ id, status, isFeatured, title }: { id: string; status: string; isFeatured: boolean; title: string }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function run(fn: () => Promise<void>, successMessage?: string) {
    startTransition(async () => {
      try {
        await fn();
        if (successMessage) toast(successMessage, "success");
      } catch (error) {
        toast(getErrorMessage(error), "error");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1" aria-busy={pending}>
      <button
        type="button"
        aria-label={status === "published" ? `Archive ${title}` : `Publish ${title}`}
        title={status === "published" ? "Archive" : "Publish"}
        disabled={pending}
        onClick={() =>
          run(async () => {
            const fd = new FormData();
            fd.set("id", id);
            fd.set("status", status === "published" ? "archived" : "published");
            await setBookStatusAction(fd);
          })
        }
        className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground hover:shadow-pop-sm disabled:opacity-50"
      >
        {status === "published" ? <Archive className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        type="button"
        aria-label={isFeatured ? `Unfeature ${title}` : `Feature ${title}`}
        title={isFeatured ? "Unfeature" : "Feature"}
        disabled={pending}
        onClick={() =>
          run(async () => {
            const fd = new FormData();
            fd.set("id", id);
            fd.set("featured", String(!isFeatured));
            await toggleFeaturedAction(fd);
          })
        }
        className={`rounded-[3px] border-2 p-1.5 disabled:opacity-50 ${isFeatured ? "border-border bg-secondary text-secondary-foreground shadow-pop-sm" : "border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground hover:shadow-pop-sm"}`}
      >
        <Star className={`h-4 w-4 ${isFeatured ? "fill-current" : ""}`} />
      </button>
      <button
        type="button"
        aria-label={`Delete ${title}`}
        title="Delete"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete “${title}”? This also removes its PDF and cover. This cannot be undone.`)) return;
          run(async () => {
            const fd = new FormData();
            fd.set("id", id);
            await deleteBookAction(fd);
          });
        }}
        className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-card hover:text-danger hover:shadow-pop-sm disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
