import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { CatalogCategoryRow, CatalogNovelRow, CatalogOverrides, CatalogVideoRow } from "@/lib/catalog";

/**
 * Public read of the admin's novel/video edits (the website shows all of it anyway).
 * Uses only the publishable key, so it works on Lovable hosting and on Vercel alike.
 */
export const getCatalogOverrides = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ fresh: z.boolean().optional() }).parse(input ?? {}))
  .handler(async (): Promise<CatalogOverrides> => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Backend address is not configured.");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers, cache: "no-store" });
        },
      },
    });
    const [novelsRes, videosRes, catsRes] = await Promise.all([
      client
        .from("catalog_novels")
        .select("slug, name, urdu, subtitle, author, cats, format, playlist, hidden, updated_at")
        .order("slug")
        .limit(5000),
      client
        .from("catalog_videos")
        .select("video_id, novel_slug, title, ep, season, duration_sec, views, hidden, published_at, created_at, updated_at, source, share_url, thumb_url")
        .order("created_at")
        .limit(10000),
      client.from("catalog_categories").select("slug, name, created_at, updated_at").order("created_at").limit(500),
    ]);
    if (novelsRes.error) throw new Error(novelsRes.error.message);
    if (videosRes.error) throw new Error(videosRes.error.message);
    if (catsRes.error) throw new Error(catsRes.error.message);
    const categories = (catsRes.data ?? []) as CatalogCategoryRow[];
    const novels = (novelsRes.data ?? []) as CatalogNovelRow[];
    const videoRows = videosRes.data ?? [];
    const stamps = [
      ...novels.map((n) => n.updated_at ?? ""),
      ...videoRows.map((v) => v.updated_at ?? ""),
      ...categories.map((c) => c.updated_at ?? ""),
    ].sort();
    const version = `${novels.length}:${videoRows.length}:${categories.length}:${stamps[stamps.length - 1] ?? ""}`;
    const videos: CatalogVideoRow[] = videoRows.map(({ updated_at: _u, ...v }) => ({
      ...v,
      duration_sec: Number(v.duration_sec) || 0,
      views: Number(v.views) || 0,
      source: v.source === "terabox" ? "terabox" : "youtube",
    }));
    return { version, novels, videos, categories };
  });
