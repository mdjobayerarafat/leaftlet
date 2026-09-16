"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui";
import { useToast } from "@/components/providers/providers";
import { deleteCategoryAction, upsertCategoryAction } from "@/lib/admin/actions";
import { getErrorMessage } from "@/lib/utils";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export function AdminCategoriesForm({ categories }: { categories: CategoryRow[] }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function startEdit(category: CategoryRow) {
    setEditing(category);
    setName(category.name);
    setDescription(category.description);
  }

  function reset() {
    setEditing(null);
    setName("");
    setDescription("");
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
      fd.set("description", description);
      const result = await upsertCategoryAction({}, fd);
      if (result.ok) {
        toast(editing ? "Category updated" : "Category created", "success");
        reset();
      } else {
        toast(getErrorMessage(result.error), "error");
      }
    });
  }

  function remove(category: CategoryRow) {
    if (!window.confirm(`Delete category “${category.name}”? Books keep their categoryName label but lose the link.`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", category.id);
      await deleteCategoryAction(fd);
      toast("Category deleted", "success");
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <Card className="divide-y divide-border shadow-pop-sm">
        {categories.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No categories yet. Create the first one.</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
                <p className="truncate text-xs text-muted-foreground">/{category.slug}{category.description ? ` · ${category.description}` : ""}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => startEdit(category)} aria-label={`Edit ${category.name}`} className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground hover:shadow-pop-sm">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(category)} aria-label={`Delete ${category.name}`} className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-card hover:text-danger hover:shadow-pop-sm">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Card className="h-fit p-5 shadow-pop-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-mono text-lg">{editing ? "Edit category" : "New category"}</h2>
          {editing ? (
            <button type="button" onClick={reset} aria-label="Cancel editing" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Programming" />
          </div>
          <div>
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional description" />
          </div>
          <Button onClick={submit} disabled={pending} className="w-full">
            <Plus className="h-4 w-4" aria-hidden /> {editing ? "Save changes" : "Create category"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
