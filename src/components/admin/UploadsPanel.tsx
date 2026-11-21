import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Plus, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddPartDialog, NewSeriesDialog, type SeriesDraft, type VideoDraft } from "@/components/admin/VideoDialogs";
import { byViews, channel, getNovel, isKnownVideo, suggestFromTitle, thumb } from "@/lib/catalog";
import { checkChannelVideos } from "@/lib/youtube.functions";
import type { FeedVideo } from "@/lib/youtube";

/** Latest uploads on the YouTube channel, with one-click adding to the site. */
export function UploadsPanel({ onChanged }: { onChanged: () => Promise<void> }) {
  const check = useServerFn(checkChannelVideos);
  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["admin", "channel-uploads"],
    queryFn: () => check({ data: { channelId: channel.id } }),
    staleTime: 60_000,
  });
  const [part, setPart] = useState<Partial<VideoDraft> | null>(null);
  const [series, setSeries] = useState<(Partial<SeriesDraft> & { video?: Partial<VideoDraft> }) | null>(null);
  const videos = data?.videos ?? [];
  const fresh = videos.filter((v) => !isKnownVideo(v.id));

  const draftFor = (v: FeedVideo) => {
    const s = suggestFromTitle(v.title, byViews);
    return { s, video: { link: `https://youtu.be/${v.id}`, title: v.title, ep: s.ep ? String(s.ep) : "", season: s.season ? String(s.season) : "", views: v.views, published: v.published } };
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">New uploads on YouTube</h2>
          <p className="text-sm text-muted-foreground">
            Latest videos from {channel.name}. {data?.ok ? `${fresh.length} not on the site yet.` : ""}
          </p>
        </div>
        <Button variant="gold" disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />} Check new uploads
        </Button>
      </div>
      {error || (data && !data.ok) ? (
        <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">YouTube did not answer right now. Try “Check new uploads” again in a minute.</p>
      ) : null}
      {isFetching && !data && <p className="text-sm text-muted-foreground">Checking the channel…</p>}
      <ul className="space-y-3">
        {videos.map((v) => {
          const known = isKnownVideo(v.id);
          const { s, video } = draftFor(v);
          const match = s.novelSlug ? getNovel(s.novelSlug) : undefined;
          return (
            <li key={v.id} className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
              <img src={thumb(v.id, "mq")} alt="" loading="lazy" className="h-20 w-36 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{v.title}</p>
                <p className="text-xs text-muted-foreground">
                  {v.published ? new Date(v.published).toLocaleDateString() : ""}
                  {match ? ` · looks like ${match.name}${s.ep ? `, episode ${s.ep}` : ""}` : " · new novel?"}
                </p>
              </div>
              {known ? (
                <span className="flex items-center gap-1.5 text-xs text-primary"><CheckCircle2 className="h-4 w-4" /> On the site</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="gold" onClick={() => setPart({ ...video, novelSlug: match?.slug ?? "" })}>
                    <Plus /> {match ? `Add to ${match.name}` : "Add to a novel"}
                  </Button>
                  <Button size="sm" variant="glass" onClick={() => setSeries({ name: s.name, author: s.author ?? "", video: { ...video, ep: video.ep || "1" } })}>
                    <Sparkles /> New series
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <AddPartDialog open={part !== null} onOpenChange={(o) => !o && setPart(null)} initial={part ?? {}} onSaved={onChanged} />
      <NewSeriesDialog open={series !== null} onOpenChange={(o) => !o && setSeries(null)} initial={series ?? {}} onSaved={() => onChanged()} />
    </section>
  );
}
