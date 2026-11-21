import { describe, expect, it } from "vitest";

import { nextEpisodeNumber, uniqueSlug } from "@/lib/admin-catalog";
import { buildCatalog, EMPTY_OVERRIDES } from "@/lib/catalog";
import { embedUrlFor, parseVideoLink, titleFromFileName } from "@/lib/video";

describe("owner video links", () => {
  it("reads the owner's TeraBox share link and plays it with TeraBox's embeddable player", () => {
    const v = parseVideoLink("https://1024terabox.com/s/1EVpU917RtvEHp01iMEyxaA");
    expect(v?.source).toBe("terabox");
    expect(v?.id).toBe("tb-EVpU917RtvEHp01iMEyxaA");
    expect(embedUrlFor("tb-EVpU917RtvEHp01iMEyxaA")).toContain("/sharing/embed?surl=EVpU917RtvEHp01iMEyxaA");
  });

  it("reads TeraBox ?surl= links on other TeraBox domains", () => {
    expect(parseVideoLink("https://www.terabox.app/sharing/link?surl=AbCdEf12")?.id).toBe("tb-AbCdEf12");
  });

  it("still reads YouTube links", () => {
    expect(parseVideoLink("https://youtu.be/hKBrXDgq6HM")).toEqual({ source: "youtube", id: "hKBrXDgq6HM", shareUrl: null });
  });

  it("rejects links from other sites", () => {
    expect(parseVideoLink("https://example.com/s/1abcdef")).toBeNull();
  });

  it("turns a TeraBox file name into a title", () => {
    expect(titleFromFileName("Justaju Thi khas _ Episode 1 _ Zeenia Sharjeel _ Complete Text + Audio.mp4"))
      .toBe("Justaju Thi khas | Episode 1 | Zeenia Sharjeel | Complete Text + Audio");
  });
});

describe("adding parts and series", () => {
  it("suggests the next episode after the highest one", () => {
    expect(nextEpisodeNumber({ eps: [{ id: "a", t: "", ep: 1, s: null, d: 0, v: 0 }, { id: "b", t: "", ep: 7, s: null, d: 0, v: 0 }] })).toBe(8);
    expect(nextEpisodeNumber({ eps: [] })).toBe(1);
  });

  it("gives a new series a slug that does not clash", () => {
    expect(uniqueSlug("Man Yaram", (s) => s === "man-yaram")).toBe("man-yaram-2");
  });

  it("shows a new series with a TeraBox first episode and a new category", () => {
    const view = buildCatalog({
      ...EMPTY_OVERRIDES,
      version: "t1",
      categories: [{ slug: "revenge", name: "Revenge Based" }],
      novels: [{ slug: "nayi-kahani-test", name: "Nayi Kahani", urdu: null, subtitle: null, author: "Zeenia Sharjeel", cats: ["revenge"], format: "series", playlist: null, hidden: false }],
      videos: [{ video_id: "tb-EVpU917RtvEHp01iMEyxaA", novel_slug: "nayi-kahani-test", title: "Episode 1", ep: 1, season: null, duration_sec: 0, views: 0, hidden: false, published_at: null, source: "terabox", share_url: null, thumb_url: null }],
    });
    const novel = view.novels.find((n) => n.slug === "nayi-kahani-test");
    expect(novel?.eps.map((e) => e.id)).toEqual(["tb-EVpU917RtvEHp01iMEyxaA"]);
    expect(view.categories.find((c) => c.slug === "revenge")).toEqual({ slug: "revenge", name: "Revenge Based", count: 1 });
  });

  it("adds a new part to an existing novel", () => {
    const view = buildCatalog({
      ...EMPTY_OVERRIDES,
      version: "t2",
      videos: [{ video_id: "AAAAAAAAAAA", novel_slug: "man-yaram", title: "Mann Yaram | Episode 19", ep: 19, season: null, duration_sec: 600, views: 0, hidden: false, published_at: null }],
    });
    const eps = view.novels.find((n) => n.slug === "man-yaram")?.eps ?? [];
    expect(eps).toHaveLength(19);
    expect(eps[eps.length - 1]?.id).toBe("AAAAAAAAAAA");
  });
});
