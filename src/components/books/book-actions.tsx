"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Plus, Share2 } from "lucide-react";
import { ButtonLink, Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/providers";
import { toggleLibraryAction } from "@/lib/reading/actions";
import { getErrorMessage } from "@/lib/utils";

export function BookActions({
  bookId,
  slug,
  title,
  authed,
  inLibrary,
  progress,
}: {
  bookId: string;
  slug: string;
  title: string;
  authed: boolean;
  inLibrary: boolean;
  progress: { currentPage: number; percentage: number; totalPages: number } | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(inLibrary);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const readHref = progress ? `/read/${bookId}?page=${progress.currentPage}` : `/read/${bookId}`;

  async function share() {
    const url = `${window.location.origin}/books/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // Fall through to clipboard.
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not share this book", "error");
    }
  }

  function toggleLibrary() {
    if (!authed) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      const res = await toggleLibraryAction({ bookId, remove: saved });
      if (res.ok) {
        setSaved(!saved);
        toast(saved ? "Removed from your library" : "Added to your library", "success");
      } else {
        toast(getErrorMessage(res.error), "error");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {progress ? (
        <ButtonLink href={readHref} size="lg">
          Continue reading — {progress.percentage}%
        </ButtonLink>
      ) : (
        <ButtonLink href={readHref} size="lg">
          <BookOpen className="h-4 w-4" aria-hidden /> Read now
        </ButtonLink>
      )}
      <Button variant="outline" size="lg" onClick={toggleLibrary} disabled={pending} aria-pressed={saved}>
        {saved ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        {saved ? "In library" : "Add to library"}
      </Button>
      <Button variant="ghost" size="lg" onClick={share} aria-label="Share this book">
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
        Share
      </Button>
    </div>
  );
}
