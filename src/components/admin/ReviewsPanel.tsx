import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquareReply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, StatCard } from "@/components/admin/fields";
import { allReviewsQuery, deleteReview } from "@/lib/admin";
import { replyToReview } from "@/lib/admin-catalog";
import { getNovel } from "@/lib/catalog";

type Review = Awaited<ReturnType<NonNullable<ReturnType<typeof allReviewsQuery>["queryFn"]>>>[number];

export function ReviewsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(allReviewsQuery());
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const reviews = data ?? [];

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
    const waiting = reviews.filter((r) => !r.reply).length;
    return { total, avg, dist, waiting };
  }, [reviews]);

  const list = reviews.filter((r) => {
    if (filter === "waiting" && r.reply) return false;
    if (filter === "replied" && !r.reply) return false;
    if (/^[1-5]$/.test(filter) && r.rating !== Number(filter)) return false;
    const term = q.trim().toLowerCase();
    if (!term) return true;
    const novel = getNovel(r.novel_slug)?.name ?? r.novel_slug;
    return `${novel} ${r.name} ${r.comment}`.toLowerCase().includes(term);
  });

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["reviews"] });
    await qc.invalidateQueries({ queryKey: ["novel-rating"] });
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-3xl">Reviews & ratings</h2>
        <p className="text-sm text-muted-foreground">Reply to readers — your reply appears under their review on the novel page.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Reviews" value={stats.total} />
        <StatCard label="Average rating" value={stats.total ? stats.avg.toFixed(1) : "—"} hint="out of 5" />
        <StatCard label="Waiting for reply" value={stats.waiting} />
        <div className="rounded-xl border border-border bg-card-grad p-4">
          {stats.dist.map((d) => (
            <div key={d.star} className="flex items-center gap-2 text-xs">
              <span className="w-3">{d.star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gold" style={{ width: `${stats.total ? (d.count / stats.total) * 100 : 0}%` }} />
              </div>
              <span className="w-6 text-right text-muted-foreground">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search novel, reader or comment…" aria-label="Search reviews" />
        <NativeSelect value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-52" aria-label="Filter reviews">
          <option value="all">All reviews</option>
          <option value="waiting">Waiting for reply</option>
          <option value="replied">Replied</option>
          {[5, 4, 3, 2, 1].map((s) => <option key={s} value={String(s)}>{s} stars</option>)}
        </NativeSelect>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading reviews…</p>}
      {!isLoading && list.length === 0 && <p className="text-sm text-muted-foreground">No reviews here yet.</p>}
      <ul className="space-y-3">
        {list.map((r) => <ReviewItem key={r.id} review={r} onChanged={refresh} />)}
      </ul>
    </section>
  );
}

function ReviewItem({ review: r, onChanged }: { review: Review; onChanged: () => Promise<void> }) {
  const [text, setText] = useState(r.reply ?? "");
  const [editing, setEditing] = useState(!r.reply);
  const [busy, setBusy] = useState(false);
  const novel = getNovel(r.novel_slug);

  const act = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-xl border border-border bg-card-grad p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{r.name} <span className="text-xs text-muted-foreground">· {new Date(r.created_at).toLocaleDateString()}</span></p>
          {novel ? (
            <Link to="/novels/$slug" params={{ slug: novel.slug }} className="text-xs text-primary hover:underline">{novel.name}</Link>
          ) : <span className="text-xs text-muted-foreground">{r.novel_slug}</span>}
        </div>
        <Stars value={r.rating} />
      </div>
      {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
      {editing ? (
        <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; void act(() => replyToReview(r.id, text), "Reply posted.").then(() => setEditing(false)); }}>
          <Textarea value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Write your reply to this reader…" aria-label="Reply" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" type="submit" variant="gold" disabled={busy || !text.trim()}>{busy ? <Loader2 className="animate-spin" /> : <MessageSquareReply />} {r.reply ? "Update reply" : "Post reply"}</Button>
            {r.reply && <Button size="sm" type="button" variant="glass" onClick={() => { setText(r.reply ?? ""); setEditing(false); }}>Cancel</Button>}
          </div>
        </form>
      ) : (
        <div className="mt-3 rounded-lg border-l-2 border-primary bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Your reply</p>
          <p className="mt-1 text-sm">{r.reply}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="glass" onClick={() => setEditing(true)}>Edit</Button>
            <Button size="sm" variant="glass" disabled={busy} onClick={() => void act(() => replyToReview(r.id, null), "Reply removed.").then(() => { setText(""); setEditing(true); })}>Remove reply</Button>
          </div>
        </div>
      )}
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="glass" disabled={busy} onClick={() => { if (window.confirm("Delete this review?")) void act(() => deleteReview(r.id), "Review deleted."); }}>
          <Trash2 /> Delete review
        </Button>
      </div>
    </li>
  );
}
