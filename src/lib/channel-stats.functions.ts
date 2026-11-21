import { createServerFn } from "@tanstack/react-start";
import { FALLBACK_CHANNEL_STATS, parseChannelAbout, type ChannelStats } from "@/lib/channel-stats";

const ABOUT_URL = "https://www.youtube.com/@NovelsForever/about?hl=en&gl=US";
let cache: { at: number; stats: ChannelStats } | null = null;

/** Subscribers, total views, video count and join date from the channel's public About page. */
export const getChannelStats = createServerFn({ method: "GET" }).handler(async (): Promise<ChannelStats> => {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) return cache.stats;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(ABOUT_URL, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "accept-language": "en-US,en;q=0.9" },
      signal: controller.signal,
    });
    if (!res.ok) return FALLBACK_CHANNEL_STATS;
    const parsed = parseChannelAbout(await res.text());
    if (!parsed.subscribers) return FALLBACK_CHANNEL_STATS;
    const stats: ChannelStats = { ...FALLBACK_CHANNEL_STATS, ...parsed, live: true };
    cache = { at: Date.now(), stats };
    return stats;
  } catch {
    return FALLBACK_CHANNEL_STATS;
  } finally {
    clearTimeout(timer);
  }
});
