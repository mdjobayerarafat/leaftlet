"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as reading from "@/lib/reading/service";
import { getErrorMessage } from "@/lib/utils";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export async function saveProgressAction(input: {
  bookId: string;
  currentPage: number;
  totalPages: number;
}): Promise<ActionState> {
  try {
    const user = await requireUser();
    if (!Number.isFinite(input.currentPage) || input.currentPage < 1) return { error: "Invalid page." };
    if (!Number.isFinite(input.totalPages) || input.totalPages < 1) return { error: "Invalid page count." };
    await reading.upsertProgress({
      userId: user.id,
      bookId: input.bookId,
      currentPage: Math.floor(input.currentPage),
      totalPages: Math.floor(input.totalPages),
    });
    await reading.recordHistory(user.id, input.bookId, Math.floor(input.currentPage));
    return { ok: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function toggleBookmarkAction(input: {
  bookId: string;
  pageNumber: number;
  bookmarkId?: string;
}): Promise<ActionState & { bookmarkId?: string }> {
  try {
    const user = await requireUser();
    if (input.bookmarkId) {
      await reading.removeBookmark(user.id, input.bookmarkId);
      return { ok: true };
    }
    const created = await reading.addBookmark(user.id, input.bookId, input.pageNumber, `Page ${input.pageNumber}`);
    return { ok: true, bookmarkId: created.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function createNoteAction(input: { bookId: string; pageNumber: number; content: string }): Promise<ActionState & { id?: string }> {
  try {
    const user = await requireUser();
    const content = input.content.trim();
    if (!content) return { error: "Note cannot be empty." };
    if (content.length > 5000) return { error: "Note is too long (max 5000 chars)." };
    const note = await reading.createNote(user.id, input.bookId, input.pageNumber, content);
    return { ok: true, id: note.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateNoteAction(input: { noteId: string; content: string }): Promise<ActionState> {
  try {
    const user = await requireUser();
    const content = input.content.trim();
    if (!content) return { error: "Note cannot be empty." };
    await reading.updateNote(user.id, input.noteId, content);
    return { ok: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteNoteAction(input: { noteId: string }): Promise<ActionState> {
  try {
    const user = await requireUser();
    await reading.deleteNote(user.id, input.noteId);
    return { ok: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function toggleLibraryAction(input: { bookId: string; remove?: boolean }): Promise<ActionState> {
  try {
    const user = await requireUser();
    if (input.remove) {
      await reading.removeFromLibrary(user.id, input.bookId);
    } else {
      await reading.addToLibrary(user.id, input.bookId);
    }
    revalidatePath("/library");
    return { ok: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function removeHistoryAction(input: { entryId: string }): Promise<ActionState> {
  try {
    const user = await requireUser();
    await reading.removeHistory(user.id, input.entryId);
    revalidatePath("/history");
    return { ok: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
