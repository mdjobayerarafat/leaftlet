"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui";
import { useToast } from "@/components/providers/providers";
import { deleteAuthorAction, upsertAuthorAction } from "@/lib/admin/actions";
import { getErrorMessage } from "@/lib/utils";

interface AuthorRow {
  id: string;
  name: string;
  slug: string;
  bio: string;
}

export function AdminAuthorsForm({ authors }: { authors: AuthorRow[] }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<AuthorRow | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  function startEdit(author: AuthorRow) {
    setEditing(author);
    setName(author.name);
    setBio(author.bio);
  }

  function reset() {
    setEditing(null);
    setName("");
    setBio("");
  }

  function submit() {
    if (name.trim().length < 2) {
      toast("Name is required", "error");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      if (editing) fd.set("id", editing.id);
      fd.set("name", name);
      fd.set("bio", bio);
      const result = await upsertAuthorAction({}, fd);
      if (result.ok) {
        toast(editing ? "Author updated" : "Author created", "success");
        reset();
      } else {
        toast(getErrorMessage(result.error), "error");
      }
    });
  }

  function remove(author: AuthorRow) {
    if (!window.confirm(`Delete author “${author.name}”? Books keep their authorName label but lose the link.`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", author.id);
      await deleteAuthorAction(fd);
      toast("Author deleted", "success");
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <Card className="divide-y divide-border shadow-pop-sm">
        {authors.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No authors yet. Create the first one.</p>
        ) : (
          authors.map((author) => (
            <div key={author.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{author.name}</p>
                <p className="truncate text-xs text-muted-foreground">/{author.slug}{author.bio ? ` · ${author.bio}` : ""}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => startEdit(author)} aria-label={`Edit ${author.name}`} className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground hover:shadow-pop-sm">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(author)} aria-label={`Delete ${author.name}`} className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-card hover:text-danger hover:shadow-pop-sm">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Card className="h-fit p-5 shadow-pop-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-mono text-lg">{editing ? "Edit author" : "New author"}</h2>
          {editing ? (
            <button type="button" onClick={reset} aria-label="Cancel editing" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="author-name">Name</Label>
            <Input id="author-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Robert C. Martin" />
          </div>
          <div>
            <Label htmlFor="author-bio">Bio</Label>
            <Textarea id="author-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Optional short bio" />
          </div>
          <Button onClick={submit} disabled={pending} className="w-full">
            <Plus className="h-4 w-4" aria-hidden /> {editing ? "Save changes" : "Create author"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
