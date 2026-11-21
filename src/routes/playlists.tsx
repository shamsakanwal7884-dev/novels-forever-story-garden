import { createFileRoute } from "@tanstack/react-router";
import { ListVideo, Youtube } from "lucide-react";
import { NovelCard, SectionHeading } from "@/components/site/NovelCard";
import { Button } from "@/components/ui/button";
import { collections, novelsOf, youtubePlaylistLink } from "@/lib/catalog";

export const Route = createFileRoute("/playlists")({
  head: () => ({
    meta: [
      { title: "Novel Playlists — Novels Forever" },
      { name: "description", content: "Every Novels Forever YouTube playlist, with the novels inside each one." },
      { property: "og:title", content: "Novel Playlists — Novels Forever" },
      { property: "og:description", content: "Browse the Novels Forever channel playlists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlaylistsPage,
});

function PlaylistsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="From the channel" title="Playlists" />
      <div className="space-y-16">
        {collections.map((c) => {
          const items = novelsOf(c.novels);
          return (
            <section key={c.id} aria-label={c.title}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-3xl font-semibold">
                    <ListVideo className="h-6 w-6 text-primary" /> {c.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{c.count} videos · {items.length} novels</p>
                </div>
                <Button asChild variant="glass">
                  <a href={youtubePlaylistLink(c.id)} target="_blank" rel="noreferrer"><Youtube /> Open on YouTube</a>
                </Button>
              </div>
              <div className="scrollbar-none -mx-4 flex snap-x gap-6 overflow-x-auto px-4 pb-4">
                {items.map((n) => (
                  <div key={n.slug} className="w-40 shrink-0 snap-start sm:w-48">
                    <NovelCard novel={n} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
