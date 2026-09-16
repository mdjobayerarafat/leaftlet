"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toggleBookmarkAction } from "@/lib/reading/actions";
import { useToast } from "@/components/providers/providers";
import { buttonClasses } from "@/components/ui/button";
import { formatDate, getErrorMessage } from "@/lib/utils";
import type { Bookmark, BookRef } from "@/types";

export function BookmarkRow({ bookmark, book }: { bookmark: Bookmark; book: BookRef }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary" aria-hidden>
        {bookmark.pageNumber}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/books/${book.slug}`} className="truncate font-medium text-foreground hover:underline">{book.title}</Link>
        <p className="text-xs text-muted-foreground">Page {bookmark.pageNumber} · saved {formatDate(bookmark.createdAt)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href={`/read/${book.id}?page=${bookmark.pageNumber}`} className={buttonClasses("primary", "sm")}>Open</Link>
        <button
          type="button"
          aria-label="Delete bookmark"
          title="Delete bookmark"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await toggleBookmarkAction({ bookId: book.id, pageNumber: bookmark.pageNumber, bookmarkId: bookmark.id });
              if (res.ok) {
                toast("Bookmark removed", "success");
                window.location.reload();
              } else {
                toast(getErrorMessage(res.error), "error");
              }
            })
          }
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-danger disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
