import { supabase } from "@/integrations/supabase/client";
import {
  getBaseNovel,
  getBaseVideo,
  getCatalogOverridesSnapshot,
  getNovel,
  slugify,
  type CatalogNovelRow,
  type CatalogVideoRow,
  type Novel,
} from "@/lib/catalog";
import { loadCatalog } from "@/lib/catalog-live";

/* ---------------------------- pure helpers ---------------------------- */

/** Next part number for a novel: one more than the highest numbered part (or the part count). */
export function nextEpisodeNumber(novel: Pick<Novel, "eps"> | undefined): number {
  if (!novel || novel.eps.length === 0) return 1;
  const max = novel.eps.reduce((m, e) => Math.max(m, e.ep ?? 0), 0);
  return Math.max(max, novel.eps.length) + 1;
}

/** A slug for a new novel or category that does not clash with an existing one. */
export function uniqueSlug(name: string, taken: (slug: string) => boolean): string {
  const root = slugify(name) || "novel";
  if (!taken(root)) return root;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${root}-${i}`.slice(0, 80);
    if (!taken(candidate)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export function novelToRow(n: Novel, patch: Partial<CatalogNovelRow> = {}): CatalogNovelRow {
  return {
    slug: n.slug,
    name: n.name,
    urdu: n.urdu,
    subtitle: n.subtitle,
    author: n.author,
    cats: n.cats,
    format: n.format,
    playlist: n.playlist,
    hidden: false,
    ...patch,
  };
}

export type AdminNovel = Novel & { status: "live" | "hidden" | "empty" };

/** Novels for the owner area: everything on the site plus hidden novels and new series without parts. */
export function adminNovelList(live: Novel[]): AdminNovel[] {
  const out: AdminNovel[] = live.map((n) => ({ ...n, status: "live" as const }));
  const seen = new Set(live.map((n) => n.slug));
  for (const row of getCatalogOverridesSnapshot().novels) {
    if (seen.has(row.slug)) continue;
    const base = getBaseNovel(row.slug);
    out.push({
      slug: row.slug,
      name: row.name,
      urdu: row.urdu,
      subtitle: row.subtitle,
      untitled: false,
      author: row.author,
      authorSlug: row.author ? slugify(row.author) : null,
      cats: row.cats ?? [],
      format: row.format,
      playlist: row.playlist,
      duration: base?.duration ?? 0,
      views: base?.views ?? 0,
      recent: base?.recent ?? 0,
      eps: base?.eps ?? [],
      status: row.hidden ? "hidden" : "empty",
    });
  }
  return out;
}

export const findAdminNovel = (slug: string, live: Novel[]) =>
  adminNovelList(live).find((n) => n.slug === slug) ?? null;

/** True when a novel slug is already used anywhere (library, site, or owner rows). */
export const isNovelSlugTaken = (slug: string) =>
  Boolean(getNovel(slug) || getBaseNovel(slug) || getCatalogOverridesSnapshot().novels.some((r) => r.slug === slug));

/* ------------------------------- writes ------------------------------- */
// All writes run as the signed-in owner; database rules reject everyone else.

const now = () => new Date().toISOString();

export async function refreshCatalog() {
  await loadCatalog({ fresh: true });
}

export async function saveNovel(row: CatalogNovelRow) {
  const { error } = await supabase.from("catalog_novels").upsert({
    slug: row.slug,
    name: row.name.trim(),
    urdu: row.urdu?.trim() || null,
    subtitle: row.subtitle?.trim() || null,
    author: row.author?.trim() || null,
    cats: row.cats,
    format: row.format,
    playlist: row.playlist?.trim() || null,
    hidden: row.hidden,
    updated_at: now(),
  });
  if (error) throw new Error(error.message);
}

export type VideoInput = {
  video_id: string;
  novel_slug: string;
  title: string;
  ep: number | null;
  season: number | null;
  source: "youtube" | "terabox";
  share_url: string | null;
  thumb_url?: string | null;
  duration_sec?: number;
  views?: number;
  published_at?: string | null;
  hidden?: boolean;
};

export async function saveVideo(v: VideoInput) {
  const { error } = await supabase.from("catalog_videos").upsert({
    video_id: v.video_id,
    novel_slug: v.novel_slug,
    title: v.title.trim(),
    ep: v.ep,
    season: v.season,
    source: v.source,
    share_url: v.share_url,
    thumb_url: v.thumb_url?.trim() || null,
    duration_sec: Math.max(0, Math.round(v.duration_sec ?? 0)),
    views: Math.max(0, Math.round(v.views ?? 0)),
    published_at: v.published_at ?? null,
    hidden: v.hidden ?? false,
    updated_at: now(),
  });
  if (error) throw new Error(error.message);
}

/** Hide a part from the site (works for original library parts and owner-added parts). */
export async function hideVideo(row: CatalogVideoRow | undefined, videoId: string, novelSlug: string) {
  const base = getBaseVideo(videoId);
  await saveVideo({
    video_id: videoId,
    novel_slug: row?.novel_slug ?? base?.slug ?? novelSlug,
    title: row?.title ?? base?.ep.t ?? videoId,
    ep: row?.ep ?? base?.ep.ep ?? null,
    season: row?.season ?? base?.ep.s ?? null,
    source: row?.source ?? (videoId.startsWith("tb-") ? "terabox" : "youtube"),
    share_url: row?.share_url ?? null,
    thumb_url: row?.thumb_url ?? null,
    duration_sec: row?.duration_sec ?? base?.ep.d ?? 0,
    views: row?.views ?? base?.ep.v ?? 0,
    published_at: row?.published_at ?? null,
    hidden: true,
  });
}

/** Forget the owner's change to a part (an owner-added part disappears; an original part returns). */
export async function resetVideo(videoId: string) {
  const { error } = await supabase.from("catalog_videos").delete().eq("video_id", videoId);
  if (error) throw new Error(error.message);
}

export async function saveCategory(slug: string, name: string) {
  const { error } = await supabase
    .from("catalog_categories")
    .upsert({ slug, name: name.trim(), updated_at: now() });
  if (error) throw new Error(error.message);
}

export async function deleteCategory(slug: string) {
  const { error } = await supabase.from("catalog_categories").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function replyToReview(id: string, reply: string | null) {
  const text = reply?.trim() || null;
  const { error } = await supabase
    .from("reviews")
    .update({ reply: text ? text.slice(0, 1000) : null, replied_at: text ? now() : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
