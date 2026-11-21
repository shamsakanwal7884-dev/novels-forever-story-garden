import { useEffect, useState } from "react";
import { pdfUrl } from "./community";

/**
 * Books opened in the reader are kept on the reader's device (browser Cache Storage),
 * so they open again without internet. Nothing is uploaded; each device keeps its own copies.
 */
const CACHE = "nf-books-v1";
const CHANGED = "nf:books-changed";
const keyFor = (slug: string) => `/offline-books/${slug}.pdf`;

export type SavedBook = { slug: string; size: number; savedAt: string };

const supported = () => typeof window !== "undefined" && "caches" in window;

export async function getSavedBook(slug: string): Promise<ArrayBuffer | null> {
  if (!supported()) return null;
  const cache = await caches.open(CACHE);
  const res = await cache.match(keyFor(slug));
  return res ? res.arrayBuffer() : null;
}

export async function saveBook(slug: string, data: ArrayBuffer): Promise<boolean> {
  if (!supported()) return false;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(
      keyFor(slug),
      new Response(data.slice(0), {
        headers: {
          "Content-Type": "application/pdf",
          "X-Saved-At": new Date().toISOString(),
          "X-Size": String(data.byteLength),
        },
      }),
    );
    void navigator.storage?.persist?.().catch(() => false);
    void warmPages(slug);
    window.dispatchEvent(new Event(CHANGED));
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

/** Keeps a copy of the reader and library pages so they open offline in the installed app. */
async function warmPages(slug: string) {
  if (!navigator.onLine) return;
  try {
    const pages = await caches.open("nf-pages");
    for (const path of [`/read/${slug}`, "/pdfs"]) {
      const res = await fetch(path, { credentials: "same-origin" });
      if (res.ok) await pages.put(new URL(path, window.location.origin).href, res);
    }
  } catch {
    /* best effort */
  }
}

export async function removeBook(slug: string) {
  if (!supported()) return;
  const cache = await caches.open(CACHE);
  await cache.delete(keyFor(slug));
  window.dispatchEvent(new Event(CHANGED));
}

export async function listSavedBooks(): Promise<SavedBook[]> {
  if (!supported()) return [];
  const cache = await caches.open(CACHE);
  const keys = await cache.keys();
  const out: SavedBook[] = [];
  for (const req of keys) {
    const m = new URL(req.url).pathname.match(/^\/offline-books\/(.+)\.pdf$/);
    if (!m) continue;
    const res = await cache.match(req);
    out.push({
      slug: decodeURIComponent(m[1] ?? ""),
      size: Number(res?.headers.get("X-Size") ?? 0),
      savedAt: res?.headers.get("X-Saved-At") ?? "",
    });
  }
  return out.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function useSavedBooks() {
  const [books, setBooks] = useState<SavedBook[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => void listSavedBooks().then((b) => alive && setBooks(b));
    load();
    window.addEventListener(CHANGED, load);
    return () => {
      alive = false;
      window.removeEventListener(CHANGED, load);
    };
  }, []);
  return books;
}

export type LoadResult =
  | { kind: "ok"; data: ArrayBuffer; fromDevice: boolean; saved: boolean }
  | { kind: "no-pdf" }
  | { kind: "offline-missing" };

/** Device copy first; otherwise download from the library, then keep a device copy. */
export async function loadBook(slug: string, onProgress?: (pct: number) => void): Promise<LoadResult> {
  const local = await getSavedBook(slug);
  if (local) return { kind: "ok", data: local, fromDevice: true, saved: true };
  if (!navigator.onLine) return { kind: "offline-missing" };

  let url: string;
  try {
    url = await pdfUrl(slug, false);
  } catch (err) {
    if (err instanceof Error && err.message === "No PDF for this novel.") return { kind: "no-pdf" };
    throw err;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const data = await readWithProgress(res, onProgress);
  const saved = await saveBook(slug, data);
  return { kind: "ok", data, fromDevice: false, saved };
}

async function readWithProgress(res: Response, onProgress?: (pct: number) => void): Promise<ArrayBuffer> {
  const total = Number(res.headers.get("Content-Length") ?? 0);
  if (!res.body || !total || !onProgress) return res.arrayBuffer();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.byteLength;
    onProgress(Math.min(99, Math.round((got / total) * 100)));
  }
  const out = new Uint8Array(got);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out.buffer;
}

export function formatSize(bytes: number) {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
