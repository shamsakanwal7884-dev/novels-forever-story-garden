/** Video links the owner can paste: YouTube (any link form) or a TeraBox share link. */
import { parseYoutubeId } from "@/lib/youtube";

export type ParsedVideo =
  | { source: "youtube"; id: string; shareUrl: null }
  | { source: "terabox"; id: string; surl: string; shareUrl: string };

const TERABOX_HOSTS = [
  "terabox.com", "1024terabox.com", "teraboxapp.com", "terabox.app", "1024tera.com", "4funbox.com",
  "mirrobox.com", "nephobox.com", "momerybox.com", "tibibox.com", "freeterabox.com", "terabox.club",
  "terasharelink.com", "teraboxlink.com", "terafileshare.com", "teraboxshare.com",
];

export function isTeraboxHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, "");
  return TERABOX_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
}

/** Share code of a TeraBox link: "/s/1Abc…" (leading 1 dropped) or "?surl=Abc…". */
export function parseTeraboxSurl(input: string): string | null {
  let url: URL;
  try {
    const v = input.trim();
    url = new URL(v.startsWith("http") ? v : `https://${v}`);
  } catch {
    return null;
  }
  if (!isTeraboxHost(url.hostname)) return null;
  const fromQuery = url.searchParams.get("surl");
  const fromPath = /\/s\/([A-Za-z0-9_-]+)/.exec(url.pathname)?.[1];
  let code = fromQuery ?? (fromPath ? fromPath.replace(/^1/, "") : null);
  if (!code) return null;
  code = code.trim();
  return /^[A-Za-z0-9_-]{4,80}$/.test(code) ? code : null;
}

export function parseVideoLink(input: string): ParsedVideo | null {
  const surl = parseTeraboxSurl(input);
  if (surl) return { source: "terabox", id: `tb-${surl}`, surl, shareUrl: `https://www.1024terabox.com/s/1${surl}` };
  const id = parseYoutubeId(input);
  return id ? { source: "youtube", id, shareUrl: null } : null;
}

export const isTeraboxId = (id: string) => id.startsWith("tb-");
export const teraboxSurl = (id: string) => id.slice(3);

/** TeraBox's own embeddable player page (the regular share page refuses to load inside other sites). */
export const teraboxEmbedUrl = (surl: string) =>
  `https://www.1024terabox.com/sharing/embed?surl=${encodeURIComponent(surl)}&autoplay=false&mute=false`;
export const teraboxShareUrl = (surl: string) => `https://www.1024terabox.com/s/1${surl}`;

export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

/** Player URL for any episode id (YouTube id or "tb-<code>"). */
export const embedUrlFor = (id: string) => (isTeraboxId(id) ? teraboxEmbedUrl(teraboxSurl(id)) : youtubeEmbedUrl(id));
/** Link that opens the video on its own site. */
export const watchUrlFor = (id: string) =>
  isTeraboxId(id) ? teraboxShareUrl(teraboxSurl(id)) : `https://www.youtube.com/watch?v=${id}`;

/** Clean a TeraBox file name ("Novel _ Episode 1 _ Writer.mp4") into a title. */
export function titleFromFileName(name: string): string {
  return name
    .replace(/\.(mp4|mkv|mov|webm|avi|m4v)$/i, "")
    .replace(/\s+_\s+/g, " | ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
