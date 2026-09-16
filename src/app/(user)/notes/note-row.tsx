"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { BookRef, Note } from "@/types";
import { deleteNoteAction, updateNoteAction } from "@/lib/reading/actions";
import { useToast } from "@/components/providers/providers";
import { buttonClasses } from "@/components/ui/button";
import { formatDate, getErrorMessage } from "@/lib/utils";

export function NoteRow({ note, book }: { note: Note; book: BookRef }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<[boolean, string]>([false, note.content]);
  const [isEditing, content] = editing;

  function save() {
    startTransition(async () => {
      const res = await updateNoteAction({ noteId: note.id, content });
      if (res.ok) {
        toast("Note updated", "success");
        window.location.reload();
      } else {
        toast(getErrorMessage(res.error), "error");
      }
    });
  }

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <Link href={`/read/${book.id}?page=${note.pageNumber}`} className="text-xs font-semibold text-primary hover:underline">
          {book.title} · page {note.pageNumber}
        </Link>
        <span className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setEditing([true, e.target.value])}
            rows={3}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
            aria-label="Edit note"
          />
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={pending} className={buttonClasses("primary", "sm")}>Save</button>
            <button type="button" onClick={() => setEditing([false, note.content])} className={buttonClasses("outline", "sm")}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
          <div className="mt-3 flex gap-3 text-xs">
            <button type="button" onClick={() => setEditing([true, note.content])} className="font-medium text-primary hover:underline">Edit</button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Delete this note?")) return;
                startTransition(async () => {
                  const res = await deleteNoteAction({ noteId: note.id });
                  if (res.ok) {
                    toast("Note deleted", "success");
                    window.location.reload();
                  } else {
                    toast(getErrorMessage(res.error), "error");
                  }
                });
              }}
              className="flex items-center gap-1 font-medium text-danger hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </>
      )}
    </li>
  );
}
