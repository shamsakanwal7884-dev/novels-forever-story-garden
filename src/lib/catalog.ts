import raw from "@/data/catalog.json";
import { media } from "@/lib/media";
import { isTeraboxId } from "@/lib/video";

export type Episode = {
  id: string;
  t: string;
  ep: number | null;
  s: number | null;
  d: number;
  v: number;
  /** Cover picture for non-YouTube parts (TeraBox). */
  img?: string | null;
};

export type Novel = {
  slug: string;
  name: string;
  urdu: string | null;
  subtitle: string | null;
  untitled: boolean;
  author: string | null;
  authorSlug: string | null;
  cats: string[];
  format: "series" | "complete";
  playlist: string | null;
  duration: number;
  views: number;
  recent: number;
  eps: Episode[];
};

export type Category = { slug: string; name: string; count: number };
export type Author = { name: string; slug: string; playlists: string[]; novels: string[] };
export type Collection = { id: string; title: string; novels: string[]; count: number };

type Catalog = {
  channel: { name: string; handle: string; id: string; url: string };
  generatedAt: string;
  totalVideos: number;
  categories: Category[];
  authors: Author[];
  collections: Collection[];
  novels: Novel[];
};

const base = raw as unknown as Catalog;
export const catalog = base;
export const channel = base.channel;

/* ------------------------------------------------------------------ */
/* Admin overrides: rows from Lovable Cloud layered over catalog.json. */
/* ------------------------------------------------------------------ */

export type CatalogNovelRow = {
  slug: string;
  name: string;
  urdu: string | null;
  subtitle: string | null;
  author: string | null;
  cats: string[];
  format: "series" | "complete";
  playlist: string | null;
  hidden: boolean;
  updated_at?: string;
};

export type CatalogVideoRow = {
  video_id: string;
  novel_slug: string;
  title: string;
  ep: number | null;
  season: number | null;
  duration_sec: number;
  views: number;
  hidden: boolean;
  published_at: string | null;
  created_at?: string;
  source?: "youtube" | "terabox";
  share_url?: string | null;
  thumb_url?: string | null;
};

export type CatalogCategoryRow = { slug: string; name: string; created_at?: string; updated_at?: string };

export type CatalogOverrides = {
  version: string;
  novels: CatalogNovelRow[];
  videos: CatalogVideoRow[];
  categories?: CatalogCategoryRow[];
};

export const EMPTY_OVERRIDES: CatalogOverrides = { version: "base", novels: [], videos: [], categories: [] };

/** Built-in categories plus the owner's own (an owner row with a built-in slug renames it). */
export function mergeCategories(rows: CatalogCategoryRow[] = []): Category[] {
  const out = base.categories.map((c) => ({ ...c }));
  for (const r of rows) {
    const existing = out.find((c) => c.slug === r.slug);
    if (existing) existing.name = r.name;
    else out.push({ slug: r.slug, name: r.name, count: 0 });
  }
  return out;
}
export const isBuiltInCategory = (slug: string) => base.categories.some((c) => c.slug === slug);

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Where each video of catalog.json lives (novel slug + episode), for admin edits. */
const baseVideoIndex = new Map<string, { slug: string; ep: Episode }>();
for (const n of base.novels) for (const e of n.eps) baseVideoIndex.set(e.id, { slug: n.slug, ep: e });
export const getBaseVideo = (id: string) => baseVideoIndex.get(id);
export const getBaseNovel = (slug: string) => base.novels.find((n) => n.slug === slug);
const baseMaxRecent = base.novels.reduce((m, n) => Math.max(m, n.recent), 0);

export type CatalogView = {
  novels: Novel[];
  authors: Author[];
  categories: Category[];
  collections: Collection[];
  totalVideos: number;
};

/** Pure merge: catalog.json + admin rows. Exported for tests. */
export function buildCatalog(o: CatalogOverrides): CatalogView {
  const customCats = o.categories ?? [];
  if (o.novels.length === 0 && o.videos.length === 0 && customCats.length === 0) {
    return { novels: base.novels, authors: base.authors, categories: base.categories, collections: base.collections, totalVideos: base.totalVideos };
  }

  const meta = new Map<string, Novel & { hidden?: boolean }>();
  for (const n of base.novels) meta.set(n.slug, { ...n, eps: [...n.eps] });

  for (const row of o.novels) {
    const existing = meta.get(row.slug);
    const author = row.author?.trim() || null;
    const authorSlug = author
      ? existing && existing.author === author && existing.authorSlug ? existing.authorSlug : slugify(author) || null
      : null;
    meta.set(row.slug, {
      slug: row.slug,
      name: row.name.trim(),
      urdu: row.urdu?.trim() || null,
      subtitle: row.subtitle?.trim() || null,
      untitled: false,
      author,
      authorSlug,
      cats: row.cats ?? [],
      format: row.format,
      playlist: row.playlist?.trim() || null,
      duration: existing?.duration ?? 0,
      views: existing?.views ?? 0,
      recent: existing?.recent ?? 0,
      eps: existing ? existing.eps : [],
      hidden: row.hidden,
    });
  }

  const touched = new Set<string>();
  const fresh: { slug: string; at: number }[] = [];
  for (const v of o.videos) {
    const owner = baseVideoIndex.get(v.video_id);
    if (owner) {
      const from = meta.get(owner.slug);
      if (from) from.eps = from.eps.filter((e) => e.id !== v.video_id);
      touched.add(owner.slug);
    }
    if (v.hidden) continue;
    const target = meta.get(v.novel_slug);
    if (!target) continue;
    target.eps = [
      ...target.eps.filter((e) => e.id !== v.video_id),
      {
        id: v.video_id,
        t: v.title,
        ep: v.ep,
        s: v.season,
        d: v.duration_sec || owner?.ep.d || 0,
        v: v.views || owner?.ep.v || 0,
        ...(v.source === "terabox" ? { img: v.thumb_url ?? null } : {}),
      },
    ];
    touched.add(v.novel_slug);
    if (!owner) fresh.push({ slug: v.novel_slug, at: Date.parse(v.published_at ?? v.created_at ?? "") || 0 });
  }

  for (const slug of touched) {
    const n = meta.get(slug);
    if (!n) continue;
    // Keep catalog order unless every part has an episode number; then order by season + episode.
    if (n.eps.length > 1 && n.eps.every((e) => e.ep != null)) {
      n.eps = [...n.eps].sort((a, b) => (a.s ?? 0) - (b.s ?? 0) || (a.ep ?? 0) - (b.ep ?? 0));
    }
    n.duration = n.eps.reduce((s, e) => s + e.d, 0);
    n.views = n.eps.reduce((s, e) => s + e.v, 0);
  }

  // Newly added videos push their novel to the top of "Latest", newest first.
  fresh.sort((a, b) => a.at - b.at);
  fresh.forEach((f, i) => {
    const n = meta.get(f.slug);
    if (n) n.recent = Math.max(n.recent, baseMaxRecent + 1 + i);
  });

  const novels: Novel[] = [];
  for (const n of meta.values()) {
    if (n.hidden || n.eps.length === 0) continue;
    const { hidden: _hidden, ...rest } = n;
    novels.push(rest);
  }
  const present = new Set(novels.map((n) => n.slug));

  const authorRecords = new Map<string, Author>();
  for (const a of base.authors) authorRecords.set(a.slug, { ...a, novels: [] });
  const baseAuthorOrder = new Map<string, number>();
  for (const a of base.authors) a.novels.forEach((s, i) => baseAuthorOrder.set(`${a.slug}/${s}`, i));
  for (const n of novels) {
    if (!n.authorSlug || !n.author) continue;
    const rec = authorRecords.get(n.authorSlug) ?? { name: n.author, slug: n.authorSlug, playlists: [], novels: [] };
    rec.novels.push(n.slug);
    authorRecords.set(n.authorSlug, rec);
  }
  const authors = [...authorRecords.values()]
    .filter((a) => a.novels.length > 0)
    .map((a) => ({
      ...a,
      novels: [...a.novels].sort(
        (x, y) => (baseAuthorOrder.get(`${a.slug}/${x}`) ?? 1e9) - (baseAuthorOrder.get(`${a.slug}/${y}`) ?? 1e9),
      ),
    }));

  const categories = mergeCategories(customCats).map((c) => ({ ...c, count: novels.filter((n) => n.cats.includes(c.slug)).length }));
  const collections = base.collections
    .map((c) => ({ ...c, novels: c.novels.filter((s) => present.has(s)) }))
    .map((c) => ({ ...c, count: c.novels.length }));
  const totalVideos = novels.reduce((s, n) => s + n.eps.length, 0);
  return { novels, authors, categories, collections, totalVideos };
}

/* Live catalog. These bindings are replaced when admin overrides load, so every importer
   reads the current library (ES modules export live bindings). */
export let novels: Novel[] = base.novels;
export let categories: Category[] = base.categories;
export let authors: Author[] = base.authors;
export let collections: Collection[] = base.collections;
export let byViews: Novel[] = [];
export let byRecent: Novel[] = [];
export let totalNovels = 0;
export let totalVideos = 0;
export let totalViews = 0;

let novelMap = new Map<string, Novel>();
let authorMap = new Map<string, Author>();
let categoryMap = new Map<string, Category>();
let currentOverrides: CatalogOverrides = EMPTY_OVERRIDES;
let videoIds = new Set<string>();

function install(view: CatalogView) {
  novels = view.novels;
  categories = view.categories;
  authors = view.authors;
  collections = view.collections;
  byViews = [...novels].sort((a, b) => b.views - a.views);
  byRecent = [...novels].sort((a, b) => b.recent - a.recent);
  totalNovels = novels.length;
  totalVideos = view.totalVideos;
  totalViews = novels.reduce((sum, n) => sum + n.views, 0);
  novelMap = new Map(novels.map((n) => [n.slug, n]));
  authorMap = new Map(authors.map((a) => [a.slug, a]));
  categoryMap = new Map(categories.map((c) => [c.slug, c]));
  videoIds = new Set(novels.flatMap((n) => n.eps.map((e) => e.id)));
}
install(buildCatalog(EMPTY_OVERRIDES));

/** Applies admin rows to the live catalog; repeated calls with the same version are free. */
export function applyCatalogOverrides(o: CatalogOverrides | null | undefined) {
  if (!o || o.version === currentOverrides.version) return;
  currentOverrides = o;
  install(buildCatalog(o));
}
export const getCatalogOverridesSnapshot = () => currentOverrides;
/** True when a YouTube video is already somewhere on the site (or deliberately hidden). */
export const isKnownVideo = (id: string) =>
  videoIds.has(id) || baseVideoIndex.has(id) || currentOverrides.videos.some((v) => v.video_id === id);

export const getNovel = (slug: string) => novelMap.get(slug);
export const getAuthor = (slug: string) => authorMap.get(slug);
export const getCategory = (slug: string) => categoryMap.get(slug);

export function novelsOf(slugs: string[]): Novel[] {
  return slugs.map((s) => novelMap.get(s)).filter((n): n is Novel => Boolean(n));
}

export function novelsInCategory(slug: string): Novel[] {
  return byViews.filter((n) => n.cats.includes(slug));
}

export function searchNovels(q: string, list: Novel[] = byViews): Novel[] {
  const term = q.trim().toLowerCase();
  if (!term) return list;
  return list.filter(
    (n) =>
      n.name.toLowerCase().includes(term) ||
      (n.author ?? "").toLowerCase().includes(term) ||
      (n.urdu ?? "").includes(q.trim()) ||
      n.eps.some((e) => e.t.toLowerCase().includes(term)),
  );
}

/** Guesses novel, episode and season from a channel video title like "Mann Yaram | Episode 3 | Maha Gull | …". */
export function suggestFromTitle(title: string, list: Novel[] = byViews) {
  const parts = title.split("|").map((p) => p.trim()).filter(Boolean);
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const head = norm(parts[0] ?? title);
  const epMatch = /\b(?:episode|epi|ep|part|qist)\s*#?\s*(\d{1,4})\b/i.exec(title);
  const seasonMatch = /\bseason\s*#?\s*(\d{1,3})\b/i.exec(title);
  let novel: Novel | undefined;
  if (head.length >= 3) {
    // Exact title match first, then any novel whose earlier episodes share the same title prefix.
    novel = list.find((n) => norm(n.name) === head);
    novel ??= list.find((n) => n.eps.some((e) => norm(e.t.split("|")[0] ?? "") === head));
  }
  return {
    novelSlug: novel?.slug ?? null,
    name: parts[0] ?? title,
    author: parts.length >= 3 && !/episode|season|complete|text|audio/i.test(parts[2] ?? "") ? parts[2] ?? null : null,
    ep: epMatch ? Number(epMatch[1]) : null,
    season: seasonMatch ? Number(seasonMatch[1]) : null,
  };
}

export const thumb = (videoId: string, quality: "hq" | "mq" | "maxres" = "hq") =>
  `https://i.ytimg.com/vi/${videoId}/${quality}default.jpg`;

/** Novel cover: first YouTube part's thumbnail, else a TeraBox cover, else the library artwork. */
export function coverOf(n: Novel): string {
  const yt = n.eps.find((e) => !isTeraboxId(e.id));
  if (yt) return thumb(yt.id, "hq");
  return n.eps.find((e) => e.img)?.img ?? media.hero;
}

/** Thumbnail for one part of a novel. */
export function episodeThumb(e: Episode, n: Novel, quality: "hq" | "mq" = "mq"): string {
  if (!isTeraboxId(e.id)) return thumb(e.id, quality);
  return e.img ?? coverOf(n);
}

/** Every override row (including hidden and empty novels) for the owner area. */
export const getOverrideNovel = (slug: string) => currentOverrides.novels.find((r) => r.slug === slug);

export function formatViews(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
}

export function formatDuration(seconds: number): string {
  if (!seconds) return "New";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const CHANNEL_OWNER = {
  name: "Nadia Nawaz",
  role: "Channel owner & narrator",
  description: "All Novels Forever videos are narrated in Nadia Nawaz's voice.",
};

export const OWNER = {
  name: "Sardar Rdx",
  whatsapp: "923301068874",
  whatsappDisplay: "+92 330 1068874",
};

export const whatsappLink = (text = "Assalam o Alaikum! I came from the Novels Forever website.") =>
  `https://wa.me/${OWNER.whatsapp}?text=${encodeURIComponent(text)}`;

export const findPdfLink = (n: Novel) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${n.name} novel${n.author ? ` by ${n.author}` : ""} pdf download`)}`;

export const youtubeVideoLink = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubePlaylistLink = (id: string) => `https://www.youtube.com/playlist?list=${id}`;
