"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Loader2, Maximize, Minimize, Minus, MoreVertical, Plus, Search,
  Settings2, StickyNote, X, Bookmark as BookmarkIcon,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdf, extractOutline } from "@/lib/pdf/loader";
import { PdfPageCanvas } from "@/components/reader/pdf-page-canvas";
import { ReaderSettingsPanel } from "@/components/reader/reader-settings-panel";
import { ReaderSearchPanel } from "@/components/reader/reader-search-panel";
import { ReaderNotesPanel } from "@/components/reader/reader-notes-panel";
import { DEFAULT_READER_PREFS, type Bookmark, type Highlight, type Note, type ReaderPrefs, type SidebarTab, type TocItem } from "@/types";
import { clamp, cn, getErrorMessage, progressPercent } from "@/lib/utils";
import { useToast } from "@/components/providers/providers";
import {
  createNoteAction, deleteNoteAction, saveProgressAction, toggleBookmarkAction, updateNoteAction,
} from "@/lib/reading/actions";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

export interface ReaderBook {
  id: string;
  title: string;
  authorName: string;
  pdfFileId: string;
  pageCount: number;
  allowDownload: boolean;
  slug: string;
}

interface Props {
  book: ReaderBook;
  authed: boolean;
  initialPage: number;
  initialProgressPage: number | null;
  prefs: ReaderPrefs;
  bookmarks: Bookmark[];
  notes: Note[];
}

export function EbookReader({ book, authed, initialPage, initialProgressPage, prefs: initialPrefs, bookmarks: initialBookmarks, notes: initialNotes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  /* --------------------------------- Doc load -------------------------------- */
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pdfUrl = `/api/books/${book.id}/file`;

  useEffect(() => {
    let cancelled = false;
    loadPdf(pdfUrl)
      .then((loaded) => {
        if (cancelled) {
          loaded.destroy();
          return;
        }
        setDoc(loaded);
        setNumPages(loaded.numPages);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getErrorMessage(error, "The PDF could not be loaded."));
      });
    return () => {
      cancelled = true;
      doc?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfUrl]);

  /* ---------------------------------- State ---------------------------------- */
  const [currentPage, setCurrentPage] = useState(clamp(initialPage, 1, Math.max(1, numPages || initialPage)));
  const [prefs, setPrefs] = useState<ReaderPrefs>({ ...DEFAULT_READER_PREFS, ...initialPrefs });
  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(800);
  const [pageAspect, setPageAspect] = useState(1.414);
  const [showToc, setShowToc] = useState(false);
  const [activePanel, setActivePanel] = useState<SidebarTab | null>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [outline, setOutline] = useState<TocItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selection, setSelection] = useState<{ pageNumber: number; text: string; rects: Array<{ x: number; y: number; width: number; height: number }> } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layout = prefs.layout === "double" && containerWidth >= 1024 ? "double" : prefs.layout === "continuous" ? "continuous" : "single";

  const visiblePages = useMemo(() => {
    if (!numPages) return [];
    if (layout === "double") {
      const isEven = currentPage % 2 === 0;
      const left = isEven ? currentPage : currentPage - 1;
      const right = left + 1;
      return [left, right].filter((p) => p >= 1 && p <= numPages);
    }
    return [currentPage];
  }, [currentPage, layout, numPages]);

  const pageWidth = Math.max(200, (containerWidth - 32) / (layout === "double" ? 2 : 1));

  /** Effective render zoom: the manual zoom, or a value derived from the fit mode. */
  const effectiveZoom = useMemo(() => {
    if (prefs.fit === "none") return prefs.zoom;
    if (prefs.fit === "page") {
      const fitHeight = Math.max(320, containerHeight - 32) / (pageWidth * pageAspect);
      return clamp(Math.min(1, fitHeight), ZOOM_MIN, ZOOM_MAX);
    }
    return 1; // fit width
  }, [prefs.fit, prefs.zoom, containerHeight, pageWidth, pageAspect]);

  const effectiveZoomRef = useRef(effectiveZoom);
  useEffect(() => {
    effectiveZoomRef.current = effectiveZoom;
  }, [effectiveZoom]);

  /* --------------------------------- Settings --------------------------------- */
  const updatePrefs = useCallback((patch: Partial<ReaderPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      void fetch("/api/reader-prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs: next }),
      }).catch(() => undefined);
      return next;
    });
  }, []);

  const setManualZoom = useCallback(
    (zoom: number) => {
      updatePrefs({ zoom: clamp(Math.round(zoom * 100) / 100, ZOOM_MIN, ZOOM_MAX), fit: "none" });
    },
    [updatePrefs]
  );
  const zoomIn = useCallback(() => setManualZoom(effectiveZoomRef.current + ZOOM_STEP), [setManualZoom]);
  const zoomOut = useCallback(() => setManualZoom(effectiveZoomRef.current - ZOOM_STEP), [setManualZoom]);

  /* ------------------------------ Container size ----------------------------- */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Real aspect ratio of the PDF's first page (needed for fit-page zoom).
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    void doc.getPage(1).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1 });
      setPageAspect(viewport.height / viewport.width);
      page.cleanup();
    });
    return () => {
      cancelled = true;
    };
  }, [doc]);

  /* --------------------------------- Progress -------------------------------- */
  const persistProgress = useCallback(
    (page: number, total: number) => {
      if (!authed || !total) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await saveProgressAction({ bookId: book.id, currentPage: page, totalPages: total });
        } catch {
          // Silent: retried on next page change.
        }
      }, 1500);
    },
    [authed, book.id]
  );

  const goToPage = useCallback(
    (page: number, options?: { updateUrl?: boolean }) => {
      if (!numPages) return;
      const next = clamp(page, 1, numPages);
      setCurrentPage(next);
      persistProgress(next, numPages);
      contentRef.current?.scrollTo({ top: 0 });
      if (options?.updateUrl !== false) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(next));
        router.replace(`/read/${book.id}?${params.toString()}`, { scroll: false });
      }
    },
    [numPages, persistProgress, router, book.id, searchParams]
  );

  // Save progress when leaving the reader (cleanup).
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (authed && numPages > 0) {
        void saveProgressAction({ bookId: book.id, currentPage: currentPageRef.current, totalPages: numPages }).catch(() => undefined);
      }
    };
  }, [authed, book.id, numPages]);

  const currentPageRef = useRef(currentPage);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  /* ---------------------------- Continue reading UX --------------------------- */
  const [resumePrompt, setResumePrompt] = useState(initialProgressPage !== null && initialProgressPage > 1 && !Number.isFinite(Number(searchParams.get("page"))));

  /* --------------------------------- Outline --------------------------------- */
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    extractOutline(doc).then((items) => {
      if (!cancelled) setOutline(items);
    });
    return () => {
      cancelled = true;
    };
  }, [doc]);

  /* ------------------------------ Keyboard input ------------------------------ */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return; // keep browser zoom/shortcuts working
      if (!doc) return;

      switch (event.key) {
        case "ArrowLeft":
          goToPage(currentPageRef.current - 1);
          break;
        case "ArrowRight":
        case " ":
          event.preventDefault();
          goToPage(currentPageRef.current + 1);
          break;
        case "Home":
          goToPage(1);
          break;
        case "End":
          goToPage(numPages);
          break;
        case "+":
        case "=":
          event.preventDefault();
          zoomIn();
          break;
        case "-":
        case "_":
          event.preventDefault();
          zoomOut();
          break;
        case "f":
        case "F":
          toggleImmersive();
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doc, numPages, goToPage, zoomIn, zoomOut]);

  function toggleImmersive() {
    setImmersive((v) => {
      const next = !v;
      if (!document.fullscreenElement && next) void document.documentElement.requestFullscreen?.().catch(() => undefined);
      if (document.fullscreenElement && !next) void document.exitFullscreen?.().catch(() => undefined);
      return next;
    });
  }

  /* --------------------------- Swipe navigation (touch) ----------------------- */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
    }

    function onTouchEnd(event: TouchEvent) {
      if (!tracking) return;
      tracking = false;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      // Horizontal, deliberate swipe; vertical scrolling stays untouched.
      if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 2.5) {
        if (dx < 0) goToPage(currentPageRef.current + 1);
        else goToPage(currentPageRef.current - 1);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [goToPage]);

  /* ------------------------ Tap-to-toggle chrome (mobile) --------------------- */
  const lastTapRef = useRef(0);
  function handleContentTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double-tap toggles immersive on mobile.
      lastTapRef.current = 0;
      setImmersive((v) => {
        const next = !v;
        return next;
      });
    }
    lastTapRef.current = now;
  }

  /* --------------------------------- Bookmarks -------------------------------- */
  const bookmarkedPage = bookmarks.find((b) => b.pageNumber === currentPage);

  function toggleBookmark() {
    if (!authed) {
      toast("Sign in to bookmark pages", "info");
      return;
    }
    const existing = bookmarks.find((b) => b.pageNumber === currentPage);
    if (existing) {
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      toggleBookmarkAction({ bookId: book.id, pageNumber: currentPage, bookmarkId: existing.id }).catch(() => {
        setBookmarks((prev) => [...prev, existing]);
        toast("Could not remove bookmark", "error");
      });
      toast("Bookmark removed", "success");
    } else {
      const optimistic: Bookmark = { id: `temp-${Date.now()}`, userId: "", bookId: book.id, pageNumber: currentPage, title: `Page ${currentPage}`, createdAt: new Date().toISOString() };
      setBookmarks((prev) => [...prev, optimistic]);
      toggleBookmarkAction({ bookId: book.id, pageNumber: currentPage })
        .then((res) => {
          if (res.bookmarkId) {
            setBookmarks((prev) => prev.map((b) => (b.id === optimistic.id ? { ...b, id: res.bookmarkId! } : b)));
          }
          toast("Bookmark added", "success");
        })
        .catch(() => {
          setBookmarks((prev) => prev.filter((b) => b.id !== optimistic.id));
          toast("Could not add bookmark", "error");
        });
    }
  }

  /* ----------------------------------- Notes ---------------------------------- */
  function handleSaveNote(content: string, noteId?: string) {
    if (!authed) {
      toast("Sign in to save notes", "info");
      return;
    }
    if (noteId) {
      updateNoteAction({ noteId, content }).then(() => {
        setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, content, updatedAt: new Date().toISOString() } : n)));
        toast("Note updated", "success");
      }).catch(() => toast("Could not update note", "error"));
    } else {
      createNoteAction({ bookId: book.id, pageNumber: currentPage, content }).then((res) => {
        if (res.id) {
          setNotes((prev) => [{ id: res.id!, userId: "", bookId: book.id, pageNumber: currentPage, content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]);
        }
        toast("Note saved", "success");
      }).catch(() => toast("Could not save note", "error"));
    }
  }

  function handleDeleteNote(noteId: string) {
    deleteNoteAction({ noteId }).then(() => {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast("Note deleted", "success");
    }).catch(() => toast("Could not delete note", "error"));
  }

  /* -------------------------------- Highlights -------------------------------- */
  function saveHighlight(color: "yellow" | "green" | "blue" | "pink", note?: string) {
    if (!authed || !selection) return;
    // Store locally for the session; server persistence mirrors notes flow.
    const created: Highlight = {
      id: `local-${Date.now()}`,
      userId: "",
      bookId: book.id,
      pageNumber: selection.pageNumber,
      selectedText: selection.text,
      positionData: { rects: selection.rects },
      color,
      note: note ?? "",
      createdAt: new Date().toISOString(),
    };
    setLocalHighlights((prev) => [...prev.filter((h) => !(h.pageNumber === created.pageNumber)), created]);
    setSelection(null);
    toast("Highlight saved", "success");
  }

  const [localHighlights, setLocalHighlights] = useState<Highlight[]>([]);
  const pageHighlights = useMemo(
    () => localHighlights.filter((h) => h.pageNumber === currentPage),
    [localHighlights, currentPage]
  );

  /* ---------------------------------- Search ---------------------------------- */
  function openSearch() {
    setActivePanel("search");
  }

  /* ------------------------------ Page stepping ------------------------------- */
  // In double-page layout one step advances a full spread.
  const pageStep = layout === "double" ? 2 : 1;
  const prevPage = () => goToPage(currentPage - pageStep);
  const nextPage = () => goToPage(currentPage + pageStep);
  const canPrev = currentPage > 1;
  const canNext = currentPage < numPages;

  /* ---------------------------------- Render ---------------------------------- */
  const progress = numPages ? progressPercent(currentPage, numPages) : 0;

  if (loadError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">This book could not be opened</p>
        <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
        <Link href={`/books/${book.slug}`} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Back to book details</Link>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm font-medium text-foreground">Loading book…</p>
        <p className="text-xs text-muted-foreground">Preparing your reading experience</p>
      </div>
    );
  }

  const tocButton = (
    <button
      type="button"
      onClick={() => setShowToc((v) => !v)}
      className="rounded-[3px] border-2 border-transparent p-2 text-foreground transition-colors hover:border-border hover:bg-card hover:shadow-pop-sm"
      aria-label="Table of contents"
      aria-expanded={showToc}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
        <path d="M4 6h16M4 12h10M4 18h14" />
      </svg>
    </button>
  );

  return (
    <div className="flex h-svh flex-col bg-background" data-theme-scope>
      {/* Top bar */}
      <header
        className={cn(
          "z-20 shrink-0 border-b-2 border-border bg-secondary transition-opacity",
          immersive && "pointer-events-none absolute inset-x-0 top-0 opacity-0"
        )}
      >
        <div className="flex h-16 items-center gap-1 px-2 sm:px-4 sm:gap-2">
          <Link href={`/books/${book.slug}`} className="rounded-[3px] border-2 border-transparent p-2 text-foreground hover:border-border hover:bg-card hover:shadow-pop-sm" aria-label="Back to book details">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-bold text-foreground">{book.title}</p>
            <p className="hidden truncate text-xs text-foreground/70 sm:block">{book.authorName}</p>
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <span className="mr-1 hidden font-mono text-xs font-bold text-foreground/70 md:block">Page {currentPage} / {numPages}</span>
            {tocButton}
            <div className="hidden items-center gap-0.5 md:flex">
              <ReaderTopIconButton label="Zoom out" onClick={zoomOut} disabled={effectiveZoom <= ZOOM_MIN}><Minus className="h-4 w-4" /></ReaderTopIconButton>
              <span className="min-w-11 text-center text-xs font-medium tabular-nums text-muted-foreground" aria-live="polite">{Math.round(effectiveZoom * 100)}%</span>
              <ReaderTopIconButton label="Zoom in" onClick={zoomIn} disabled={effectiveZoom >= ZOOM_MAX}><Plus className="h-4 w-4" /></ReaderTopIconButton>
            </div>
            <ReaderTopIconButton label="Search in book" onClick={openSearch} className="hidden md:inline-flex"><Search className="h-4 w-4" /></ReaderTopIconButton>
            <ReaderTopIconButton label={bookmarkedPage ? "Bookmarked" : "Bookmark this page"} onClick={toggleBookmark} active={!!bookmarkedPage}><BookmarkIcon className="h-4 w-4" /></ReaderTopIconButton>
            {/* Everything else folds into an overflow menu on mobile. */}
            <div className="hidden md:flex md:items-center md:gap-1">
              <ReaderTopIconButton label="Notes" onClick={() => setActivePanel(activePanel === "notes" ? null : "notes")} active={activePanel === "notes"}><StickyNote className="h-4 w-4" /></ReaderTopIconButton>
              <ReaderTopIconButton label={immersive ? "Exit immersive mode" : "Immersive mode"} onClick={toggleImmersive}>{immersive ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</ReaderTopIconButton>
              <ReaderTopIconButton label="Settings" onClick={() => setActivePanel(activePanel === "settings" ? null : "settings")} active={activePanel === "settings"}><Settings2 className="h-4 w-4" /></ReaderTopIconButton>
            </div>
            <div className="md:hidden">
              <ReaderTopIconButton label="More options" onClick={() => setOverflowOpen((v) => !v)} active={overflowOpen}><MoreVertical className="h-5 w-5" /></ReaderTopIconButton>
            </div>
          </div>
        </div>
        {prefs.showProgressBar ? (
          <div className="h-1 w-full bg-background/40">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        ) : null}

        {/* Mobile overflow menu */}
        {overflowOpen ? (
          <div className="absolute inset-x-0 top-full z-30 border-b-2 border-border bg-card p-2 shadow-pop md:hidden" role="menu">
            <div className="grid grid-cols-4 gap-1">
              <ReaderMenuTile icon={<StickyNote className="h-5 w-5" />} label="Notes" onClick={() => { setActivePanel(activePanel === "notes" ? null : "notes"); setOverflowOpen(false); }} />
              <ReaderMenuTile icon={<Search className="h-5 w-5" />} label="Search" onClick={() => { openSearch(); setOverflowOpen(false); }} />
              <ReaderMenuTile icon={immersive ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />} label="Immersive" onClick={() => { toggleImmersive(); setOverflowOpen(false); }} />
              <ReaderMenuTile icon={<Settings2 className="h-5 w-5" />} label="Settings" onClick={() => { setActivePanel(activePanel === "settings" ? null : "settings"); setOverflowOpen(false); }} />
            </div>
            <div className="mt-2 flex items-center justify-between rounded-[3px] border-2 border-border px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">Zoom</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={zoomOut} disabled={effectiveZoom <= ZOOM_MIN} className="rounded-lg p-2 text-foreground hover:bg-muted disabled:opacity-40" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
                <span className="w-12 text-center text-xs font-medium tabular-nums text-foreground">{Math.round(effectiveZoom * 100)}%</span>
                <button type="button" onClick={zoomIn} disabled={effectiveZoom >= ZOOM_MAX} className="rounded-lg p-2 text-foreground hover:bg-muted disabled:opacity-40" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1">
        {/* Left sidebar: TOC / bookmarks (desktop) */}
        {showToc ? (
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-r-2 border-border bg-card p-3 thin-scrollbar md:block">
            <ReaderTocPanel outline={outline} bookmarks={bookmarks} goToPage={goToPage} />
          </aside>
        ) : null}

        {/* Center: pages */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          {/* Side prev/next arrows (desktop/tablet). */}
          <button
            type="button"
            onClick={prevPage}
            disabled={!canPrev}
            aria-label="Previous page"
            className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-[3px] border-2 border-border bg-card p-3 text-foreground shadow-pop-sm transition-all hover:-translate-x-0.5 hover:shadow-pop disabled:pointer-events-none disabled:opacity-0 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={nextPage}
            disabled={!canNext}
            aria-label="Next page"
            className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-[3px] border-2 border-border bg-card p-3 text-foreground shadow-pop-sm transition-all hover:-translate-x-0.5 hover:shadow-pop disabled:pointer-events-none disabled:opacity-0 sm:flex"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <div
            ref={contentRef}
            className="h-full overflow-auto bg-muted/40 p-3 thin-scrollbar sm:p-6"
            onClick={handleContentTap}
          >
          {resumePrompt ? (
            <div className="mx-auto mb-4 max-w-md rounded-[3px] border-2 border-border bg-card p-4 text-center shadow-pop-sm">
              <p className="text-sm text-foreground">Continue from page {initialProgressPage}?</p>
              <div className="mt-3 flex justify-center gap-2">
                <button type="button" onClick={() => { goToPage(initialProgressPage!); setResumePrompt(false); }} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Continue reading</button>
                <button type="button" onClick={() => setResumePrompt(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">Start from beginning</button>
              </div>
            </div>
          ) : null}

          <div className={cn("flex w-max min-w-full items-start justify-center gap-2", layout === "double" && "gap-4")}>
            {visiblePages.map((page) => (
              <PdfPageCanvas
                key={page}
                doc={doc}
                pageNumber={page}
                width={pageWidth}
                zoom={effectiveZoom}
                highlights={pageHighlights}
                onTextSelect={setSelection}
              />
            ))}
          </div>

          {/* Bottom spacer so the fixed mobile bar never covers the page. */}
          <div className="h-20 sm:hidden" aria-hidden />
          </div>
        </div>

        {/* Mobile TOC slide-over */}
        {showToc ? (
          <div className="absolute inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Table of contents">
            <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => setShowToc(false)} />
            <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto border-r-2 border-border bg-card p-3 shadow-pop thin-scrollbar">
              <div className="mb-2 flex items-center justify-between">
                <p className="heading-mono text-sm">Contents</p>
                <button type="button" onClick={() => setShowToc(false)} className="rounded-[3px] border-2 border-transparent p-1.5 text-muted-foreground hover:border-border hover:bg-muted hover:shadow-pop-sm" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ReaderTocPanel outline={outline} bookmarks={bookmarks} goToPage={(p) => { goToPage(p); setShowToc(false); }} />
            </aside>
          </div>
        ) : null}

        {/* Right panel: settings / search / notes — bottom sheet on mobile, sidebar on desktop */}
        {activePanel ? (
          <>
            <button
              type="button"
              className="absolute inset-0 z-30 bg-black/40 lg:hidden"
              aria-label="Close panel"
              onClick={() => setActivePanel(null)}
            />
            <aside
              className={cn(
                "z-40 overflow-y-auto bg-card shadow-pop thin-scrollbar",
                // Mobile: bottom sheet with safe-area padding.
                "inset-x-0 bottom-0 max-h-[75dvh] rounded-t-lg border-t-2 border-border pb-safe",
                // Desktop: fixed-width side panel.
                "lg:static lg:inset-auto lg:max-h-none lg:w-80 lg:shrink-0 lg:rounded-none lg:border-l-2 lg:border-t-0 lg:shadow-none"
              )}
              role="dialog"
              aria-label={activePanel === "settings" ? "Reader settings" : activePanel === "search" ? "Search in book" : "Notes"}
            >
              <div className="mx-auto mt-2 h-1.5 w-10 rounded-full border border-border bg-muted lg:hidden" aria-hidden />
              {activePanel === "settings" ? (
                <ReaderSettingsPanel
                  prefs={prefs}
                  onChange={updatePrefs}
                  onClose={() => setActivePanel(null)}
                  pageCount={numPages}
                  onGoToPage={goToPage}
                  effectiveZoom={effectiveZoom}
                  onZoomIn={zoomIn}
                  onZoomOut={zoomOut}
                />
              ) : null}
              {activePanel === "search" ? (
                <ReaderSearchPanel doc={doc} pdfUrl={pdfUrl} onGoToPage={(p) => { goToPage(p); }} onClose={() => { setActivePanel(null); }} />
              ) : null}
              {activePanel === "notes" ? (
                <ReaderNotesPanel
                  notes={notes}
                  bookmarks={bookmarks}
                  currentPage={currentPage}
                  onSave={(content, noteId) => handleSaveNote(content, noteId)}
                  onDelete={handleDeleteNote}
                  onGoToPage={goToPage}
                  onClose={() => setActivePanel(null)}
                />
              ) : null}
            </aside>
          </>
        ) : null}
      </div>

      {/* Desktop bottom bar: prev / page input / next. */}
      <div className="hidden shrink-0 items-center justify-center gap-3 border-t-2 border-border bg-card px-4 py-2.5 sm:flex">
        <button
          type="button"
          onClick={prevPage}
          disabled={!canPrev}
          className="inline-flex items-center gap-1.5 rounded-[3px] border-2 border-border bg-card px-4 py-2 font-mono text-sm font-bold text-foreground shadow-pop-sm transition-all hover:-translate-y-px hover:shadow-pop disabled:pointer-events-none disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
        </button>
        <div className="flex items-center gap-2 px-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={numPages || undefined}
            value={currentPage}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= 1) goToPage(Math.floor(v));
            }}
            className="h-9 w-14 rounded-[2px] border-2 border-border bg-input text-center font-mono text-sm font-bold"
            aria-label="Current page"
          />
          <span className="font-mono text-sm text-muted-foreground">/ {numPages}</span>
        </div>
        <button
          type="button"
          onClick={nextPage}
          disabled={!canNext}
          className="inline-flex items-center gap-1.5 rounded-[3px] border-2 border-border bg-card px-4 py-2 font-mono text-sm font-bold text-foreground shadow-pop-sm transition-all hover:-translate-y-px hover:shadow-pop disabled:pointer-events-none disabled:opacity-40"
          aria-label="Next page"
        >
          Next <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Mobile bottom bar: page jump + prev/next (mirrors the spec's mobile layout). */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 border-t-2 border-border bg-secondary pb-safe sm:hidden">
        <div className="pointer-events-auto flex items-center justify-between gap-2 p-2">
          <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="rounded-[3px] border-2 border-border bg-card px-5 py-2.5 font-mono text-sm font-bold shadow-pop-sm disabled:opacity-40" aria-label="Previous page">←</button>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={numPages || undefined}
              value={currentPage}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v >= 1) goToPage(Math.floor(v));
              }}
              className="h-9 w-12 rounded-[2px] border-2 border-border bg-input text-center font-mono text-sm font-bold"
              aria-label="Current page"
            />
            <span className="text-xs text-muted-foreground">/ {numPages}</span>
          </div>
          <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= numPages} className="rounded-[3px] border-2 border-border bg-card px-5 py-2.5 font-mono text-sm font-bold shadow-pop-sm disabled:opacity-40" aria-label="Next page">→</button>
        </div>
      </div>

      {/* Immersive tap hint (mobile) */}
      {immersive ? (
        <button
          type="button"
          className="fixed inset-x-0 top-0 z-30 h-16 sm:hidden"
          aria-label="Show controls"
          onClick={() => setImmersive(false)}
        />
      ) : null}

      {/* Selection toolbar */}
      {selection ? (
        <SelectionToolbar
          text={selection.text}
          onHighlight={() => saveHighlight("yellow")}
          onNote={() => {
            const noteText = window.prompt("Note for this highlight:", "");
            saveHighlight("yellow", noteText ?? undefined);
          }}
          onCopy={async () => {
            await navigator.clipboard.writeText(selection.text).catch(() => undefined);
            setSelection(null);
            toast("Copied to clipboard", "success");
          }}
          onClose={() => setSelection(null)}
        />
      ) : null}
    </div>
  );
}

function ReaderTopIconButton({ label, onClick, active, disabled, children, className }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex rounded-[3px] border-2 p-2 transition-all disabled:opacity-40",
        active ? "border-border bg-primary text-primary-foreground shadow-pop-sm" : "border-transparent text-foreground hover:border-border hover:bg-card hover:shadow-pop-sm",
        className
      )}
    >
      {children}
    </button>
  );
}

function ReaderMenuTile({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} role="menuitem" className="flex flex-col items-center gap-1 rounded-[3px] border-2 border-border bg-card px-2 py-3 font-mono text-xs font-bold text-foreground shadow-pop-sm hover:bg-muted">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}

/** Shared TOC + bookmarks list for desktop sidebar and mobile slide-over. */
function ReaderTocPanel({ outline, bookmarks, goToPage }: { outline: TocItem[]; bookmarks: Bookmark[]; goToPage: (page: number) => void }) {
  return (
    <>
      {outline.length > 0 ? (
        <nav aria-label="Table of contents">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Table of contents</p>
          <ul className="space-y-0.5">
            {outline.map((item) => (
              <li key={item.title}>
                <button type="button" onClick={() => goToPage(item.pageIndex + 1)} className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted">
                  {item.title}
                </button>
                {item.children?.map((child) => (
                  <button key={`${child.title}-${child.pageIndex}`} type="button" onClick={() => goToPage(child.pageIndex + 1)} className="ml-4 w-full rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted">
                    {child.title}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">This PDF has no embedded table of contents.</p>
      )}
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bookmarks</p>
        {bookmarks.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">No bookmarks yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {[...bookmarks].sort((a, b) => a.pageNumber - b.pageNumber).map((bm) => (
              <li key={bm.id}>
                <button type="button" onClick={() => goToPage(bm.pageNumber)} className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted">
                  {bm.title} <span className="text-xs text-muted-foreground">p.{bm.pageNumber}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function SelectionToolbar({ text, onHighlight, onNote, onCopy, onClose }: { text: string; onHighlight: () => void; onNote: () => void; onCopy: () => void; onClose: () => void }) {
  const truncated = text.length > 60 ? `${text.slice(0, 60)}…` : text;
  return (
    <div role="toolbar" aria-label="Selection actions" className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-[3px] border-2 border-border bg-card p-2 shadow-pop sm:bottom-20">
      <p className="mb-2 max-w-xs truncate px-1 text-xs text-muted-foreground">“{truncated}”</p>
      <div className="flex gap-1">
        <button type="button" onClick={onHighlight} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Highlight</button>
        <button type="button" onClick={onNote} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Add note</button>
        <button type="button" onClick={onCopy} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Copy</button>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
