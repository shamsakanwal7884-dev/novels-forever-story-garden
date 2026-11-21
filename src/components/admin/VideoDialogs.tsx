import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { HardDrive, Loader2, Play, Search, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CategoryPicker, Field, NativeSelect } from "@/components/admin/fields";
import {
  adminNovelList,
  isNovelSlugTaken,
  nextEpisodeNumber,
  saveNovel,
  saveVideo,
  uniqueSlug,
} from "@/lib/admin-catalog";
import { getCatalogOverridesSnapshot, isKnownVideo, novels } from "@/lib/catalog";
import { lookupTerabox, lookupVideo } from "@/lib/youtube.functions";
import { embedUrlFor, parseVideoLink, titleFromFileName } from "@/lib/video";
import { cn } from "@/lib/utils";

export type VideoDraft = {
  link: string;
  novelSlug: string;
  title: string;
  ep: string;
  season: string;
  thumbUrl: string;
  duration: number;
  views: number;
  published: string | null;
};

const emptyDraft = (p: Partial<VideoDraft> = {}): VideoDraft => ({
  link: "", novelSlug: "", title: "", ep: "", season: "", thumbUrl: "", duration: 0, views: 0, published: null, ...p,
});

const toNum = (v: string) => (v.trim() === "" ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);

/** Reads a pasted YouTube or TeraBox link and fills title, length and views when possible. */
function useLookup() {
  const ytLookup = useServerFn(lookupVideo);
  const tbLookup = useServerFn(lookupTerabox);
  const [busy, setBusy] = useState(false);
  const run = async (link: string): Promise<Partial<VideoDraft> | null> => {
    const parsed = parseVideoLink(link);
    if (!parsed) {
      toast.error("This is not a YouTube or TeraBox video link.");
      return null;
    }
    setBusy(true);
    try {
      if (parsed.source === "youtube") {
        const d = await ytLookup({ data: { input: parsed.id } });
        if (!d?.title) toast.message("Could not read the title from YouTube — please type it.");
        return { title: d?.title ?? "", duration: d?.duration ?? 0, views: d?.views ?? 0, published: d?.published ?? null };
      }
      const d = await tbLookup({ data: { surl: parsed.surl } });
      if (!d.found) toast.message("TeraBox did not share the file name — please type the title.");
      return { title: d.title ? titleFromFileName(d.title) : "" };
    } catch {
      toast.error("Could not read the video details. You can still type them.");
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { run, busy };
}

type VideoSource = "youtube" | "terabox";

const SOURCE_INFO: Record<VideoSource, { label: string; placeholder: string; hint: string }> = {
  youtube: { label: "YouTube", placeholder: "https://youtu.be/… or https://www.youtube.com/watch?v=…", hint: "Paste the YouTube video link." },
  terabox: { label: "TeraBox", placeholder: "https://1024terabox.com/s/… or https://terabox.com/s/…", hint: "Paste the TeraBox share link of one video file." },
};

function LinkField({ draft, set, lookup }: { draft: VideoDraft; set: (p: Partial<VideoDraft>) => void; lookup: ReturnType<typeof useLookup> }) {
  const parsed = parseVideoLink(draft.link);
  const [pick, setPick] = useState<VideoSource>(parsed?.source ?? "youtube");
  const [preview, setPreview] = useState(false);
  // A pasted link always decides the source, so the right player is used.
  useEffect(() => {
    if (parsed && parsed.source !== pick) setPick(parsed.source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed?.source]);
  useEffect(() => setPreview(false), [parsed?.id]);

  const fetchDetails = async () => {
    const res = await lookup.run(draft.link);
    if (res) set({ ...res, title: res.title || draft.title });
  };
  const info = SOURCE_INFO[pick];
  const wrongSource = draft.link.trim() !== "" && !parsed;
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Video from</div>
      <div role="radiogroup" aria-label="Video source" className="grid grid-cols-2 gap-2">
        {(Object.keys(SOURCE_INFO) as VideoSource[]).map((src) => (
          <button
            key={src}
            type="button"
            role="radio"
            aria-checked={pick === src}
            onClick={() => {
              setPick(src);
              if (parsed && parsed.source !== src) set({ link: "" });
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
              pick === src ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50",
            )}
          >
            {src === "youtube" ? <Youtube className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />} {SOURCE_INFO[src].label}
          </button>
        ))}
      </div>
      <Field
        label={`${info.label} link`}
        hint={
          parsed
            ? `${parsed.source === "youtube" ? "YouTube" : "TeraBox"} video detected — it will play on the novel page${isKnownVideo(parsed.id) ? " · already on the site (saving moves/updates it)" : ""}`
            : wrongSource
              ? `This is not a ${info.label} video link.`
              : info.hint
        }
      >
        <div className="flex gap-2">
          <Input value={draft.link} onChange={(e) => set({ link: e.target.value })} placeholder={info.placeholder} aria-label="Video link" />
          <Button type="button" variant="glass" disabled={!parsed || lookup.busy} onClick={() => void fetchDetails()}>
            {lookup.busy ? <Loader2 className="animate-spin" /> : <Search />} Fetch
          </Button>
        </div>
      </Field>
      {parsed && (
        <div className="space-y-2">
          <Button type="button" variant="glass" size="sm" onClick={() => setPreview((v) => !v)}>
            <Play /> {preview ? "Hide preview" : "Preview video"}
          </Button>
          {preview && (
            <div className="aspect-video overflow-hidden rounded-lg border border-border bg-ink">
              <iframe
                key={parsed.id}
                src={embedUrlFor(parsed.id)}
                title="Video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PartFields({ draft, set }: { draft: VideoDraft; set: (p: Partial<VideoDraft>) => void }) {
  const isTb = parseVideoLink(draft.link)?.source === "terabox";
  return (
    <>
      <Field label="Part title">
        <Input value={draft.title} maxLength={300} onChange={(e) => set({ title: e.target.value })} placeholder="Novel name | Episode 5 | Writer" aria-label="Part title" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Episode number">
          <Input type="number" min={0} max={10000} value={draft.ep} onChange={(e) => set({ ep: e.target.value })} aria-label="Episode number" />
        </Field>
        <Field label="Season (optional)">
          <Input type="number" min={0} max={100} value={draft.season} onChange={(e) => set({ season: e.target.value })} aria-label="Season" />
        </Field>
      </div>
      {isTb && (
        <Field label="Cover picture link (optional)" hint="TeraBox has no lasting thumbnails; leave empty to use the novel's cover.">
          <Input value={draft.thumbUrl} onChange={(e) => set({ thumbUrl: e.target.value })} placeholder="https://…" aria-label="Cover picture link" />
        </Field>
      )}
    </>
  );
}

async function persistPart(draft: VideoDraft, novelSlug: string) {
  const parsed = parseVideoLink(draft.link);
  if (!parsed) throw new Error("Add a valid YouTube or TeraBox link.");
  if (!draft.title.trim()) throw new Error("Please add a title for this part.");
  if (draft.thumbUrl.trim() && !/^https:\/\//.test(draft.thumbUrl.trim())) throw new Error("The cover picture link must start with https://");
  const existing = getCatalogOverridesSnapshot().videos.find((v) => v.video_id === parsed.id);
  await saveVideo({
    video_id: parsed.id,
    novel_slug: novelSlug,
    title: draft.title,
    ep: toNum(draft.ep),
    season: toNum(draft.season),
    source: parsed.source,
    share_url: parsed.shareUrl,
    thumb_url: parsed.source === "terabox" ? draft.thumbUrl || null : null,
    duration_sec: draft.duration || existing?.duration_sec || 0,
    views: draft.views || existing?.views || 0,
    published_at: draft.published ?? existing?.published_at ?? new Date().toISOString(),
    hidden: false,
  });
}

/* ------------------------------ Add a part ------------------------------ */

export function AddPartDialog({
  open, onOpenChange, initial, onSaved, title = "Add a new part",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Partial<VideoDraft>;
  onSaved: () => Promise<void>;
  title?: string;
}) {
  const [draft, setDraft] = useState(emptyDraft(initial));
  const [busy, setBusy] = useState(false);
  const lookup = useLookup();
  const set = (p: Partial<VideoDraft>) => setDraft((d) => ({ ...d, ...p }));
  const options = useMemo(() => adminNovelList(novels).sort((a, b) => a.name.localeCompare(b.name)), [open]);

  useEffect(() => {
    if (!open) return;
    const d = emptyDraft(initial);
    if (!d.ep && d.novelSlug) d.ep = String(nextEpisodeNumber(options.find((n) => n.slug === d.novelSlug)));
    setDraft(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    if (!draft.novelSlug) { toast.error("Choose the novel this part belongs to."); return; }
    setBusy(true);
    try {
      await persistPart(draft, draft.novelSlug);
      await onSaved();
      toast.success("Part saved — it is now on the novel page.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the part.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card-grad gold-frame max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">{title}</DialogTitle>
          <DialogDescription>Add a YouTube or TeraBox video as a new episode of an existing novel.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <LinkField draft={draft} set={set} lookup={lookup} />
          <Field label="Novel">
            <NativeSelect
              value={draft.novelSlug}
              aria-label="Novel"
              onChange={(e) => {
                const slug = e.target.value;
                set({ novelSlug: slug, ep: String(nextEpisodeNumber(options.find((n) => n.slug === slug))) });
              }}
            >
              <option value="">Choose a novel…</option>
              {options.map((n) => (
                <option key={n.slug} value={n.slug}>
                  {n.name}{n.author ? ` — ${n.author}` : ""} ({n.eps.length} parts{n.status !== "live" ? `, ${n.status}` : ""})
                </option>
              ))}
            </NativeSelect>
          </Field>
          <PartFields draft={draft} set={set} />
        </div>
        <DialogFooter>
          <Button variant="glass" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="gold" disabled={busy} onClick={() => void save()}>{busy && <Loader2 className="animate-spin" />} Save part</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------- New series ---------------------------- */

export type SeriesDraft = {
  name: string; urdu: string; author: string; subtitle: string; cats: string[]; format: "series" | "complete"; playlist: string;
};

export function NewSeriesDialog({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Partial<SeriesDraft> & { video?: Partial<VideoDraft> };
  onSaved: (slug: string) => Promise<void>;
}) {
  const blank: SeriesDraft = { name: "", urdu: "", author: "", subtitle: "", cats: [], format: "series", playlist: "" };
  const [series, setSeries] = useState<SeriesDraft>({ ...blank, ...initial });
  const [video, setVideo] = useState(emptyDraft({ ep: "1", ...initial.video }));
  const [busy, setBusy] = useState(false);
  const lookup = useLookup();
  const setS = (p: Partial<SeriesDraft>) => setSeries((d) => ({ ...d, ...p }));
  const setV = (p: Partial<VideoDraft>) => setVideo((d) => ({ ...d, ...p }));

  useEffect(() => {
    if (!open) return;
    setSeries({ ...blank, ...initial });
    setVideo(emptyDraft({ ep: "1", ...initial.video }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    if (!series.name.trim()) { toast.error("Please write the novel name."); return; }
    if (series.cats.length === 0) { toast.error("Choose at least one category."); return; }
    if (!parseVideoLink(video.link)) { toast.error("Add the first episode's YouTube or TeraBox link."); return; }
    const playlist = /[?&]list=([A-Za-z0-9_-]{10,64})/.exec(series.playlist)?.[1] ?? (/^[A-Za-z0-9_-]{10,64}$/.test(series.playlist.trim()) ? series.playlist.trim() : null);
    if (series.playlist.trim() && !playlist) { toast.error("The playlist link is not a YouTube playlist."); return; }
    setBusy(true);
    try {
      const slug = uniqueSlug(series.name, isNovelSlugTaken);
      await saveNovel({
        slug, name: series.name, urdu: series.urdu, subtitle: series.subtitle, author: series.author,
        cats: series.cats, format: series.format, playlist, hidden: false,
      });
      await persistPart(video, slug);
      await onSaved(slug);
      toast.success(`“${series.name.trim()}” is now on the site.`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the series.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card-grad gold-frame max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Create a new series</DialogTitle>
          <DialogDescription>A brand-new novel with its first episode. Add more parts later from “Novels”.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Novel name"><Input value={series.name} maxLength={200} onChange={(e) => setS({ name: e.target.value })} aria-label="Novel name" /></Field>
          <Field label="Urdu name (optional)"><Input dir="rtl" className="font-urdu" value={series.urdu} maxLength={200} onChange={(e) => setS({ urdu: e.target.value })} aria-label="Urdu name" /></Field>
          <Field label="Writer"><Input value={series.author} maxLength={120} onChange={(e) => setS({ author: e.target.value })} aria-label="Writer" /></Field>
          <Field label="Type">
            <NativeSelect value={series.format} onChange={(e) => setS({ format: e.target.value === "complete" ? "complete" : "series" })} aria-label="Type">
              <option value="series">Series (many episodes)</option>
              <option value="complete">Complete novel (one video)</option>
            </NativeSelect>
          </Field>
          <Field label="Short line (optional)" className="sm:col-span-2"><Input value={series.subtitle} maxLength={300} onChange={(e) => setS({ subtitle: e.target.value })} aria-label="Short line" /></Field>
          <Field label="YouTube playlist link (optional)" className="sm:col-span-2"><Input value={series.playlist} onChange={(e) => setS({ playlist: e.target.value })} placeholder="https://www.youtube.com/playlist?list=…" aria-label="Playlist link" /></Field>
          <Field label="Categories" className="sm:col-span-2"><CategoryPicker value={series.cats} onChange={(cats) => setS({ cats })} /></Field>
        </div>
        <div className="mt-2 space-y-4 rounded-xl border border-border p-4">
          <p className="font-display text-xl">First episode</p>
          <LinkField draft={video} set={setV} lookup={lookup} />
          <PartFields draft={video} set={setV} />
        </div>
        <DialogFooter>
          <Button variant="glass" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="gold" disabled={busy} onClick={() => void save()}>{busy && <Loader2 className="animate-spin" />} Create series</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
