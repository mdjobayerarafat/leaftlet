"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ReaderPrefs } from "@/types";
import { cn } from "@/lib/utils";

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function ReaderSettingsPanel({
  prefs,
  onChange,
  onClose,
  pageCount,
  onGoToPage,
  effectiveZoom,
  onZoomIn,
  onZoomOut,
}: {
  prefs: ReaderPrefs;
  onChange: (patch: Partial<ReaderPrefs>) => void;
  onClose: () => void;
  pageCount: number;
  onGoToPage: (page: number) => void;
  effectiveZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const [pageInput, setPageInput] = useState("");

  return (
    <div className="space-y-6" aria-label="Reader settings">
      <div className="flex items-center justify-between">
        <h2 className="heading-mono text-lg">Settings</h2>
        <button type="button" onClick={onClose} aria-label="Close settings" className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-muted hover:shadow-pop-sm">
          <X className="h-4 w-4" />
        </button>
      </div>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theme</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "sepia", "dark"] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => onChange({ theme })}
              aria-pressed={prefs.theme === theme}
              className={cn(
                "rounded-[2px] border-2 px-2 py-2 font-mono text-xs font-bold uppercase",
                prefs.theme === theme ? "border-border bg-primary text-primary-foreground shadow-pop-sm" : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {theme}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zoom</h3>
        <div className="flex items-center justify-between rounded-[3px] border-2 border-border bg-input px-3 py-1.5">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={effectiveZoom <= 0.5}
            aria-label="Zoom out"
            className="min-h-9 rounded-[2px] border-2 border-transparent px-3 text-lg leading-none text-foreground hover:border-border hover:bg-card hover:shadow-pop-sm disabled:opacity-40"
          >
            −
          </button>
          <span className="font-mono text-sm font-bold tabular-nums text-foreground" aria-live="polite">{Math.round(effectiveZoom * 100)}%</span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={effectiveZoom >= 2}
            aria-label="Zoom in"
            className="min-h-9 rounded-[2px] border-2 border-transparent px-3 text-lg leading-none text-foreground hover:border-border hover:bg-card hover:shadow-pop-sm disabled:opacity-40"
          >
            +
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {ZOOMS.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => onChange({ zoom: z, fit: "none" })}
              aria-pressed={prefs.fit === "none" && Math.abs(prefs.zoom - z) < 0.001}
              className={cn(
                "min-h-9 rounded-[2px] border-2 px-3 font-mono text-xs font-bold",
                prefs.fit === "none" && Math.abs(prefs.zoom - z) < 0.001 ? "border-border bg-primary text-primary-foreground shadow-pop-sm" : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {z * 100}%
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onChange({ fit: "width" })} aria-pressed={prefs.fit === "width"} className={cn("min-h-9 rounded-[2px] border-2 px-3 font-mono text-xs font-bold", prefs.fit === "width" ? "border-border bg-primary text-primary-foreground shadow-pop-sm" : "border-border bg-card text-muted-foreground hover:bg-muted")}>Fit width</button>
          <button type="button" onClick={() => onChange({ fit: "page" })} aria-pressed={prefs.fit === "page"} className={cn("min-h-9 rounded-[2px] border-2 px-3 font-mono text-xs font-bold", prefs.fit === "page" ? "border-border bg-primary text-primary-foreground shadow-pop-sm" : "border-border bg-card text-muted-foreground hover:bg-muted")}>Fit page</button>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Page layout</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["single", "double", "continuous"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ layout: mode })}
              aria-pressed={prefs.layout === mode}
              className={cn(
                "rounded-[2px] border-2 px-2 py-2 font-mono text-xs font-bold uppercase",
                prefs.layout === mode ? "border-border bg-primary text-primary-foreground shadow-pop-sm" : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Two-page spread activates on wide screens. Continuous view renders one long column.</p>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reading controls</h3>
        <label className="flex items-center justify-between py-1.5 text-sm">
          Show page number
          <input type="checkbox" checked={prefs.showPageNumber} onChange={(e) => onChange({ showPageNumber: e.target.checked })} className="h-4 w-4 rounded border-border" />
        </label>
        <label className="flex items-center justify-between py-1.5 text-sm">
          Show progress bar
          <input type="checkbox" checked={prefs.showProgressBar} onChange={(e) => onChange({ showProgressBar: e.target.checked })} className="h-4 w-4 rounded border-border" />
        </label>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Go to page</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const page = Number(pageInput);
            if (Number.isFinite(page) && page >= 1 && page <= pageCount) {
              onGoToPage(page);
              setPageInput("");
            }
          }}
          className="flex gap-2"
        >
          <input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder={`1–${pageCount}`}
            aria-label="Page number"
            className="h-9 w-full rounded-[2px] border-2 border-border bg-input px-3 font-mono text-sm font-bold"
          />
          <button type="submit" className="rounded-[2px] border-2 border-border bg-primary px-3 font-mono text-sm font-bold uppercase text-primary-foreground shadow-pop-sm">Go</button>
        </form>
      </section>
    </div>
  );
}
