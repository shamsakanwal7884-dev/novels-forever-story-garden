import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BookOpen, Download, ExternalLink, Eye, FileSearch, MessageSquareReply, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  coverOf, episodeThumb, findPdfLink, formatDuration, formatViews, getCategory, getNovel, youtubePlaylistLink,
} from "@/lib/catalog";
import { embedUrlFor, isTeraboxId, watchUrlFor } from "@/lib/video";
import { addReview, bumpStat, pdfQuery, pdfUrl, ratingQuery, reviewsQuery, statsQuery } from "@/lib/community";
import { openLogin, useReaderName } from "@/lib/reader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/novels/$slug")({
  loader: ({ params }) => {
    const novel = getNovel(params.slug);
    if (!novel) throw notFound();
    return {
      slug: novel.slug,
      seo: { name: novel.name, author: novel.author, eps: novel.eps.length, cover: coverOf(novel) },
    };
  },
  // Built from loader data so titles also work for novels the admin added.
  head: ({ loaderData }) => {
    const seo = loaderData?.seo;
    const n = seo ? { name: seo.name, author: seo.author, eps: { length: seo.eps } } : undefined;
    const title = n ? `${n.name}${n.author ? ` by ${n.author}` : ""} — Novels Forever` : "Novel — Novels Forever";
    const desc = n
      ? `Listen to ${n.name}${n.author ? ` by ${n.author}` : ""}: ${n.eps.length} audio episode(s) on Novels Forever. Reviews, ratings and PDF.`
      : "Urdu audio novel on Novels Forever.";
    const img = seo?.cover?.startsWith("https://") ? seo.cover : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Novel not found</h1>
      <Link to="/novels" className="mt-4 inline-block text-primary underline">Back to all novels</Link>
    </div>
  ),
  component: NovelPage,
});

function NovelPage() {
  const { slug } = Route.useLoaderData();
  const novel = getNovel(slug);
  if (!novel) throw notFound();
  const [current, setCurrent] = useState(0);
  const ep = novel.eps[current] ?? novel.eps[0];
  const qc = useQueryClient();
  const { data: stats } = useQuery(statsQuery(slug));
  const { data: rating } = useQuery(ratingQuery(slug));
  const { data: pdf } = useQuery(pdfQuery(slug));

  useEffect(() => {
    setCurrent(0);
    void bumpStat(slug, "view").then(() => qc.invalidateQueries({ queryKey: ["novel-stats", slug] }));
  }, [slug, qc]);

  const openPdf = async (download: boolean) => {
    if (!pdf) return;
    try {
      const url = await pdfUrl(slug, download);
      void bumpStat(slug, download ? "pdf_download" : "pdf_read").then(() =>
        qc.invalidateQueries({ queryKey: ["novel-stats", slug] }),
      );
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Could not open the PDF. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="gold-frame aspect-video overflow-hidden rounded-xl bg-ink">
            {ep && (
              <iframe
                key={ep.id}
                src={embedUrlFor(ep.id)}
                title={ep.t}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="h-full w-full"
              />
            )}
          </div>
          <div className="mt-6">
            <div className="flex flex-wrap gap-2">
              {novel.cats.filter((c) => getCategory(c)).map((c) => (
                <Link key={c} to="/novels" search={{ category: c }} className="rounded-full border border-border px-3 py-1 text-xs text-primary hover:border-primary">
                  {getCategory(c)?.name ?? c}
                </Link>
              ))}
            </div>
            {novel.urdu && <p className="font-urdu mt-4 text-2xl text-primary">{novel.urdu}</p>}
            <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">{novel.name}</h1>
            {novel.author && (
              <p className="mt-2 text-muted-foreground">
                by{" "}
                {novel.authorSlug ? (
                  <Link to="/authors/$slug" params={{ slug: novel.authorSlug }} className="text-foreground hover:text-primary">{novel.author}</Link>
                ) : novel.author}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {formatViews(novel.views)} YouTube views</span>
              <span>{formatViews(stats?.views ?? 0)} site visits</span>
              <span>{formatDuration(novel.duration)}</span>
              <span className="flex items-center gap-2"><Stars value={rating?.avg ?? 0} /> {rating?.count ? `${rating.avg.toFixed(1)} (${rating.count})` : "No ratings yet"}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {ep && isTeraboxId(ep.id) ? (
                <Button asChild variant="glass">
                  <a href={watchUrlFor(ep.id)} target="_blank" rel="noreferrer"><ExternalLink /> Open on TeraBox</a>
                </Button>
              ) : ep ? (
                <Button asChild variant="youtube">
                  <a href={novel.playlist ? youtubePlaylistLink(novel.playlist) : watchUrlFor(ep.id)} target="_blank" rel="noreferrer"><Youtube /> Watch on YouTube</a>
                </Button>
              ) : null}
            </div>
          </div>

          <section className="mt-10 rounded-2xl border border-border bg-card-grad p-6" aria-label="PDF">
            <h2 className="font-display text-2xl">Novel PDF</h2>
            {pdf ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatViews(stats?.pdf_reads ?? 0)} reads · {formatViews(stats?.pdf_downloads ?? 0)} downloads
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="gold" onClick={() => void openPdf(false)}><BookOpen /> Read PDF</Button>
                  <Button variant="glass" onClick={() => void openPdf(true)}><Download /> Download PDF</Button>
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No PDF uploaded here yet. Find it on Google:</p>
            )}
            <Button asChild variant="glass" className="mt-4">
              <a href={findPdfLink(novel)} target="_blank" rel="noreferrer"><FileSearch /> Find PDF on Google</a>
            </Button>
          </section>

          <Reviews slug={slug} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-2xl">{novel.eps.length > 1 ? `${novel.eps.length} episodes` : "Complete novel"}</h2>
          <ol className="scrollbar-none mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {novel.eps.map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "flex w-full cursor-pointer gap-3 rounded-lg border p-2 text-left transition-colors",
                    i === current ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  <img src={episodeThumb(e, novel)} alt="" loading="lazy" className="h-14 w-24 shrink-0 rounded object-cover" />
                  <span className="min-w-0">
                    <span className="block text-xs text-primary">{e.ep ? `Episode ${e.ep}` : `Part ${i + 1}`} · {formatDuration(e.d)}</span>
                    <span className="line-clamp-2 text-sm">{e.t}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function Reviews({ slug }: { slug: string }) {
  const name = useReaderName();
  const qc = useQueryClient();
  const { data: reviews } = useQuery(reviewsQuery(slug));
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      openLogin();
      return;
    }
    if (!stars) {
      toast.error("Please choose a star rating.");
      return;
    }
    setBusy(true);
    try {
      await addReview({ slug, name, rating: stars, comment });
      setStars(0);
      setComment("");
      toast.success("Thank you for your review!");
      await qc.invalidateQueries({ queryKey: ["reviews"] });
      await qc.invalidateQueries({ queryKey: ["novel-rating", slug] });
    } catch {
      toast.error("Could not save your review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10" aria-label="Reviews">
      <h2 className="font-display text-3xl">Reviews</h2>
      <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl border border-border bg-card-grad p-6">
        <p className="text-sm text-muted-foreground">{name ? `Reviewing as ${name}` : "Login with your name to post a review."}</p>
        <Stars value={stars} onChange={setStars} size="lg" />
        <Textarea value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} placeholder="What did you love about this novel?" />
        <Button type="submit" variant="gold" disabled={busy}>{name ? "Post review" : "Login to review"}</Button>
      </form>
      <ul className="mt-6 space-y-4">
        {(reviews ?? []).map((r) => (
          <li key={r.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.name}</span>
              <Stars value={r.rating} />
            </div>
            {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
            {r.reply && (
              <div className="mt-3 rounded-lg border-l-2 border-primary bg-primary/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-primary"><MessageSquareReply className="h-3.5 w-3.5" /> Reply from Novels Forever</p>
                <p className="mt-1 text-sm">{r.reply}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
