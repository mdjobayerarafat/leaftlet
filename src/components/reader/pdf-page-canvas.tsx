"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { Highlight } from "@/types";

interface Props {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  zoom: number;
  highlights: Highlight[];
  onTextSelect?: (info: { pageNumber: number; text: string; rects: Array<{ x: number; y: number; width: number; height: number }> } | null) => void;
}

/** Renders a single PDF page: canvas + optional text layer + highlight overlays. */
export function PdfPageCanvas({ doc, pageNumber, width, zoom, highlights, onTextSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [rendered, setRendered] = useState(false);
  const [pageError, setPageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      let page: PDFPageProxy | null = null;
      setRendered(false);
      setPageError(false);
      try {
        page = await doc.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = (width / page.getViewport({ scale: 1 }).width) * zoom;
        const viewport = page.getViewport({ scale: scale * dpr });
        const cssViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(cssViewport.width)}px`;
        canvas.style.height = `${Math.floor(cssViewport.height)}px`;

        renderTaskRef.current?.cancel();
        const task = page.render({ canvas, canvasContext: context, viewport });
        renderTaskRef.current = task;
        await task.promise;
        if (cancelled) return;

        // Build a simple absolutely-positioned text layer for selection.
        const textLayer = textLayerRef.current;
        if (textLayer) {
          textLayer.innerHTML = "";
          const textContent = await page.getTextContent();
          for (const item of textContent.items) {
            if (!("str" in item) || !item.str) continue;
            const tx = pdfjs.Util.transform(cssViewport.transform, item.transform);
            const span = document.createElement("span");
            span.textContent = item.str;
            span.style.left = `${tx[4]}px`;
            span.style.top = `${tx[5] - item.height * scale}px`;
            span.style.fontSize = `${item.height * scale}px`;
            span.style.fontFamily = "sans-serif";
            textLayer.appendChild(span);
          }
        }
        setRendered(true);
      } catch (error) {
        const name = (error as { name?: string }).name;
        if (name !== "RenderingCancelledException" && !cancelled) setPageError(true);
      } finally {
        page?.cleanup();
      }
    }

    render();
    return () => {
      cancelled = true;
      try {
        renderTaskRef.current?.cancel();
      } catch {
        // Task already finished.
      }
    };
  }, [doc, pageNumber, width, zoom]);

  function handleMouseUp() {
    if (!onTextSelect || !textLayerRef.current) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!text || !containerRef.current) {
      onTextSelect(null);
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const rects: Array<{ x: number; y: number; width: number; height: number }> = [];
    for (let i = 0; i < Math.min(selection!.rangeCount, 6); i++) {
      const range = selection!.getRangeAt(i);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      rects.push({
        x: (rect.left - containerRect.left) / containerRect.width,
        y: (rect.top - containerRect.top) / containerRect.height,
        width: rect.width / containerRect.width,
        height: rect.height / containerRect.height,
      });
    }
    onTextSelect(text.length > 0 ? { pageNumber, text, rects } : null);
  }

  const baseWidth = Math.floor(width * zoom);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto bg-white shadow-md ring-1 ring-black/5"
      style={{ width: baseWidth, minHeight: 200 }}
      onMouseUp={handleMouseUp}
      data-page-number={pageNumber}
    >
      <canvas ref={canvasRef} className="block" aria-label={`Page ${pageNumber}`} role="img" />
      <div ref={textLayerRef} className="pdfTextLayer absolute inset-0" style={{ width: baseWidth }} />

      {highlights.length > 0
        ? highlights.map((highlight) =>
            highlight.positionData?.rects.map((rect, i) => (
              <span
                key={`${highlight.id}-${i}`}
                className="highlight-rect"
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.width * 100}%`,
                  height: `${rect.height * 100}%`,
                  backgroundColor:
                    highlight.color === "yellow" ? "rgba(250,204,21,0.45)" : highlight.color === "green" ? "rgba(74,222,128,0.4)" : highlight.color === "blue" ? "rgba(96,165,250,0.4)" : "rgba(244,114,182,0.4)",
                }}
                title={highlight.note || highlight.selectedText}
              />
            ))
          )
        : null}

      {!rendered && !pageError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Rendering page" />
        </div>
      ) : null}
      {pageError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 p-4 text-center text-sm text-danger">
          This page could not be rendered.
        </div>
      ) : null}
    </div>
  );
}
