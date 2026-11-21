import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { parseChannelFeed, parseYoutubeId, type FeedVideo } from "@/lib/youtube";

const UA = "Mozilla/5.0 (compatible; NovelsForeverBot/1.0; +https://www.youtube.com/@NovelsForever)";

async function fetchText(url: string, ms: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "en" }, signal: controller.signal });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Latest uploads of the channel from YouTube's public RSS feed (no API key needed). */
export const checkChannelVideos = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ channelId: z.string().regex(/^UC[A-Za-z0-9_-]{22}$/) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ videos: FeedVideo[]; ok: boolean }> => {
    const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${data.channelId}`, 10_000);
    if (!xml) return { videos: [], ok: false };
    return { videos: parseChannelFeed(xml), ok: true };
  });

export type VideoDetails = {
  id: string;
  title: string | null;
  channel: string | null;
  duration: number;
  views: number;
  published: string | null;
};

/** Title (oEmbed) plus best-effort length/views from the public watch page. */
export const lookupVideo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ input: z.string().min(5).max(300) }).parse(input))
  .handler(async ({ data }): Promise<VideoDetails | null> => {
    const id = parseYoutubeId(data.input);
    if (!id) return null;
    const watch = `https://www.youtube.com/watch?v=${id}`;
    const [oembedText, page] = await Promise.all([
      fetchText(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`, 8_000),
      fetchText(`${watch}&hl=en`, 8_000),
    ]);
    let title: string | null = null;
    let channel: string | null = null;
    if (oembedText) {
      try {
        const o = JSON.parse(oembedText) as { title?: string; author_name?: string };
        title = o.title ?? null;
        channel = o.author_name ?? null;
      } catch {
        /* ignore */
      }
    }
    const duration = Number(/"lengthSeconds":"(\d+)"/.exec(page ?? "")?.[1] ?? 0);
    const views = Number(/"viewCount":"(\d+)"/.exec(page ?? "")?.[1] ?? 0);
    const published = /"(?:publishDate|uploadDate)":"([^"]+)"/.exec(page ?? "")?.[1] ?? null;
    if (!title && !duration) return { id, title: null, channel: null, duration: 0, views: 0, published: null };
    return { id, title, channel, duration, views, published };
  });

/** Best-effort file name of a TeraBox share (from its public player page), used to prefill the title. */
export const lookupTerabox = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ surl: z.string().regex(/^[A-Za-z0-9_-]{4,80}$/) }).parse(input))
  .handler(async ({ data }): Promise<{ title: string | null; found: boolean }> => {
    const page = await fetchText(`https://www.1024terabox.com/sharing/embed?surl=${data.surl}`, 10_000);
    if (!page) return { title: null, found: false };
    const og = /property="og:title"\s+content="([^"]*)"/.exec(page)?.[1] ?? /<title>([^<]*)<\/title>/.exec(page)?.[1] ?? "";
    const name = og
      .replace(/&amp;/g, "&")
      .replace(/\s*-\s*(Shared via TeraBox|Share Files Online.*)$/i, "")
      .trim();
    if (!name || /file\(s\) including\s+are shared/i.test(name)) return { title: null, found: false };
    return { title: name, found: true };
  });
