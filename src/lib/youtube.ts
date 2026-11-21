/** Pulls the 11-character video id out of any YouTube link (watch, youtu.be, shorts, live, embed) or a bare id. */
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\.|^m\.|^music\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = url.searchParams.get("v");
      if (!id) {
        const m = /^\/(?:shorts|live|embed|v)\/([^/?#]+)/.exec(url.pathname);
        id = m?.[1] ?? null;
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
export function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_m, e: string) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e.toLowerCase()] ?? _m;
  });
}

export type FeedVideo = { id: string; title: string; published: string | null; views: number };

/** Reads a YouTube channel RSS feed (latest ~15 uploads). */
export function parseChannelFeed(xml: string): FeedVideo[] {
  const out: FeedVideo[] = [];
  for (const block of xml.split("<entry>").slice(1)) {
    const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(block)?.[1]?.trim();
    const title = /<title>([\s\S]*?)<\/title>/.exec(block)?.[1];
    if (!id || !title) continue;
    out.push({
      id,
      title: decodeXml(title.trim()),
      published: /<published>([^<]+)<\/published>/.exec(block)?.[1] ?? null,
      views: Number(/<media:statistics views="(\d+)"/.exec(block)?.[1] ?? 0),
    });
  }
  return out;
}
