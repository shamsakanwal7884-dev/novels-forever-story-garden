/** Live YouTube channel numbers for the Nadia Nawaz page, with safe fallbacks. */
export type ChannelStats = {
  subscribers: number;
  views: number;
  videos: number;
  /** ISO date the channel was created on YouTube. */
  joined: string;
  country: string;
  live: boolean;
};

/** Last known numbers (Nov 2026) shown until the live ones arrive or if YouTube can't be reached. */
export const FALLBACK_CHANNEL_STATS: ChannelStats = {
  subscribers: 35_700,
  views: 12_646_283,
  videos: 1_303,
  joined: "2019-03-11",
  country: "Pakistan",
  live: false,
};

/** "35.7K" → 35700, "1.2M" → 1200000, "1,303" → 1303. */
export function parseCount(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = /([\d.,]+)\s*([KMB])?/i.exec(text.replace(/\u00a0/g, " "));
  if (!m?.[1]) return null;
  const n = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] ?? "").toUpperCase() as "K" | "M" | "B"] ?? 1;
  return Math.round(n * mult);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "Joined Mar 11, 2019" → "2019-03-11". */
export function parseJoined(text: string | null | undefined): string | null {
  const m = /([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})/.exec(text ?? "");
  if (!m?.[1] || !m[2] || !m[3]) return null;
  const mi = MONTHS.indexOf(m[1].toLowerCase());
  if (mi < 0) return null;
  return `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** Pulls the public numbers out of the channel's About page HTML. */
export function parseChannelAbout(html: string): Partial<ChannelStats> {
  const pick = (re: RegExp) => re.exec(html)?.[1] ?? null;
  const out: Partial<ChannelStats> = {};
  const subs = parseCount(pick(/"subscriberCountText":"([^"]+)"/) ?? pick(/([\d.,]+[KMB]?) subscribers/));
  const views = parseCount(pick(/"viewCountText":"([^"]+)"/));
  const videos = parseCount(pick(/"videoCountText":"([^"]+)"/));
  const joined = parseJoined(pick(/"joinedDateText":\{"content":"([^"]+)"/));
  const country = pick(/"country":"([^"]+)"/);
  if (subs) out.subscribers = subs;
  if (views) out.views = views;
  if (videos) out.videos = videos;
  if (joined) out.joined = joined;
  if (country) out.country = country;
  return out;
}
