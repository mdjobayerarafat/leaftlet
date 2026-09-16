"use client";

import * as pdfjs from "pdfjs-dist";

/**
 * Renders the first page of a PDF (admin-only byte proxy URL) to a JPEG blob
 * suitable for a book cover. Returns null when the page cannot be rendered.
 */
export async function renderFirstPageCover(pdfUrl: string, width = 480): Promise<Blob | null> {
  const pdfjsGlobal = pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } };
  if (!pdfjsGlobal.GlobalWorkerOptions.workerSrc) {
    pdfjsGlobal.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  }

  let doc: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]> | null = null;
  try {
    doc = await pdfjs.getDocument({ url: pdfUrl, withCredentials: false }).promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = width / base.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) return null;
    // White base so transparent PDF backgrounds don't turn black in JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85));
    page.cleanup();
    return blob && blob.size > 0 ? blob : null;
  } catch {
    return null;
  } finally {
    await doc?.destroy().catch(() => undefined);
  }
}
