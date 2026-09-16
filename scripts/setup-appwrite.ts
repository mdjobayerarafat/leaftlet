/**
 * Provision the Appwrite project: database, collections + attributes + indexes,
 * and storage buckets. Idempotent — safe to run repeatedly; it also repairs
 * existing collections by creating any missing attributes/indexes.
 *
 * Usage:  npm run appwrite:setup
 * Requires .env.local with:
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID,
 *   NEXT_PUBLIC_APPWRITE_DATABASE_ID, APPWRITE_API_KEY
 */
import "../src/lib/appwrite/compat";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { Client, Databases, Storage, Permission, Role, IndexType } from "node-appwrite";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
const API_KEY = process.env.APPWRITE_API_KEY ?? "";
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "main";

if (!ENDPOINT || !PROJECT || !API_KEY) {
  console.error("Missing NEXT_PUBLIC_APPWRITE_ENDPOINT / NEXT_PUBLIC_APPWRITE_PROJECT_ID / APPWRITE_API_KEY in .env.local");
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);

type Attr =
  | { key: string; type: "string"; size: number; required: boolean; default?: string; array?: boolean }
  | { key: string; type: "integer"; required: boolean; default?: number; min?: number; max?: number }
  | { key: string; type: "double"; required: boolean; default?: number; min?: number; max?: number }
  | { key: string; type: "boolean"; required: boolean; default?: boolean }
  | { key: string; type: "datetime"; required: boolean; default?: string }
  | { key: string; type: "enum"; elements: string[]; required: boolean; default?: string };

interface CollectionSpec {
  id: string;
  name: string;
  documentSecurity: boolean;
  permissions: string[];
  attributes: Attr[];
  indexes: Array<{ key: string; type: IndexType; attributes: string[] }>;
}

const USER_OWNED = [
  Permission.create(Role.users()),
  Permission.read(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const SPECS: CollectionSpec[] = [
  {
    id: process.env.APPWRITE_BOOKS_COLLECTION_ID ?? "books",
    name: "Books",
    documentSecurity: false,
    permissions: [Permission.create(Role.label("admin")), Permission.update(Role.label("admin")), Permission.delete(Role.label("admin")), Permission.read(Role.any())],
    attributes: [
      { key: "title", type: "string", size: 256, required: true },
      { key: "slug", type: "string", size: 256, required: true },
      { key: "description", type: "string", size: 3000, required: false },
      { key: "authorId", type: "string", size: 64, required: false, default: "" },
      { key: "categoryId", type: "string", size: 64, required: false, default: "" },
      { key: "authorName", type: "string", size: 128, required: false, default: "" },
      { key: "categoryName", type: "string", size: 128, required: false, default: "" },
      { key: "language", type: "string", size: 32, required: false, default: "English" },
      { key: "publicationYear", type: "integer", required: false, default: 0 },
      { key: "isbn", type: "string", size: 32, required: false, default: "" },
      { key: "publisher", type: "string", size: 128, required: false, default: "" },
      { key: "pageCount", type: "integer", required: false, default: 0 },
      { key: "pdfFileId", type: "string", size: 64, required: true },
      { key: "coverFileId", type: "string", size: 64, required: false, default: "" },
      { key: "tags", type: "string", size: 32, required: false, array: true },
      { key: "status", type: "enum", elements: ["draft", "published", "archived"], required: true },
      { key: "isFeatured", type: "boolean", required: false, default: false },
      { key: "allowDownload", type: "boolean", required: false, default: false },
      { key: "ratingAvg", type: "double", required: false, default: 0 },
      { key: "ratingCount", type: "integer", required: false, default: 0 },
      { key: "readerCount", type: "integer", required: false, default: 0 },
      { key: "search_text", type: "string", size: 4000, required: false, default: "" },
      { key: "createdAt", type: "datetime", required: false },
      { key: "updatedAt", type: "datetime", required: false },
    ],
    indexes: [
      { key: "slug_idx", type: IndexType.Unique, attributes: ["slug"] },
      { key: "status_idx", type: IndexType.Key, attributes: ["status"] },
      { key: "category_idx", type: IndexType.Key, attributes: ["categoryId"] },
      { key: "author_idx", type: IndexType.Key, attributes: ["authorId"] },
      { key: "featured_idx", type: IndexType.Key, attributes: ["isFeatured"] },
      { key: "search_idx", type: IndexType.Fulltext, attributes: ["search_text"] },
    ],
  },
  {
    id: process.env.APPWRITE_AUTHORS_COLLECTION_ID ?? "authors",
    name: "Authors",
    documentSecurity: false,
    permissions: [Permission.create(Role.label("admin")), Permission.update(Role.label("admin")), Permission.delete(Role.label("admin")), Permission.read(Role.any())],
    attributes: [
      { key: "name", type: "string", size: 256, required: true },
      { key: "slug", type: "string", size: 256, required: true },
      { key: "bio", type: "string", size: 2000, required: false, default: "" },
      { key: "photoFileId", type: "string", size: 64, required: false, default: "" },
      { key: "createdAt", type: "datetime", required: false },
      { key: "updatedAt", type: "datetime", required: false },
    ],
    indexes: [{ key: "slug_idx", type: IndexType.Unique, attributes: ["slug"] }],
  },
  {
    id: process.env.APPWRITE_CATEGORIES_COLLECTION_ID ?? "categories",
    name: "Categories",
    documentSecurity: false,
    permissions: [Permission.create(Role.label("admin")), Permission.update(Role.label("admin")), Permission.delete(Role.label("admin")), Permission.read(Role.any())],
    attributes: [
      { key: "name", type: "string", size: 256, required: true },
      { key: "slug", type: "string", size: 256, required: true },
      { key: "description", type: "string", size: 1000, required: false, default: "" },
      { key: "coverFileId", type: "string", size: 64, required: false, default: "" },
      { key: "createdAt", type: "datetime", required: false },
      { key: "updatedAt", type: "datetime", required: false },
    ],
    indexes: [{ key: "slug_idx", type: IndexType.Unique, attributes: ["slug"] }],
  },
  {
    id: process.env.APPWRITE_READING_PROGRESS_COLLECTION_ID ?? "reading_progress",
    name: "Reading progress",
    documentSecurity: true,
    permissions: [...USER_OWNED, Permission.read(Role.label("admin"))],
    attributes: [
      { key: "userId", type: "string", size: 64, required: true },
      { key: "bookId", type: "string", size: 64, required: true },
      { key: "currentPage", type: "integer", required: true },
      { key: "totalPages", type: "integer", required: false, default: 0 },
      { key: "progressPercentage", type: "integer", required: false, default: 0 },
      { key: "startedAt", type: "datetime", required: false },
      { key: "lastReadAt", type: "datetime", required: false },
      { key: "completedAt", type: "datetime", required: false },
    ],
    indexes: [
      { key: "user_book_idx", type: IndexType.Unique, attributes: ["userId", "bookId"] },
      { key: "user_idx", type: IndexType.Key, attributes: ["userId"] },
    ],
  },
  {
    id: process.env.APPWRITE_BOOKMARKS_COLLECTION_ID ?? "bookmarks",
    name: "Bookmarks",
    documentSecurity: true,
    permissions: [...USER_OWNED, Permission.read(Role.label("admin"))],
    attributes: [
      { key: "userId", type: "string", size: 64, required: true },
      { key: "bookId", type: "string", size: 64, required: true },
      { key: "pageNumber", type: "integer", required: true },
      { key: "title", type: "string", size: 256, required: false, default: "" },
      { key: "createdAt", type: "datetime", required: false },
    ],
    indexes: [
      { key: "user_book_page_idx", type: IndexType.Unique, attributes: ["userId", "bookId", "pageNumber"] },
      { key: "user_idx", type: IndexType.Key, attributes: ["userId"] },
    ],
  },
  {
    id: process.env.APPWRITE_NOTES_COLLECTION_ID ?? "notes",
    name: "Notes",
    documentSecurity: true,
    permissions: [...USER_OWNED, Permission.read(Role.label("admin"))],
    attributes: [
      { key: "userId", type: "string", size: 64, required: true },
      { key: "bookId", type: "string", size: 64, required: true },
      { key: "pageNumber", type: "integer", required: true },
      { key: "content", type: "string", size: 4000, required: true },
      { key: "createdAt", type: "datetime", required: false },
      { key: "updatedAt", type: "datetime", required: false },
    ],
    indexes: [{ key: "user_idx", type: IndexType.Key, attributes: ["userId"] }],
  },
  {
    id: process.env.APPWRITE_HIGHLIGHTS_COLLECTION_ID ?? "highlights",
    name: "Highlights",
    documentSecurity: true,
    permissions: [...USER_OWNED, Permission.read(Role.label("admin"))],
    attributes: [
      { key: "userId", type: "string", size: 64, required: true },
      { key: "bookId", type: "string", size: 64, required: true },
      { key: "pageNumber", type: "integer", required: true },
      { key: "selectedText", type: "string", size: 2000, required: false, default: "" },
      { key: "positionData", type: "string", size: 4000, required: false, default: "" },
      { key: "color", type: "enum", elements: ["yellow", "green", "blue", "pink"], required: false, default: "yellow" },
      { key: "note", type: "string", size: 1000, required: false, default: "" },
      { key: "createdAt", type: "datetime", required: false },
    ],
    indexes: [{ key: "user_idx", type: IndexType.Key, attributes: ["userId"] }],
  },
  {
    id: process.env.APPWRITE_USER_LIBRARY_COLLECTION_ID ?? "user_library",
    name: "User library",
    documentSecurity: true,
    permissions: [...USER_OWNED, Permission.read(Role.label("admin"))],
    attributes: [
      { key: "userId", type: "string", size: 64, required: true },
      { key: "bookId", type: "string", size: 64, required: true },
      { key: "addedAt", type: "datetime", required: false },
    ],
    indexes: [{ key: "user_book_idx", type: IndexType.Unique, attributes: ["userId", "bookId"] }],
  },
  {
    id: process.env.APPWRITE_READING_HISTORY_COLLECTION_ID ?? "reading_history",
    name: "Reading history",
    documentSecurity: true,
    permissions: [...USER_OWNED, Permission.read(Role.label("admin"))],
    attributes: [
      { key: "userId", type: "string", size: 64, required: true },
      { key: "bookId", type: "string", size: 64, required: true },
      { key: "lastPage", type: "integer", required: false, default: 1 },
      { key: "lastReadAt", type: "datetime", required: false },
    ],
    indexes: [
      { key: "user_book_idx", type: IndexType.Unique, attributes: ["userId", "bookId"] },
      { key: "user_idx", type: IndexType.Key, attributes: ["userId"] },
    ],
  },
  {
    id: process.env.APPWRITE_REVIEWS_COLLECTION_ID ?? "reviews",
    name: "Reviews",
    documentSecurity: true,
    permissions: [...USER_OWNED, Permission.read(Role.any()), Permission.read(Role.label("admin"))],
    attributes: [
      { key: "userId", type: "string", size: 64, required: true },
      { key: "bookId", type: "string", size: 64, required: true },
      { key: "userName", type: "string", size: 128, required: false, default: "" },
      { key: "rating", type: "integer", required: true, min: 1, max: 5 },
      { key: "review", type: "string", size: 2000, required: false, default: "" },
      { key: "status", type: "enum", elements: ["pending", "approved"], required: false, default: "approved" },
      { key: "createdAt", type: "datetime", required: false },
      { key: "updatedAt", type: "datetime", required: false },
    ],
    indexes: [{ key: "book_idx", type: IndexType.Key, attributes: ["bookId"] }],
  },
];

const BUCKET_SPECS = [
  { id: process.env.APPWRITE_BOOK_PDFS_BUCKET_ID ?? "book-pdfs", name: "Book PDFs", pdf: true, maxBytes: 300_000_000 },
  { id: process.env.APPWRITE_BOOK_COVERS_BUCKET_ID ?? "book-covers", name: "Book covers", maxBytes: 5_000_000, allowed: ["jpeg", "png", "webp"] },
  { id: process.env.APPWRITE_AUTHOR_IMAGES_BUCKET_ID ?? "author-images", name: "Author images", maxBytes: 5_000_000, allowed: ["jpeg", "png", "webp"] },
  { id: process.env.APPWRITE_CATEGORY_IMAGES_BUCKET_ID ?? "category-images", name: "Category images", maxBytes: 5_000_000, allowed: ["jpeg", "png", "webp"] },
  { id: process.env.APPWRITE_USER_AVATARS_BUCKET_ID ?? "user-avatars", name: "User avatars", maxBytes: 5_000_000, allowed: ["jpeg", "png", "webp"] },
];

/** node-appwrite v20 names the attribute-default parameter `xdefault`. */
function def<T>(value: T | undefined): { xdefault?: T } {
  return value === undefined ? {} : { xdefault: value };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function attrError(message: string): string | null {
  if (message.includes("already exists") || message.includes("attribute already exists")) return null;
  return message;
}

async function createAttribute(spec: CollectionSpec, attr: Attr): Promise<string | null> {
  try {
    if (attr.type === "string") {
      await databases.createStringAttribute({
        databaseId: DB_ID, collectionId: spec.id, key: attr.key, size: attr.size,
        required: attr.required, ...def(attr.default), array: attr.array,
      });
    } else if (attr.type === "integer") {
      await databases.createIntegerAttribute({
        databaseId: DB_ID, collectionId: spec.id, key: attr.key, required: attr.required,
        ...def(attr.default), min: attr.min, max: attr.max,
      });
    } else if (attr.type === "double") {
      await databases.createFloatAttribute({
        databaseId: DB_ID, collectionId: spec.id, key: attr.key, required: attr.required,
        ...def(attr.default), min: attr.min, max: attr.max,
      });
    } else if (attr.type === "boolean") {
      await databases.createBooleanAttribute({ databaseId: DB_ID, collectionId: spec.id, key: attr.key, required: attr.required, ...def(attr.default) });
    } else if (attr.type === "datetime") {
      await databases.createDatetimeAttribute({ databaseId: DB_ID, collectionId: spec.id, key: attr.key, required: attr.required });
    } else if (attr.type === "enum") {
      await databases.createEnumAttribute({
        databaseId: DB_ID, collectionId: spec.id, key: attr.key, elements: attr.elements,
        required: attr.required, ...def(attr.default),
      });
    }
    return null;
  } catch (error) {
    return attrError(error instanceof Error ? error.message : String(error));
  }
}

/** Wait until every expected attribute exists and is in the "available" state. */
async function waitForAttributesAvailable(collectionId: string, keys: string[]): Promise<boolean> {
  const pending = new Set(keys);
  for (let attempt = 0; attempt < 40 && pending.size > 0; attempt++) {
    const coll = await databases.getCollection({ databaseId: DB_ID, collectionId });
    for (const attr of coll.attributes) {
      if (pending.has(attr.key) && attr.status === "available") pending.delete(attr.key);
    }
    if (pending.size === 0) return true;
    await sleep(2000);
  }
  if (pending.size > 0) console.warn(`  still not available: ${[...pending].join(", ")}`);
  return pending.size === 0;
}

async function ensureCollection(spec: CollectionSpec) {
  console.log(`→ Collection "${spec.id}"…`);
  let exists = false;
  try {
    await databases.getCollection({ databaseId: DB_ID, collectionId: spec.id });
    exists = true;
    console.log("  exists — checking attributes/indexes");
  } catch {
    await databases.createCollection({
      databaseId: DB_ID,
      collectionId: spec.id,
      name: spec.name,
      permissions: spec.permissions,
      documentSecurity: spec.documentSecurity,
    });
    console.log("  created");
  }

  const coll = await databases.getCollection({ databaseId: DB_ID, collectionId: spec.id });
  const existingKeys = new Set(coll.attributes.map((a) => a.key));
  const missing = spec.attributes.filter((attr) => !existingKeys.has(attr.key));

  for (const attr of missing) {
    const error = await createAttribute(spec, attr);
    if (error) console.warn(`  attr ${attr.key}: ${error}`);
  }

  if (missing.length > 0) {
    await waitForAttributesAvailable(spec.id, missing.map((a) => a.key));
  }

  const existingIndexes = new Set(coll.indexes.map((i) => i.key));
  for (const index of spec.indexes) {
    if (existingIndexes.has(index.key)) continue;
    try {
      await databases.createIndex({
        databaseId: DB_ID, collectionId: spec.id, key: index.key, type: index.type, attributes: index.attributes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("already exists")) console.warn(`  index ${index.key}: ${message}`);
    }
  }
  console.log("  ready");
}

async function main() {
  console.log(`→ Ensuring database "${DB_ID}"…`);
  try {
    await databases.get({ databaseId: DB_ID });
    console.log("  exists");
  } catch {
    await databases.create({ databaseId: DB_ID, name: "Leaflet" });
    console.log("  created");
  }

  for (const spec of SPECS) {
    await ensureCollection(spec);
  }

  for (const bucket of BUCKET_SPECS) {
    console.log(`→ Bucket "${bucket.id}"…`);
    try {
      const existing = await storage.getBucket({ bucketId: bucket.id });
      // Keep the bucket in sync with the spec (e.g. raised size limits).
      if ((existing.maximumFileSize ?? 0) !== bucket.maxBytes) {
        try {
          await storage.updateBucket({
            bucketId: bucket.id,
            name: bucket.name,
            permissions: [Permission.create(Role.users()), Permission.read(Role.any()), Permission.update(Role.label("admin")), Permission.delete(Role.label("admin"))],
            fileSecurity: true,
            maximumFileSize: bucket.maxBytes,
            allowedFileExtensions: bucket.pdf ? ["pdf"] : bucket.allowed ?? [],
            encryption: true,
            antivirus: false,
          });
          console.log(`  updated (max file size → ${Math.round(bucket.maxBytes / 1_000_000)} MB)`);
        } catch (error) {
          console.warn(`  could not update: ${error instanceof Error ? error.message : error}`);
        }
      } else {
        console.log("  exists (in sync)");
      }
    } catch {
      await storage.createBucket({
        bucketId: bucket.id,
        name: bucket.name,
        permissions: [Permission.create(Role.users()), Permission.read(Role.any()), Permission.update(Role.label("admin")), Permission.delete(Role.label("admin"))],
        fileSecurity: true,
        maximumFileSize: bucket.maxBytes,
        allowedFileExtensions: bucket.pdf ? ["pdf"] : bucket.allowed ?? [],
        encryption: true,
        antivirus: false,
      });
      console.log("  created");
    }
  }

  console.log("\n✅ Appwrite provisioning complete.");
  console.log("   Give your admin account the \"admin\" label in the Appwrite console (Auth → Users → Labels).");
}

main().catch((error) => {
  console.error("Setup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
