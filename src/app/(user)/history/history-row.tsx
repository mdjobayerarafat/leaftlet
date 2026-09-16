"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeHistoryAction } from "@/lib/reading/actions";
import { useToast } from "@/components/providers/providers";
import { buttonClasses } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/utils";

export function HistoryRow({ entryId, bookId, lastPage }: { entryId: string; bookId: string; lastPage: number }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link href={`/read/${bookId}?page=${lastPage}`} className={buttonClasses("primary", "sm")}>Resume</Link>
      <button
        type="button"
        aria-label="Remove from history"
        title="Remove from history"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await removeHistoryAction({ entryId });
            if (res.ok) toast("Removed from history", "success");
            else toast(getErrorMessage(res.error), "error");
          })
        }
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-danger disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
