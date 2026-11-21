import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { EyeOff, ExternalLink, Loader2, Pencil, Plus, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CategoryPicker, Field, NativeSelect } from "@/components/admin/fields";
import { AddPartDialog, NewSeriesDialog, type VideoDraft } from "@/components/admin/VideoDialogs";
import {
  adminNovelList,
  findAdminNovel,
  hideVideo,
  nextEpisodeNumber,
  novelToRow,
  resetVideo,
  saveNovel,
  saveVideo,
  type AdminNovel,
} from "@/lib/admin-catalog";
import {
  coverOf,
  episodeThumb,
  formatDuration,
  getBaseVideo,
  getCatalogOverridesSnapshot,
  getCategory,
  novels,
  searchNovels,
} from "@/lib/catalog";
import { isTeraboxId, watchUrlFor } from "@/lib/video";

export function NovelsPanel({ onChanged, version }: { onChanged: () => Promise<void>; version: number }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "hidden">("all");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const all = useMemo(() => adminNovelList(novels), [version]);
  const list = useMemo(() => {
    const matched = searchNovels(q, all) as AdminNovel[];
    const byStatus = filter === "all" ? matched : filter === "live" ? matched.filter((n) => n.status === "live") : matched.filter((n) => n.status !== "live");
    return [...byStatus].sort((a, b) => b.recent - a.recent).slice(0, 60);
  }, [q, filter, all]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">Novels & episodes</h2>
          <p className="text-sm text-muted-foreground">{all.length} novels. Open one to edit details or add a new episode.</p>
        </div>
        <Button variant="gold" onClick={() => setCreating(true)}><Sparkles /> New series</Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search novel, writer or episode…" aria-label="Search novels" className="h-11" />
        <NativeSelect value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-11 sm:w-48" aria-label="Show">
          <option value="all">All novels</option>
          <option value="live">On the site</option>
          <option value="hidden">Hidden / no parts</option>
        </NativeSelect>
      </div>
      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n.slug} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <img src={coverOf(n)} alt="" loading="lazy" className="h-14 w-24 shrink-0 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{n.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {n.author ?? "Unknown writer"} · {n.eps.length} parts · {n.cats.map((c) => getCategory(c)?.name).filter(Boolean).join(", ") || "no category"}
              </p>
            </div>
            {n.status !== "live" && <Badge variant="outline">{n.status === "hidden" ? "Hidden" : "No parts"}</Badge>}
            <Button size="sm" variant="glass" onClick={() => setOpenSlug(n.slug)}><Pencil /> Manage</Button>
          </li>
        ))}
        {list.length === 0 && <li className="text-sm text-muted-foreground">No novels match.</li>}
      </ul>
      <NovelEditor slug={openSlug} onClose={() => setOpenSlug(null)} onChanged={onChanged} version={version} />
      <NewSeriesDialog open={creating} onOpenChange={setCreating} initial={{}} onSaved={async (slug) => { await onChanged(); setOpenSlug(slug); }} />
    </section>
  );
}

function NovelEditor({ slug, onClose, onChanged, version }: { slug: string | null; onClose: () => void; onChanged: () => Promise<void>; version: number }) {
  const novel = useMemo(() => (slug ? findAdminNovel(slug, novels) : null), [slug, version]);
  return (
    <Dialog open={Boolean(slug)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card-grad gold-frame max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        {novel ? <EditorBody key={`${novel.slug}-${version}`} novel={novel} onChanged={onChanged} /> : <p className="text-sm text-muted-foreground">Loading…</p>}
      </DialogContent>
    </Dialog>
  );
}

function EditorBody({ novel, onChanged }: { novel: AdminNovel; onChanged: () => Promise<void> }) {
  const [form, setForm] = useState({
    name: novel.name, urdu: novel.urdu ?? "", author: novel.author ?? "", subtitle: novel.subtitle ?? "",
    cats: novel.cats, format: novel.format, playlist: novel.playlist ?? "", hidden: novel.status === "hidden",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [part, setPart] = useState<Partial<VideoDraft> | null>(null);
  const overrides = getCatalogOverridesSnapshot().videos;
  const hiddenParts = overrides.filter((v) => v.hidden && (v.novel_slug === novel.slug || getBaseVideo(v.video_id)?.slug === novel.slug));
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const run = async (key: string, fn: () => Promise<void>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      await onChanged();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const saveDetails = () => {
    if (!form.name.trim()) { toast.error("The novel needs a name."); return; }
    const playlist = /[?&]list=([A-Za-z0-9_-]{10,64})/.exec(form.playlist)?.[1] ?? (form.playlist.trim() || null);
    if (playlist && !/^[A-Za-z0-9_-]{10,64}$/.test(playlist)) { toast.error("The playlist link is not a YouTube playlist."); return; }
    void run("details", () => saveNovel(novelToRow(novel, { ...form, playlist })), "Novel details saved.");
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-3xl">{novel.name}</DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-3">
          {novel.eps.length} parts · {formatDuration(novel.duration)}
          {novel.status === "live" && (
            <Link to="/novels/$slug" params={{ slug: novel.slug }} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> View on site
            </Link>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Novel name"><Input value={form.name} maxLength={200} onChange={(e) => set({ name: e.target.value })} aria-label="Novel name" /></Field>
        <Field label="Urdu name"><Input dir="rtl" className="font-urdu" value={form.urdu} maxLength={200} onChange={(e) => set({ urdu: e.target.value })} aria-label="Urdu name" /></Field>
        <Field label="Writer"><Input value={form.author} maxLength={120} onChange={(e) => set({ author: e.target.value })} aria-label="Writer" /></Field>
        <Field label="Type">
          <NativeSelect value={form.format} onChange={(e) => set({ format: e.target.value === "complete" ? "complete" : "series" })} aria-label="Type">
            <option value="series">Series</option>
            <option value="complete">Complete novel</option>
          </NativeSelect>
        </Field>
        <Field label="Short line" className="sm:col-span-2"><Input value={form.subtitle} maxLength={300} onChange={(e) => set({ subtitle: e.target.value })} aria-label="Short line" /></Field>
        <Field label="YouTube playlist link" className="sm:col-span-2"><Input value={form.playlist} onChange={(e) => set({ playlist: e.target.value })} aria-label="Playlist link" /></Field>
        <Field label="Categories" className="sm:col-span-2"><CategoryPicker value={form.cats} onChange={(cats) => set({ cats })} /></Field>
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <Switch checked={form.hidden} onCheckedChange={(hidden) => set({ hidden })} aria-label="Hide this novel" />
          Hide this whole novel from the site
        </label>
      </div>
      <div className="flex justify-end">
        <Button variant="gold" disabled={busy !== null} onClick={saveDetails}>{busy === "details" && <Loader2 className="animate-spin" />} Save details</Button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h3 className="font-display text-2xl">Episodes</h3>
        <Button variant="gold" size="sm" onClick={() => setPart({ novelSlug: novel.slug, ep: String(nextEpisodeNumber(novel)) })}><Plus /> Add new part</Button>
      </div>
      <ol className="space-y-2">
        {novel.eps.map((e, i) => {
          const row = overrides.find((v) => v.video_id === e.id);
          return (
            <li key={e.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
              <img src={episodeThumb(e, novel)} alt="" loading="lazy" className="h-12 w-20 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-primary">
                  {e.ep ? `Episode ${e.ep}` : `Part ${i + 1}`}{e.s ? ` · Season ${e.s}` : ""} · {isTeraboxId(e.id) ? "TeraBox" : "YouTube"}
                </p>
                <p className="line-clamp-1 text-sm">{e.t}</p>
              </div>
              <a href={watchUrlFor(e.id)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary" aria-label="Open video"><ExternalLink className="h-4 w-4" /></a>
              <Button
                size="icon-sm"
                variant="glass"
                aria-label="Edit part"
                onClick={() => setPart({
                  link: row?.share_url ?? (isTeraboxId(e.id) ? watchUrlFor(e.id) : `https://youtu.be/${e.id}`),
                  novelSlug: novel.slug, title: e.t, ep: e.ep != null ? String(e.ep) : "", season: e.s != null ? String(e.s) : "",
                  thumbUrl: row?.thumb_url ?? "", duration: e.d, views: e.v, published: row?.published_at ?? null,
                })}
              >
                <Pencil />
              </Button>
              <Button
                size="icon-sm"
                variant="glass"
                aria-label="Hide part"
                disabled={busy !== null}
                onClick={() => { if (window.confirm(`Hide “${e.t}” from the site?`)) void run(e.id, () => hideVideo(row, e.id, novel.slug), "Part hidden."); }}
              >
                <EyeOff />
              </Button>
            </li>
          );
        })}
        {novel.eps.length === 0 && <li className="text-sm text-muted-foreground">No parts yet — add the first episode so the novel shows on the site.</li>}
      </ol>

      {hiddenParts.length > 0 && (
        <div className="mt-2 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Hidden parts</p>
          {hiddenParts.map((v) => (
            <div key={v.video_id} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border p-2 text-sm">
              <span className="line-clamp-1">{v.title}</span>
              <Button
                size="sm"
                variant="glass"
                disabled={busy !== null}
                onClick={() => void run(v.video_id, () => (getBaseVideo(v.video_id) && getBaseVideo(v.video_id)?.slug === v.novel_slug
                  ? resetVideo(v.video_id)
                  : saveVideo({ ...v, source: v.source ?? "youtube", share_url: v.share_url ?? null, hidden: false })), "Part is visible again.")}
              >
                <RotateCcw /> Show again
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddPartDialog
        open={part !== null}
        onOpenChange={(o) => !o && setPart(null)}
        initial={part ?? {}}
        title={part?.title ? "Edit part" : "Add a new part"}
        onSaved={onChanged}
      />
    </>
  );
}
