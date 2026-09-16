export type BookStatus = "draft" | "published" | "archived";
export type ReviewStatus = "pending" | "approved";
export type HighlightColor = "yellow" | "green" | "blue" | "pink";
export type ReaderTheme = "light" | "sepia" | "dark";
export type PageLayout = "single" | "double" | "continuous";
export type FitMode = "none" | "width" | "page";
export type SidebarTab = "toc" | "thumbnails" | "search" | "notes" | "settings";
export type UserRole = "user" | "admin";

/** Stored position data for a text highlight (percent-based so it scales with zoom). */
export type HighlightPosition = {
  /** Array of bounding boxes, normalized 0–1 relative to the rendered page. */
  rects: Array<{ x: number; y: number; width: number; height: number }>;
};

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string;
  photoFileId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverFileId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  description: string;
  authorId: string;
  categoryId: string;
  language: string;
  publicationYear: number;
  isbn: string;
  publisher: string;
  /** Total pages from metadata; the PDF's real count takes precedence in the reader. */
  pageCount: number;
  pdfFileId: string;
  coverFileId: string;
  tags: string[];
  status: BookStatus;
  isFeatured: boolean;
  allowDownload: boolean;
  /** Denormalized display fields maintained by the admin panel. */
  authorName: string;
  categoryName: string;
  ratingAvg: number;
  ratingCount: number;
  readerCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Joined view: book + its author/category names (same shape as Book). */
export type BookWithRelations = Book;

export interface ReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  startedAt: string;
  lastReadAt: string;
  completedAt: string | null;
}

export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  pageNumber: number;
  title: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  bookId: string;
  pageNumber: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Highlight {
  id: string;
  userId: string;
  bookId: string;
  pageNumber: number;
  selectedText: string;
  positionData: HighlightPosition | null;
  color: HighlightColor;
  note: string;
  createdAt: string;
}

export interface LibraryEntry {
  id: string;
  userId: string;
  bookId: string;
  addedAt: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  bookId: string;
  lastPage: number;
  lastReadAt: string;
}

export interface Review {
  id: string;
  userId: string;
  bookId: string;
  userName: string;
  rating: number;
  review: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

/** Author/category names joined onto a user item for display. */
export interface BookRef {
  id: string;
  title: string;
  slug: string;
  coverFileId: string;
  authorName: string;
  pageCount: number;
  allowDownload: boolean;
  status: BookStatus;
  pdfFileId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarFileId: string | null;
  role: UserRole;
}

/** Reader UI preferences persisted per user (and mirrored to localStorage). */
export interface ReaderPrefs {
  theme: ReaderTheme;
  zoom: number;
  fit: FitMode;
  layout: PageLayout;
  showThumbnails: boolean;
  showPageNumber: boolean;
  showProgressBar: boolean;
}

export const DEFAULT_READER_PREFS: ReaderPrefs = {
  theme: "light",
  zoom: 1,
  fit: "width",
  layout: "single",
  showThumbnails: false,
  showPageNumber: true,
  showProgressBar: true,
};

/** A single entry of a PDF outline (table of contents). */
export interface TocItem {
  title: string;
  pageIndex: number; // 0-based
  children?: TocItem[];
}
