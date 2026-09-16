# Modern Ebook Reading Platform — Next.js + Appwrite

Build a production-quality modern ebook reading website where users can browse books, open a book, and read its PDF through a beautiful, responsive ebook-reading interface.

The application must use:

* Next.js
* TypeScript
* Appwrite as the backend
* Appwrite Authentication
* Appwrite Database
* Appwrite Storage for PDF files and book covers
* Tailwind CSS
* Modern component-based architecture
* Responsive design for desktop, tablet, and mobile
* Clean, maintainable, scalable code

Do not build this as a simple PDF upload/viewer. The goal is to create a **modern digital library and ebook reading experience** similar in spirit to modern ebook platforms.

---

# 1. PRODUCT CONCEPT

The website is an online digital library.

Users should be able to:

1. Create an account / log in.
2. Browse available books.
3. Search books.
4. Filter books by category, author, language, etc.
5. Open a book.
6. Read the book using a modern ebook reader.
7. Continue reading from where they stopped.
8. Bookmark pages.
9. Highlight text where technically possible.
10. Add notes.
11. Change reading settings.
12. Change theme.
13. Change font size.
14. Track reading progress.
15. View their reading history.
16. Maintain a personal library.
17. View recently opened books.
18. Resume unfinished books.
19. View completed books.
20. Rate/review books if enabled.
21. See book metadata and description before reading.

Administrators should be able to:

1. Add books.
2. Upload PDF files.
3. Upload book covers.
4. Edit book information.
5. Delete books.
6. Organize books into categories.
7. Manage authors.
8. View users.
9. Manage categories.
10. View reading statistics.
11. View book statistics.
12. Manage featured books.
13. Control whether a book is publicly available.

---

# 2. IMPORTANT ARCHITECTURE PRINCIPLE

Separate the application into these major systems:

```text
Authentication
        ↓
User Library
        ↓
Book Catalog
        ↓
Book Details
        ↓
Ebook Reader
        ↓
Reading Progress
        ↓
Bookmarks / Highlights / Notes
        ↓
Reading Analytics
```

The reader should be treated as its own major application module rather than just placing a PDF iframe on a page.

---

# 3. DESIGN DIRECTION

Create a premium modern reading interface.

Design inspiration:

* Kindle
* Apple Books
* Google Play Books
* Kobo
* modern academic reading platforms

Do NOT copy any specific company's UI.

The visual language should be:

* Minimal
* Elegant
* Content-focused
* Spacious
* Professional
* Comfortable for long reading sessions
* Fast
* Accessible

Avoid excessive gradients, excessive animations, glassmorphism everywhere, or unnecessary UI elements.

The book content should remain the primary focus.

---

# 4. COLOR SYSTEM

Support both:

### Light mode

Warm/off-white reading background.

### Dark mode

Comfortable dark reading environment.

### Sepia mode

Warm paper-like background designed for long reading.

The reader should allow the user to switch between:

```text
Light
Sepia
Dark
```

Save the user's preferred reading theme.

---

# 5. MAIN WEBSITE STRUCTURE

Create the following routes.

```text
/
├── /books
├── /books/[slug]
├── /read/[bookId]
├── /search
├── /categories
├── /categories/[slug]
├── /authors
├── /authors/[slug]
├── /library
├── /history
├── /bookmarks
├── /notes
├── /profile
├── /settings
│
├── /login
├── /register
├── /forgot-password
│
└── /admin
    ├── /admin
    ├── /admin/books
    ├── /admin/books/new
    ├── /admin/books/[id]
    ├── /admin/categories
    ├── /admin/authors
    ├── /admin/users
    ├── /admin/statistics
    └── /admin/settings
```

Use Next.js App Router.

---

# 6. HOME PAGE

Create a modern digital library homepage.

Sections:

### Hero

Large headline such as:

"Your Digital Library, Anywhere."

Subtitle explaining that users can discover and read books online.

Include:

* Search box
* Browse books button
* Continue reading section for authenticated users

### Featured Books

Large horizontal book cards.

### Popular Books

Grid/list of books.

### Recently Added

Latest books.

### Categories

Beautiful category cards.

Example:

```text
Programming
Computer Science
Mathematics
Physics
Literature
History
Business
Self Development
Engineering
Science
```

### Continue Reading

For logged-in users:

```text
Book Cover
Book Title
Author
Progress: 67%
Continue Reading →
```

---

# 7. BOOK CARD

Create a reusable BookCard component.

Display:

* Cover
* Title
* Author
* Category
* Rating if available
* Reading progress if user has started it

Hover interaction:

* Slight elevation
* Show "Read Now"
* Show "View Details"

Do not over-animate.

---

# 8. BOOK DETAILS PAGE

Route:

```text
/books/[slug]
```

Display:

* Large book cover
* Title
* Author
* Description
* Category
* Language
* Publication year
* Number of pages
* Reading time if available
* Rating
* Number of readers
* Book tags

Actions:

```text
Read Now
Add to Library
Bookmark
Share
```

For users who have already started:

```text
Continue Reading — 47%
```

---

# 9. PDF STORAGE

PDF files must be stored in:

```text
Appwrite Storage
```

Do not store PDF binary data inside Appwrite Database.

Database should only store metadata and the Appwrite file ID.

Example:

```text
pdfFileId
coverFileId
```

Use Appwrite Storage permissions carefully.

Books may be public or restricted depending on the application's access rules.

Do not expose secret Appwrite API keys in client-side code.

---

# 10. MODERN EBOOK READER

This is the most important part of the application.

Route:

```text
/read/[bookId]
```

Build a dedicated reading interface.

Desktop layout:

```text
┌─────────────────────────────────────────────────────┐
│ Book Title       ← Back     Progress     ⚙ Settings │
├───────────┬─────────────────────────────┬───────────┤
│           │                             │           │
│ Chapters  │       BOOK CONTENT          │ Tools     │
│           │                             │           │
│ TOC       │       PDF PAGE              │ Bookmark  │
│           │                             │ Notes     │
│           │                             │ Search    │
└───────────┴─────────────────────────────┴───────────┘
```

On mobile, use a much simpler interface.

---

# 11. READER TOP BAR

Include:

* Back button
* Book title
* Current page
* Total pages
* Reading progress
* Search
* Bookmark
* Settings
* Fullscreen

Example:

```text
←  Clean Code

Page 127 / 464                         🔖  🔍  ⚙
██████████████████░░░░░░░░░░░ 27%
```

The top bar should disappear when the user enters immersive reading mode and reappear when they move/click near the top.

---

# 12. IMMERSIVE READING MODE

Provide an optional distraction-free mode.

When activated:

* Hide website navigation
* Hide unnecessary UI
* Center the book
* Keep only minimal reader controls
* Allow fullscreen

Keyboard shortcut:

```text
F
```

should toggle fullscreen/immersive mode where appropriate.

---

# 13. PDF RENDERING

Use a reliable PDF rendering solution rather than an iframe if practical.

Prefer a PDF rendering architecture based on:

```text
PDF.js
```

or a mature React PDF library built on PDF.js.

The reader must support:

* Page rendering
* Page navigation
* Zoom
* Fit width
* Fit page
* Page count
* Loading states
* Error states
* Large PDFs
* Lazy rendering where possible

Do not render hundreds of pages into the DOM at once.

Use virtualization or lazy rendering when appropriate.

---

# 14. PAGE NAVIGATION

Provide:

### Previous page

```text
←
```

### Next page

```text
→
```

### Page number input

Example:

```text
Page [127] / 464
```

Users should be able to directly enter a page number.

Keyboard controls:

```text
ArrowLeft  → Previous page
ArrowRight → Next page
Space      → Next page
Home       → First page
End        → Last page
```

Avoid interfering with typing inside inputs.

---

# 15. READING PROGRESS

Track:

```text
currentPage
totalPages
progressPercentage
lastReadAt
startedAt
completedAt
```

Calculate:

```text
progress = currentPage / totalPages * 100
```

Save reading progress to Appwrite.

Do not send a database write request for every scroll/page animation.

Use debouncing/throttling.

Example:

```text
User changes page
       ↓
Update local state immediately
       ↓
Wait 1–3 seconds
       ↓
Persist progress to Appwrite
```

Also save when the user:

* leaves the reader
* closes the tab where possible
* changes page after a debounce period

---

# 16. CONTINUE READING

When opening a book:

If the user has existing reading progress:

```text
Continue from page 127?
```

Provide:

```text
Continue Reading
Start From Beginning
```

---

# 17. TABLE OF CONTENTS

If the PDF contains usable bookmarks/outline information, extract/use it where possible.

Display:

```text
Table of Contents

1. Introduction
2. Getting Started
3. Fundamentals
4. Advanced Concepts
5. Conclusion
```

Clicking a chapter should navigate to the appropriate page.

If the PDF does not contain an outline, gracefully hide the chapter navigation or provide a metadata-based TOC when available.

Do not pretend that arbitrary PDFs have chapter information if it cannot be determined reliably.

---

# 18. THUMBNAIL SIDEBAR

Add optional page thumbnails.

Example:

```text
┌─────┐
│ 125 │
│     │
└─────┘

┌─────┐
│ 126 │
│     │
└─────┘

┌─────┐
│ 127 │ ← Current
│     │
└─────┘
```

Allow users to toggle the thumbnail panel.

---

# 19. ZOOM

Support:

```text
Zoom -
100%
Zoom +
Fit Width
Fit Page
```

Use sensible limits.

Example:

```text
50% → 200%
```

Remember the user's zoom preference where appropriate.

---

# 20. READER SETTINGS

Create a settings panel.

Options:

### Theme

```text
Light
Sepia
Dark
```

### Zoom

```text
50%
75%
100%
125%
150%
200%
```

### Page Layout

```text
Single Page
Two Page
Continuous
```

Only enable layouts that are technically compatible with the PDF renderer.

### Reading Controls

```text
Show page number
Show progress
Show thumbnails
```

---

# 21. TWO-PAGE MODE

On large desktop screens, provide optional two-page viewing.

Example:

```text
┌──────────────┬──────────────┐
│              │              │
│   Page 126   │   Page 127   │
│              │              │
└──────────────┴──────────────┘
```

On mobile:

Always default to single-page mode.

---

# 22. BOOKMARK SYSTEM

Users should be able to bookmark a page.

Database record:

```text
userId
bookId
pageNumber
title
createdAt
```

Reader button:

```text
🔖 Bookmark
```

If current page is bookmarked:

```text
🔖 Bookmarked
```

Create a bookmarks page:

```text
My Bookmarks

Book
Page
Date
Open
Delete
```

Clicking a bookmark should open the book at that page.

---

# 23. NOTES

Allow users to create notes associated with a book/page.

Example:

```text
Book: Clean Code
Page: 127

Note:
"Important concept about naming functions."
```

Database:

```text
userId
bookId
pageNumber
content
createdAt
updatedAt
```

Users should be able to:

* Create
* Edit
* Delete
* View notes

---

# 24. TEXT HIGHLIGHTING

If the chosen PDF rendering architecture allows reliable text-layer selection, support text highlighting.

When the user selects text:

Show a small floating toolbar:

```text
Highlight
Add Note
Copy
```

Store:

```text
userId
bookId
pageNumber
selectedText
positionData
color
note
createdAt
```

Important:

Do not assume text selection works for scanned/image-only PDFs.

If text selection is unavailable, gracefully disable highlighting for that document.

---

# 25. SEARCH INSIDE BOOK

Implement a reader search feature.

Example:

```text
Search in this book...

"database indexing"
```

Display:

```text
12 results

Page 45
"...database indexing improves..."

Page 87
"...indexing strategies..."
```

Clicking a result navigates to the corresponding page.

For PDFs, use the PDF text layer where possible.

For large books, avoid processing the entire document repeatedly on every search.

Cache extracted/searchable text appropriately.

---

# 26. LIBRARY

Route:

```text
/library
```

Sections:

```text
Continue Reading
My Books
Bookmarks
Recently Added
Completed
```

Book progress:

```text
67%
```

Example:

```text
Clean Code
Robert C. Martin

██████████████░░░░ 67%

Continue →
```

---

# 27. READING HISTORY

Route:

```text
/history
```

Show:

```text
Recently Read

Book
Last opened
Current page
Progress
```

Allow users to remove items from history if desired.

---

# 28. USER PROFILE

Profile should include:

* Name
* Avatar
* Email
* Books read
* Books currently reading
* Completed books
* Reading activity

Example:

```text
Reading Statistics

Books Started       24
Books Completed     12
Currently Reading    5
Pages Read        3,842
```

---

# 29. APPWRITE DATABASE DESIGN

Create the following collections.

## books

```text
$id
title
slug
description
authorId
categoryId
language
publicationYear
isbn
publisher
pageCount
pdfFileId
coverFileId
status
isFeatured
createdAt
updatedAt
```

Status:

```text
draft
published
archived
```

---

## authors

```text
$id
name
slug
bio
photoFileId
createdAt
updatedAt
```

---

## categories

```text
$id
name
slug
description
coverFileId
createdAt
updatedAt
```

---

## reading_progress

```text
$id
userId
bookId
currentPage
totalPages
progressPercentage
startedAt
lastReadAt
completedAt
```

Create a unique logical relationship:

```text
userId + bookId
```

so one user has one progress record per book.

---

## bookmarks

```text
$id
userId
bookId
pageNumber
title
createdAt
```

---

## notes

```text
$id
userId
bookId
pageNumber
content
createdAt
updatedAt
```

---

## highlights

```text
$id
userId
bookId
pageNumber
selectedText
positionData
color
note
createdAt
```

---

## user_library

```text
$id
userId
bookId
addedAt
```

---

## reading_history

```text
$id
userId
bookId
lastPage
lastReadAt
```

---

## reviews

If reviews are enabled:

```text
$id
userId
bookId
rating
review
createdAt
updatedAt
```

---

# 30. APPWRITE STORAGE

Create storage buckets for:

```text
book-pdfs
book-covers
author-images
category-images
user-avatars
```

Use appropriate file permissions.

PDF files should not be publicly writable.

Only authorized users/admins should be able to upload or modify books.

---

# 31. AUTHENTICATION

Use Appwrite Authentication.

Support:

```text
Email/password registration
Login
Logout
Password recovery
Session persistence
```

Optionally prepare architecture for:

```text
Google OAuth
GitHub OAuth
```

Do not hard-code secrets.

Use environment variables.

---

# 32. ADMIN PANEL

Create a professional admin dashboard.

Dashboard:

```text
Total Books
Total Users
Books Read
Active Readers
Reading Sessions
```

Charts:

```text
Books Added
Reading Activity
Popular Books
New Users
```

---

# 33. ADMIN BOOK MANAGEMENT

Admin page:

```text
Books
```

Features:

```text
Search
Filter
Sort
Create
Edit
Delete
Publish
Archive
Feature
```

Book creation form:

```text
Title
Slug
Description
Author
Category
Language
ISBN
Publisher
Publication Year
PDF Upload
Cover Upload
Page Count
Status
Featured
```

Show upload progress.

Validate file types.

PDF uploads must accept:

```text
application/pdf
```

Do not trust the client-side file extension alone.

---

# 34. PDF UPLOAD FLOW

Implement:

```text
Admin selects PDF
        ↓
Validate file
        ↓
Upload to Appwrite Storage
        ↓
Receive file ID
        ↓
Store file ID in books collection
        ↓
Upload cover
        ↓
Store cover file ID
        ↓
Create book record
        ↓
Publish
```

Handle failures properly.

If PDF upload succeeds but database creation fails, provide a recoverable error state and avoid silently leaving orphaned files where possible.

---

# 35. SECURITY

Important:

Never expose:

```text
APPWRITE API KEY
```

to the browser.

Server-only secrets must remain on the server.

Use:

```text
NEXT_PUBLIC_APPWRITE_ENDPOINT
NEXT_PUBLIC_APPWRITE_PROJECT_ID
```

only for values that are safe to expose publicly.

Use server-side Appwrite clients for privileged operations.

Implement authorization checks for admin routes.

Never rely only on hiding an admin button in the frontend.

---

# 36. ADMIN AUTHORIZATION

Create a secure role system.

Example user profile:

```text
role:
"user"
```

or

```text
role:
"admin"
```

Admin API operations must verify the authenticated user and role server-side.

---

# 37. NEXT.JS ARCHITECTURE

Use a clean App Router structure.

Suggested structure:

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── books/
│   │   ├── categories/
│   │   └── authors/
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── (reader)/
│   │   └── read/
│   │
│   ├── (user)/
│   │   ├── library/
│   │   ├── history/
│   │   ├── bookmarks/
│   │   ├── notes/
│   │   └── profile/
│   │
│   ├── admin/
│   │   ├── books/
│   │   ├── categories/
│   │   ├── authors/
│   │   ├── users/
│   │   └── statistics/
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   ├── books/
│   ├── reader/
│   ├── library/
│   └── admin/
│
├── lib/
│   ├── appwrite/
│   ├── auth/
│   ├── books/
│   ├── reader/
│   └── utils/
│
├── hooks/
│
├── types/
│
└── config/
```

---

# 38. READER COMPONENT ARCHITECTURE

Create independent components.

Example:

```text
EbookReader
├── ReaderHeader
├── ReaderToolbar
├── ReaderSidebar
├── TableOfContents
├── PageThumbnails
├── PdfViewer
├── PageNavigation
├── ReaderSearch
├── BookmarkButton
├── NotesPanel
├── ReaderSettings
├── ProgressIndicator
└── FullscreenController
```

Avoid putting the entire reader into one giant component.

---

# 39. PERFORMANCE

Performance is extremely important.

Optimize for large PDFs.

Requirements:

* Lazy-load PDF pages
* Avoid rendering all pages simultaneously
* Use virtualization where appropriate
* Memoize expensive components
* Debounce search
* Debounce progress updates
* Cache book metadata
* Optimize cover images
* Avoid unnecessary Appwrite requests
* Use server components where appropriate
* Use client components only when interactivity requires them

The reader should remain responsive even with large books.

---

# 40. MOBILE EXPERIENCE

The mobile reader must be designed separately rather than simply shrinking the desktop layout.

Mobile reader:

```text
┌──────────────────────┐
│ ← Book       ⋮       │
├──────────────────────┤
│                      │
│                      │
│      PDF PAGE        │
│                      │
│                      │
├──────────────────────┤
│ Page 127 / 464       │
│ ███████████░░░░      │
├──────────────────────┤
│ ←        ◉        →  │
└──────────────────────┘
```

Use touch-friendly controls.

Support:

* Swipe navigation where compatible
* Tap to show/hide controls
* Pinch zoom if supported by the rendering implementation
* Mobile fullscreen
* Bottom-sheet settings

---

# 41. ACCESSIBILITY

Implement:

* Keyboard navigation
* Proper buttons
* ARIA labels where needed
* Focus states
* Good color contrast
* Screen-reader-friendly controls
* Reduced motion support
* Accessible dialogs
* Accessible dropdowns

Do not make important functionality dependent solely on hover.

---

# 42. ERROR STATES

Create polished states for:

```text
Book not found
PDF failed to load
Permission denied
Book unavailable
Network error
Authentication required
File upload failed
Invalid PDF
```

Do not show raw stack traces to users.

---

# 43. LOADING STATES

Use skeletons for:

* Book cards
* Book details
* Library
* Admin tables

For the PDF reader show:

```text
Loading book...

Preparing your reading experience
```

If individual pages take time, show page-level loading indicators.

---

# 44. EMPTY STATES

Examples:

Library:

```text
Your library is empty.

Start discovering books and build your personal collection.

Browse Books →
```

Bookmarks:

```text
No bookmarks yet.

Bookmark important pages while reading.
```

Notes:

```text
No notes yet.
```

---

# 45. SEARCH

Global search should search:

```text
Book title
Author
Category
Description
ISBN
Tags
```

Search page:

```text
Search results for "Rust"

Books
Authors
Categories
```

Add filters:

```text
Category
Author
Language
Publication Year
```

---

# 46. SEO

Implement proper metadata.

Each book page should have:

```text
title
description
Open Graph metadata
Twitter/X metadata
canonical URL
```

Use the book cover for social previews where appropriate.

Generate dynamic metadata for:

```text
/books/[slug]
/authors/[slug]
/categories/[slug]
```

---

# 47. URL DESIGN

Use clean URLs.

Example:

```text
/books/clean-code
/books/the-rust-programming-language
/authors/robert-c-martin
/categories/programming
/read/BOOK_ID
```

---

# 48. DATA ACCESS LAYER

Do not scatter Appwrite queries throughout React components.

Create a proper data layer.

Example:

```text
lib/appwrite/client.ts
lib/appwrite/server.ts

lib/books/book.service.ts
lib/books/book.repository.ts

lib/reader/progress.service.ts
lib/reader/bookmark.service.ts
lib/reader/note.service.ts
```

Components should call services rather than directly containing complicated database logic.

---

# 49. TYPESCRIPT

Use strong types.

Example:

```ts
type Book = {
  id: string;
  title: string;
  slug: string;
  description: string;
  authorId: string;
  categoryId: string;
  pdfFileId: string;
  coverFileId: string;
  pageCount: number;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Avoid:

```ts
any
```

unless absolutely necessary.

---

# 50. ENVIRONMENT VARIABLES

Create:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_DATABASE_ID=

APPWRITE_API_KEY=

APPWRITE_BOOKS_COLLECTION_ID=
APPWRITE_AUTHORS_COLLECTION_ID=
APPWRITE_CATEGORIES_COLLECTION_ID=
APPWRITE_READING_PROGRESS_COLLECTION_ID=
APPWRITE_BOOKMARKS_COLLECTION_ID=
APPWRITE_NOTES_COLLECTION_ID=
APPWRITE_HIGHLIGHTS_COLLECTION_ID=
APPWRITE_USER_LIBRARY_COLLECTION_ID=
APPWRITE_READING_HISTORY_COLLECTION_ID=
APPWRITE_REVIEWS_COLLECTION_ID=

APPWRITE_BOOK_PDFS_BUCKET_ID=
APPWRITE_BOOK_COVERS_BUCKET_ID=
APPWRITE_AUTHOR_IMAGES_BUCKET_ID=
APPWRITE_CATEGORY_IMAGES_BUCKET_ID=
APPWRITE_USER_AVATARS_BUCKET_ID=
```

Never commit `.env.local`.

Create `.env.example`.

---

# 51. APPWRITE PERMISSIONS

Design permissions carefully.

Users should only be able to modify their own:

```text
reading_progress
bookmarks
notes
highlights
user_library
reading_history
reviews
```

Admins can manage:

```text
books
authors
categories
```

Public users can read published book metadata.

Storage permissions must follow the same security model.

---

# 52. READING ANALYTICS

Track useful reading statistics without collecting unnecessary personal data.

Possible metrics:

```text
Book opens
Pages viewed
Reading sessions
Completion rate
Average reading progress
```

Admin dashboard can show:

```text
Most read books
Most active books
Completion rates
Recently added books
```

Avoid sending a database request for every page view.

Aggregate events where practical.

---

# 53. BOOK COMPLETION

When:

```text
progress >= 95%
```

do not automatically mark completed unless this behavior is explicitly chosen.

Prefer marking completed when the user reaches the final page or allow a configurable completion threshold.

Store:

```text
completedAt
```

---

# 54. READER URL STATE

Allow deep linking to a page.

Example:

```text
/read/BOOK_ID?page=127
```

Opening this URL should load page 127.

This is useful for:

* bookmarks
* notes
* sharing
* browser history

---

# 55. BROWSER HISTORY

The reader should integrate naturally with browser history where practical.

Avoid navigation behavior that causes every page turn to create a browser history entry.

Page state can use URL replacement rather than pushing a new browser history entry.

---

# 56. PRINT / DOWNLOAD

Do not automatically expose a download button.

The availability of:

```text
Download PDF
Print
```

must be controlled by book/admin settings.

Add book field:

```text
allowDownload
```

If downloads are disabled, do not show the download UI.

Important: client-side restrictions cannot guarantee that a determined user cannot obtain content delivered to their browser. Treat access controls and storage permissions as the primary security boundary.

---

# 57. RESPONSIVE BREAKPOINTS

Support:

```text
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

Test at:

```text
375px
768px
1024px
1280px
1440px
1920px
```

---

# 58. UI COMPONENTS

Create reusable components:

```text
Button
Input
SearchInput
Modal
Dialog
Dropdown
Tabs
Tooltip
Toast
ProgressBar
Skeleton
BookCard
BookGrid
BookCover
AuthorCard
CategoryCard
Pagination
DataTable
Sidebar
Navbar
```

Do not duplicate UI logic.

---

# 59. NOTIFICATIONS

Use toast notifications for:

```text
Bookmark added
Bookmark removed
Note saved
Book added to library
Book removed from library
Settings saved
Progress saved
Upload successful
Upload failed
```

---

# 60. DEVELOPMENT PHASES

Build the project incrementally.

## Phase 1 — Foundation

Implement:

* Next.js
* TypeScript
* Tailwind
* Appwrite connection
* Authentication
* Base layout
* Theme system

Do not build everything at once.

---

## Phase 2 — Book Library

Implement:

* Books collection
* Categories
* Authors
* Book cards
* Search
* Book details
* Admin book CRUD
* PDF upload
* Cover upload

---

## Phase 3 — Ebook Reader

Implement:

* PDF.js
* PDF rendering
* Page navigation
* Zoom
* Fullscreen
* Responsive reader
* Loading/error states

---

## Phase 4 — Reading System

Implement:

* Reading progress
* Continue reading
* History
* Library
* Bookmarks
* Notes

---

## Phase 5 — Advanced Reader

Implement:

* Table of contents
* Thumbnail navigation
* Search inside PDF
* Highlights
* Two-page mode
* Reader settings
* Sepia mode
* Keyboard shortcuts

---

## Phase 6 — Admin Dashboard

Implement:

* Statistics
* User management
* Book management
* Category management
* Author management
* Featured books

---

## Phase 7 — Optimization

Perform:

* Performance optimization
* Security review
* Accessibility review
* Mobile testing
* Error handling
* Loading-state improvements
* SEO
* Database query optimization

---

# 61. IMPORTANT AI CODING ASSISTANT RULES

When implementing this project:

1. Do not generate the entire application in one huge file.
2. Do not put all Appwrite logic inside page components.
3. Do not use `any` unnecessarily.
4. Do not expose Appwrite API keys.
5. Do not use fake/mock data once Appwrite integration begins.
6. Do not replace working functionality without a reason.
7. Before modifying an existing file, understand its current structure.
8. Reuse existing components where possible.
9. Keep components small and focused.
10. Use server-side code for privileged Appwrite operations.
11. Validate all user input.
12. Handle Appwrite errors gracefully.
13. Handle PDF loading errors gracefully.
14. Make the reader responsive.
15. Optimize large PDF performance.
16. Do not render all PDF pages simultaneously.
17. Use proper loading and error states.
18. Use optimistic UI only when rollback/error handling is implemented.
19. Avoid unnecessary database writes.
20. Use debouncing for reading-progress persistence.
21. Keep secrets in environment variables.
22. Create `.env.example`.
23. Keep the application accessible.
24. Test important functionality after implementation.
25. Do not delete existing functionality unless explicitly instructed.
26. When a dependency is required, explain why before adding it.
27. Prefer stable, maintained libraries.
28. Keep the code production-ready rather than creating a demo-only implementation.

---

# 62. IMPORTANT PDF READER REQUIREMENT

The PDF reader is the core feature.

Do NOT implement:

```html
<iframe src="book.pdf">
```

as the primary reading experience.

Instead build a proper reader abstraction around PDF.js or an appropriate maintained PDF rendering library.

The reader should make it possible to add future features without rewriting the entire system.

Future features may include:

```text
Text-to-speech
AI book assistant
AI summaries
Chapter summaries
Vocabulary lookup
Translation
Reading goals
Reading statistics
Offline reading
Annotations
Collaborative notes
```

Design the reader architecture so these can be added later.

---

# 63. FUTURE AI FEATURES

Do not implement these initially unless explicitly requested, but keep the architecture extensible for:

### Ask the Book

Users could ask:

```text
"What does the author mean by this?"

"Summarize this chapter."

"Explain this concept."

"What are the key points on this page?"
```

The system could use the book's extracted text with an LLM.

### AI Chapter Summary

```text
Chapter 4 Summary
```

### AI Vocabulary

Selecting a word could show:

```text
Definition
Examples
Translation
```

These should be separate modules and should not make the core PDF reader dependent on an AI provider.

---

# 64. FINAL QUALITY REQUIREMENT

The finished website should feel like a real digital reading platform rather than an admin dashboard with a PDF viewer.

Prioritize:

```text
Reading experience
Performance
Simplicity
Accessibility
Security
Responsive design
Maintainability
```

The most important user journey is:

```text
Visit website
     ↓
Discover book
     ↓
Open book
     ↓
Read comfortably
     ↓
Leave
     ↓
Return later
     ↓
Automatically continue from previous page
```

This flow must feel extremely smooth.

---

# 65. IMPLEMENTATION INSTRUCTION

Start by inspecting the existing project structure.

Do NOT immediately create every page.

First:

1. Inspect the existing Next.js project.
2. Identify the Next.js version.
3. Identify the package manager.
4. Identify existing dependencies.
5. Identify existing Appwrite configuration.
6. Identify existing authentication implementation.
7. Identify existing UI components.
8. Identify existing environment variables.
9. Propose any required changes.
10. Then implement the project incrementally.

After each major phase:

```text
Run type checking
Run linting
Run build
Fix errors
```

Do not move to the next phase while the current phase contains known build/type errors.

When adding a dependency, use the project's existing package manager.

At the end, provide:

```text
Implemented features
Files created
Files modified
Dependencies added
Environment variables required
Appwrite collections required
Appwrite buckets required
Appwrite permissions required
Commands to run
Known limitations
Next recommended development phase
```

Build the application with production-quality code and a polished modern ebook reading experience.
