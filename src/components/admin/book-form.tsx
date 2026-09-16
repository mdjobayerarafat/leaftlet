"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageIcon, Loader2, Sparkles, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui";
import { BookCover } from "@/components/books/book-cover";
import { useToast } from "@/components/providers/providers";
import { getErrorMessage } from "@/lib/utils";
import { renderFirstPageCover } from "@/lib/pdf/cover-generator";

interface AiMetadataResponse {
  metadata?: {
    title: string;
    description: string;
    authorName: string;
    categoryName: string;
    categoryId: string;
    language: string;
    publisher: string;
    publicationYear: number;
    pageCount: number;
    isbn: string;
    tags: string[];
  };
  error?: string;
}

export interface BookFormValues {
  id?: string;
  title: string;
  slug: string;
  description: string;
  authorId: string;
  categoryId: string;
  authorName: string;
  categoryName: string;
  language: string;
  publicationYear: string;
  isbn: string;
  publisher: string;
  pageCount: string;
  tags: string;
  status: string;
  isFeatured: boolean;
  allowDownload: boolean;
  pdfFileId: string;
  pdfFileName?: string;
  coverFileId: string;
}

export interface FormOption {
  id: string;
  name: string;
}

type UploadKind = "pdf" | "cover";

interface UploadState {
  kind: UploadKind;
  progress: number;
}

export function BookForm({
  mode,
  authors,
  categories,
  initial,
  submitAction,
}: {
  mode: "create" | "edit";
  authors: FormOption[];
  categories: FormOption[];
  initial: BookFormValues;
  submitAction: (state: { error?: string; ok?: boolean }, formData: FormData) => Promise<{ error?: string; ok?: boolean; createdId?: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [values, setValues] = useState(initial);
  const [aiBusy, setAiBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);

  const isCreate = mode === "create";

  /** Fills empty fields with AI-generated metadata from the PDF. */
  async function generateWithAi() {
    if (!values.pdfFileId) {
      toast("Upload a PDF first, then generate metadata.", "error");
      return;
    }
    setAiBusy(true);
    try {
      const res = await fetch("/api/admin/ai-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfFileId: values.pdfFileId }),
      });
      const body = (await res.json()) as AiMetadataResponse;
      if (!res.ok || !body.metadata) throw new Error(body.error ?? "AI generation failed");
      const m = body.metadata;
      setValues((prev) => ({
        ...prev,
        // Only fill fields the admin left empty — never overwrite their input.
        title: prev.title.trim() || m.title,
        description: prev.description.trim() || m.description,
        authorName: prev.authorName.trim() || m.authorName,
        language: prev.language.trim() || m.language,
        publisher: prev.publisher.trim() || m.publisher,
        publicationYear: prev.publicationYear.trim() || (m.publicationYear ? String(m.publicationYear) : ""),
        pageCount: prev.pageCount.trim() || (m.pageCount ? String(m.pageCount) : ""),
        isbn: prev.isbn.trim() || m.isbn,
        tags: prev.tags.trim() || m.tags.join(", "),
        categoryId: prev.categoryId || m.categoryId,
        categoryName: prev.categoryName.trim() || m.categoryName,
      }));
      toast("Details generated from the PDF", "success");
    } catch (err) {
      toast(getErrorMessage(err, "AI generation failed"), "error");
    } finally {
      setAiBusy(false);
    }
  }

  /** Renders the PDF's first page and uploads it as the cover. */
  async function usePdfFirstPageAsCover() {
    if (!values.pdfFileId) {
      toast("Upload a PDF first.", "error");
      return;
    }
    setCoverBusy(true);
    try {
      const blob = await renderFirstPageCover(`/api/admin/pdf/${encodeURIComponent(values.pdfFileId)}`);
      if (!blob) throw new Error("Could not render the PDF's first page");
      const file = new File([blob], "cover-from-pdf.jpg", { type: "image/jpeg" });
      await uploadFile("cover", file);
    } catch (err) {
      toast(getErrorMessage(err, "Cover generation failed"), "error");
      setCoverBusy(false);
    }
  }

  function set<K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function uploadFile(kind: UploadKind, file: File) {
    // Client-side pre-validation (server validates again).
    const allowed = kind === "pdf" ? ["application/pdf"] : ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast(`Invalid ${kind} file type`, "error");
      return;
    }
    setUpload({ kind, progress: 8 });
    try {
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("file", file);
      // XHR gives us real progress events; fetch does not.
      const fileId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/upload");
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUpload({ kind, progress: Math.round((e.loaded / e.total) * 92) + 8 });
        });
        xhr.addEventListener("load", () => {
          try {
            const body = JSON.parse(xhr.responseText) as { fileId?: string; error?: string };
            if (xhr.status >= 200 && xhr.status < 300 && body.fileId) resolve(body.fileId);
            else reject(new Error(body.error ?? "Upload failed"));
          } catch {
            reject(new Error("Upload failed"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.send(fd);
      });
      setUpload({ kind, progress: 100 });

      // In edit mode, replacing an existing file removes the old one from
      // storage so no orphans are left behind.
      if (!isCreate) {
        const previousId = kind === "pdf" ? initial.pdfFileId : initial.coverFileId;
        if (previousId && previousId !== fileId) {
          await fetch(`/api/admin/upload?kind=${kind}&fileId=${encodeURIComponent(previousId)}`, { method: "DELETE" }).catch(() => undefined);
        }
      }

      if (kind === "pdf") set("pdfFileId", fileId);
      else set("coverFileId", fileId);
      toast(`${kind === "pdf" ? "PDF" : "Cover"} uploaded — press “Save changes” to apply`, "success");
    } catch (err) {
      toast(getErrorMessage(err, "Upload failed"), "error");
    } finally {
      setTimeout(() => setUpload(null), 600);
      setCoverBusy(false);
    }
  }

  async function removeFile(kind: UploadKind) {
    const fileId = kind === "pdf" ? values.pdfFileId : values.coverFileId;
    if (!fileId) return;
    if (!window.confirm(`Remove this ${kind === "pdf" ? "PDF" : "cover"}? It will be deleted from storage when you save.`)) return;
    if (kind === "pdf") set("pdfFileId", "");
    else set("coverFileId", "");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    if (isCreate && !values.pdfFileId) {
      setError("Please upload a PDF file.");
      return;
    }
    setSubmitting(true);
    const formData = new FormData(formRef.current ?? undefined);
    formData.set("pdfFileId", values.pdfFileId);
    formData.set("coverFileId", values.coverFileId);
    // Files that existed before this edit session and were removed on the form.
    if (mode === "edit") {
      if (!values.pdfFileId && initial.pdfFileId) formData.set("removePdfFileId", initial.pdfFileId);
      if (!values.coverFileId && initial.coverFileId) formData.set("removeCoverFileId", initial.coverFileId);
    }
    try {
      const result = await submitAction({} as { error?: string }, formData);
      if (result.ok) {
        toast(mode === "create" ? "Book created" : "Book updated", "success");
        router.push("/admin/books");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const coverPreviewId = values.coverFileId || "";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {mode === "edit" && values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-[3px] border-2 border-border bg-secondary px-4 py-3 shadow-pop-sm">
          <div>
            <p className="font-mono text-sm font-bold uppercase tracking-wide text-secondary-foreground">Auto-fill with AI</p>
            <p className="text-xs text-muted-foreground">Generates only the empty fields from the PDF text.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={generateWithAi} disabled={aiBusy || !values.pdfFileId}>
            {aiBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden /> Generate
              </>
            )}
          </Button>
        </div>
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input id="title" name="title" required value={values.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" value={values.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from title" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={6} value={values.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="authorId">Author</Label>
            <Select id="authorId" name="authorId" value={values.authorId} onChange={(e) => set("authorId", e.target.value)}>
              <option value="">— Select author —</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select id="categoryId" name="categoryId" value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="language">Language</Label>
            <Input id="language" name="language" value={values.language} onChange={(e) => set("language", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="publicationYear">Publication year</Label>
            <Input id="publicationYear" name="publicationYear" type="number" value={values.publicationYear} onChange={(e) => set("publicationYear", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="isbn">ISBN</Label>
            <Input id="isbn" name="isbn" value={values.isbn} onChange={(e) => set("isbn", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="publisher">Publisher</Label>
            <Input id="publisher" name="publisher" value={values.publisher} onChange={(e) => set("publisher", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pageCount">Page count</Label>
            <Input id="pageCount" name="pageCount" type="number" min="0" value={values.pageCount} onChange={(e) => set("pageCount", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" name="tags" value={values.tags} onChange={(e) => set("tags", e.target.value)} placeholder="programming, bestseller" />
          </div>
        </div>
        {values.authorId === "" ? (
          <div>
            <Label htmlFor="authorName">Author display name</Label>
            <Input id="authorName" name="authorName" value={values.authorName} onChange={(e) => set("authorName", e.target.value)} placeholder="Shown when no author record is selected" />
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        <div className="rounded-[3px] border-2 border-border bg-card p-4 shadow-pop-sm">
          <Label>Cover image</Label>
          {coverPreviewId ? (
            <div className="space-y-3">
              <div className="flex justify-center py-2">
                <BookCover fileId={coverPreviewId} title={values.title || "Book cover"} author={values.authorName} size="lg" />
              </div>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer rounded-[2px] border-2 border-border bg-card px-3 py-2 text-center font-mono text-xs font-bold uppercase shadow-pop-sm hover:bg-muted">
                  Replace
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile("cover", file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={usePdfFirstPageAsCover}
                  disabled={coverBusy || !values.pdfFileId}
                  title="Render the PDF's first page as the cover"
                  className="flex items-center gap-1.5 rounded-[2px] border-2 border-border bg-card px-3 py-2 font-mono text-xs font-bold uppercase shadow-pop-sm hover:bg-muted disabled:opacity-50"
                >
                  {coverBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileText className="h-3.5 w-3.5" aria-hidden />}
                  PDF p.1
                </button>
                <button
                  type="button"
                  onClick={() => removeFile("cover")}
                  aria-label="Remove cover"
                  className="rounded-[2px] border-2 border-border bg-card px-3 py-2 font-mono text-xs font-bold uppercase text-danger shadow-pop-sm hover:bg-muted"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <UploadZone accept="image/jpeg,image/png,image/webp" onFile={(f) => uploadFile("cover", f)} busy={upload?.kind === "cover"} progress={upload?.kind === "cover" ? upload.progress : undefined} label="Upload cover" icon={<ImageIcon className="h-5 w-5" />} />
              <button
                type="button"
                onClick={usePdfFirstPageAsCover}
                disabled={coverBusy || !values.pdfFileId}
                className="w-full rounded-[2px] border-2 border-border bg-card px-3 py-2 font-mono text-xs font-bold uppercase shadow-pop-sm hover:bg-muted disabled:opacity-50"
              >
                {coverBusy ? "Rendering page 1…" : "Use PDF page 1 as cover"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-[3px] border-2 border-border bg-card p-4 shadow-pop-sm">
          <Label>PDF file {mode === "create" ? "*" : ""}</Label>
          {values.pdfFileId ? (
            <div className="flex items-center justify-between rounded-[2px] border-2 border-border bg-input px-3 py-2">
              <span className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-foreground"><FileText className="h-4 w-4 text-primary" /> PDF attached</span>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-[2px] border-2 border-transparent p-1 text-muted-foreground hover:border-border hover:shadow-pop-sm" aria-label="Replace PDF">
                  <UploadCloud className="h-4 w-4" />
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile("pdf", file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button type="button" onClick={() => removeFile("pdf")} aria-label="Remove PDF" className="rounded-[2px] border-2 border-transparent p-1 text-danger hover:border-border hover:shadow-pop-sm">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <UploadZone accept="application/pdf" onFile={(f) => uploadFile("pdf", f)} busy={upload?.kind === "pdf"} progress={upload?.kind === "pdf" ? upload.progress : undefined} label="Upload PDF" icon={<FileText className="h-5 w-5" />} />
          )}
        </div>

        <div className="rounded-[3px] border-2 border-border bg-card p-4 shadow-pop-sm">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" value={values.status} onChange={(e) => set("status", e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFeatured" checked={values.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="h-4 w-4 rounded border-border" />
            Featured book
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="allowDownload" checked={values.allowDownload} onChange={(e) => set("allowDownload", e.target.checked)} className="h-4 w-4 rounded border-border" />
            Allow PDF download
          </label>
        </div>

        {error ? <FieldError>{error}</FieldError> : null}

        <Button type="submit" className="w-full" size="lg" disabled={submitting || !!upload}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {mode === "create" ? "Creating…" : "Saving…"}
            </>
          ) : (
            isCreate ? "Create book" : "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}

function UploadZone({
  accept,
  onFile,
  busy,
  progress,
  label,
  icon,
}: {
  accept: string;
  onFile: (file: File) => void;
  busy?: boolean;
  progress?: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[3px] border-2 border-dashed border-border bg-input px-4 py-8 text-center transition-colors hover:bg-muted">
      {busy ? <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden /> : <span className="text-primary">{icon}</span>}
      <span className="text-sm font-medium text-foreground">{busy ? `Uploading… ${progress ?? 0}%` : label}</span>
      <span className="text-xs text-muted-foreground">Click to choose a file</span>
      <UploadCloud className="h-4 w-4 text-muted-foreground" aria-hidden />
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      {busy && typeof progress === "number" ? (
        <span className="sr-only" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
      ) : null}
    </label>
  );
}
