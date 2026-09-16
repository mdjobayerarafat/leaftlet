"use client";

import { useState } from "react";
import { Bookmark as BookmarkIcon, Trash2, X } from "lucide-react";
import type { Bookmark, Note } from "@/types";
import { cn, formatDate } from "@/lib/utils";

export function ReaderNotesPanel({
  notes,
  bookmarks,
  currentPage,
  onSave,
  onDelete,
  onGoToPage,
  onClose,
}: {
  notes: Note[];
  bookmarks: Bookmark[];
  currentPage: number;
  onSave: (content: string, noteId?: string) => void;
  onDelete: (noteId: string) => void;
  onGoToPage: (page: number) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const pageNotes = notes.filter((n) => n.pageNumber === currentPage);
  const otherNotes = notes.filter((n) => n.pageNumber !== currentPage);

  function submit() {
    const content = draft.trim();
    if (!content) return;
    onSave(content, editingId ?? undefined);
    setDraft("");
    setEditingId(null);
  }

  return (
    <div className="space-y-6" aria-label="Notes and bookmarks">
      <div className="flex items-center justify-between">
        <h2 className="heading-mono text-lg">Notes</h2>
        <button type="button" onClick={onClose} aria-label="Close notes" className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-muted hover:shadow-pop-sm">
          <X className="h-4 w-4" />
        </button>
      </div>

      <section>
        <h3 className="heading-mono mb-2 text-xs uppercase">Page {currentPage}</h3>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Write a note about this page…"
          aria-label="Note content"
          className="w-full rounded-[2px] border-2 border-border bg-input px-3 py-2 text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim()}
            className="rounded-[2px] border-2 border-border bg-primary px-3 py-1.5 font-mono text-xs font-bold uppercase text-primary-foreground shadow-pop-sm disabled:opacity-50"
          >
            {editingId ? "Update note" : "Save note"}
          </button>
          {editingId ? (
            <button type="button" onClick={() => { setEditingId(null); setDraft(""); }} className="rounded-[2px] border-2 border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase shadow-pop-sm">
              Cancel
            </button>
          ) : null}
        </div>

        {pageNotes.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {pageNotes.map((note) => (
              <li key={note.id} className="group rounded-[3px] border-2 border-border bg-input p-3">
                <p className="whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
                <div className="mt-2 flex gap-3 text-xs">
                  <button type="button" onClick={() => { setEditingId(note.id); setDraft(note.content); }} className="font-medium text-primary hover:underline">Edit</button>
                  <button type="button" onClick={() => onDelete(note.id)} className="flex items-center gap-1 text-danger hover:underline"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {otherNotes.length > 0 ? (
        <section>
          <h3 className="heading-mono mb-2 text-xs uppercase">All notes</h3>
          <ul className="space-y-2">
            {otherNotes.map((note) => (
              <li key={note.id}>
                <button type="button" onClick={() => onGoToPage(note.pageNumber)} className="w-full rounded-[3px] border-2 border-border bg-card p-3 text-left shadow-pop-sm hover:bg-muted">
                  <span className="font-mono text-xs font-bold text-primary">Page {note.pageNumber}</span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{note.content}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="heading-mono mb-2 text-xs uppercase">Bookmarks</h3>
        {bookmarks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No bookmarks yet.</p>
        ) : (
          <ul className="space-y-1">
            {[...bookmarks].sort((a, b) => a.pageNumber - b.pageNumber).map((bookmark) => (
              <li key={bookmark.id}>
                <button
                  type="button"
                  onClick={() => onGoToPage(bookmark.pageNumber)}
                  className={cn("flex w-full items-center gap-2 rounded-[2px] border-2 border-transparent px-2 py-1.5 text-left text-sm hover:border-border hover:bg-muted hover:shadow-pop-sm", bookmark.pageNumber === currentPage && "font-bold text-primary")}
                >
                  <BookmarkIcon className="h-3.5 w-3.5" aria-hidden />
                  {bookmark.title}
                  <span className="ml-auto text-xs text-muted-foreground">{formatDate(bookmark.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
