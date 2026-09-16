import { redirect } from "next/navigation";
import { StickyNote } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getBookById } from "@/lib/books/service";
import { listNotes } from "@/lib/reading/service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui";
import { NoteRow } from "./note-row";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notes" };

export default async function NotesPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/login");

  const notes = await listNotes(user.id).catch(() => []);
  const books = await Promise.all(notes.map((n) => getBookById(n.bookId)));

  const rows = notes
    .map((note, i) => ({ note, book: books[i] }))
    .filter((row): row is { note: typeof notes[number]; book: NonNullable<typeof books[number]> } => row.book !== null);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader title="My notes" description="Everything you've written while reading." />
      {rows.length === 0 ? (
        <EmptyState
          icon={<StickyNote className="h-10 w-10" />}
          title="No notes yet"
          description="Open a book, pick a page, and capture your thoughts."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ note, book }) => (
            <NoteRow key={note.id} note={note} book={book} />
          ))}
        </ul>
      )}
    </div>
  );
}
