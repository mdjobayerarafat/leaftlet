export interface BooksQuery {
  q?: string;
  categoryId?: string;
  authorId?: string;
  language?: string;
  featured?: boolean;
  sort?: "newest" | "oldest" | "title";
  limit?: number;
  offset?: number;
  /** Admins may include drafts in listings. */
  includeDrafts?: boolean;
}
