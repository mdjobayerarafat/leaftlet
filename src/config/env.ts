const fromEnv = (value: string | undefined, fallback: string): string => {
  if (typeof value === "string" && value.length > 0) return value;
  return fallback;
};

export const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";

/**
 * Canonical list of Appwrite collections used by the platform.
 * IDs resolve from env (e.g. APPWRITE_BOOKS_COLLECTION_ID) with a
 * conventional fallback so a fresh setup works out of the box.
 */
export const COLLECTIONS = {
  books: fromEnv(process.env.APPWRITE_BOOKS_COLLECTION_ID, "books"),
  authors: fromEnv(process.env.APPWRITE_AUTHORS_COLLECTION_ID, "authors"),
  categories: fromEnv(process.env.APPWRITE_CATEGORIES_COLLECTION_ID, "categories"),
  readingProgress: fromEnv(process.env.APPWRITE_READING_PROGRESS_COLLECTION_ID, "reading_progress"),
  bookmarks: fromEnv(process.env.APPWRITE_BOOKMARKS_COLLECTION_ID, "bookmarks"),
  notes: fromEnv(process.env.APPWRITE_NOTES_COLLECTION_ID, "notes"),
  highlights: fromEnv(process.env.APPWRITE_HIGHLIGHTS_COLLECTION_ID, "highlights"),
  userLibrary: fromEnv(process.env.APPWRITE_USER_LIBRARY_COLLECTION_ID, "user_library"),
  readingHistory: fromEnv(process.env.APPWRITE_READING_HISTORY_COLLECTION_ID, "reading_history"),
  reviews: fromEnv(process.env.APPWRITE_REVIEWS_COLLECTION_ID, "reviews"),
} as const;

/** Storage buckets. */
export const BUCKETS = {
  bookPdfs: fromEnv(process.env.APPWRITE_BOOK_PDFS_BUCKET_ID, "book-pdfs"),
  bookCovers: fromEnv(process.env.APPWRITE_BOOK_COVERS_BUCKET_ID, "book-covers"),
  authorImages: fromEnv(process.env.APPWRITE_AUTHOR_IMAGES_BUCKET_ID, "author-images"),
  categoryImages: fromEnv(process.env.APPWRITE_CATEGORY_IMAGES_BUCKET_ID, "category-images"),
  userAvatars: fromEnv(process.env.APPWRITE_USER_AVATARS_BUCKET_ID, "user-avatars"),
} as const;

export const SITE_NAME = "Leaflet";
export const SITE_TAGLINE = "Your digital library, anywhere.";
