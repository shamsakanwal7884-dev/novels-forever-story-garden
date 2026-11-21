import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ArrowLeft, ArrowRight, CheckCircle2, CloudOff, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bumpStat } from "@/lib/community";
import { loadBook, removeBook, saveBook } from "@/lib/offline-books";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "loading"; progress: number }
  | { kind: "ready" }
  | { kind: "no-pdf" }
  | { kind: "offline-missing" }
  | { kind: "error" };

const pageKey = (slug: string) => `nf-book-page-${slug}`;

/** Urdu books read right-to-left: the next page is to the left. */
export default function BookReader({ slug, title, author }: { slug: string; title: string; author?: string | undefined }) {
  const [status, setStatus] = useState<Status>({ kind: "loading", progress: 0 });
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(1);
  const [turn, setTurn] = useState<"next" | "prev" | null>(null);
  const [wide, setWide] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const rawRef = useRef<ArrayBuffer | null>(null);

  // Load the book: from this device if saved, otherwise download and keep a copy.
  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const worker = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const res = await loadBook(slug, (p) => !cancelled && setStatus({ kind: "loading", progress: p }));
        if (cancelled) return;
        if (res.kind !== "ok") return setStatus({ kind: res.kind });
        rawRef.current = res.data.slice(0);
        setSaved(res.saved);
        if (!res.fromDevice) void bumpStat(slug, "pdf_read");
        const task = pdfjs.getDocument({ data: new Uint8Array(res.data) });
        loadingTask = task;
        const loaded = await task.promise;
        if (cancelled) return;
        const last = Number(window.localStorage.getItem(pageKey(slug)) ?? 1);
        setPage(Math.min(Math.max(1, last || 1), loaded.numPages));
        setDoc(loaded);
        setStatus({ kind: "ready" });
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [slug]);

  // Two-page spread on large screens, one page on phones.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [status.kind]);

  const total = doc?.numPages ?? 0;
  const step = wide ? 2 : 1;
  const start = wide && page > 1 && page % 2 === 0 ? page : wide && page % 2 === 1 && page > 1 ? page - 1 : page;
  // Wide spreads: [1] cover alone, then [2,3], [4,5]...
  const spread = wide ? (start === 1 ? [1] : [start, start + 1].filter((n) => n <= total)) : [page];

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (!total) return;
      setTurn(dir);
      setPage((p) => {
        let n: number;
        if (wide) {
          const s = p === 1 ? 1 : p % 2 === 0 ? p : p - 1;
          n = dir === "next" ? (s === 1 ? 2 : s + step) : s === 2 ? 1 : s - step;
        } else n = dir === "next" ? p + 1 : p - 1;
        n = Math.min(Math.max(1, n), total);
        window.localStorage.setItem(pageKey(slug), String(n));
        return n;
      });
    },
    [total, wide, step, slug],
  );

  const jump = (n: number) => {
    const v = Math.min(Math.max(1, n), total);
    setTurn(null);
    setPage(v);
    window.localStorage.setItem(pageKey(slug), String(v));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go("next");
      if (e.key === "ArrowRight") go("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touchX.current = e.touches[0]?.clientX ?? null);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 50) return;
    go(dx > 0 ? "next" : "prev"); // swipe right = next page (right-to-left book)
  };

  const toggleSaved = async () => {
    if (saved) {
      await removeBook(slug);
      setSaved(false);
      toast.success("Removed from this device.");
    } else if (rawRef.current) {
      const ok = await saveBook(slug, rawRef.current);
      setSaved(ok);
      ok ? toast.success("Saved — this book now opens without internet.") : toast.error("Not enough space on this device.");
    }
  };

  const pageW = wide && spread.length === 2 ? box.w / 2 : box.w;
  const atEnd = wide ? (spread[spread.length - 1] ?? total) >= total : page >= total;

  return (
    <div className="flex h-full flex-col">
      <header className="glass flex items-center gap-3 border-b border-border px-3 py-2 sm:px-5">
        <Button asChild variant="ghost" size="icon" aria-label="Close book">
          <Link to="/novels/$slug" params={{ slug }}><X /></Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight">{title}</p>
          {author && <p className="truncate text-xs text-muted-foreground">{author}</p>}
        </div>
        {status.kind === "ready" && (
          <Button variant={saved ? "glass" : "gold"} size="sm" onClick={() => void toggleSaved()}>
            {saved ? <><CheckCircle2 /> <span className="hidden sm:inline">Saved offline</span><Trash2 className="sm:hidden" /></> : <><CloudOff /> Save offline</>}
          </Button>
        )}
      </header>

      <div className="relative flex-1 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {status.kind === "ready" && doc ? (
          <div ref={stageRef} className="absolute inset-3 sm:inset-6">
            <div
              key={spread.join("-")}
              dir="rtl"
              className={cn(
                "perspective flex h-full w-full items-center justify-center",
                turn === "next" && "animate-page-next",
                turn === "prev" && "animate-page-prev",
              )}
            >
              {box.w > 0 &&
                spread.map((n) => <PageCanvas key={n} doc={doc} num={n} maxW={pageW} maxH={box.h} />)}
            </div>
          </div>
        ) : (
          <ReaderState status={status} slug={slug} />
        )}
      </div>

      {status.kind === "ready" && total > 0 && (
        <footer className="glass flex items-center gap-3 border-t border-border px-3 py-3 sm:px-5">
          <Button variant="gold" size="sm" onClick={() => go("next")} disabled={atEnd} aria-label="Next page">
            <ArrowLeft /> Next
          </Button>
          <input
            type="range"
            dir="rtl"
            min={1}
            max={total}
            value={page}
            onChange={(e) => jump(Number(e.target.value))}
            aria-label="Go to page"
            className="h-1 flex-1 cursor-pointer accent-primary"
          />
          <span className="w-24 shrink-0 text-center text-xs text-muted-foreground tabular-nums">
            {spread.join("–")} / {total}
          </span>
          <Button variant="glass" size="sm" onClick={() => go("prev")} disabled={page <= 1} aria-label="Previous page">
            Back <ArrowRight />
          </Button>
        </footer>
      )}
    </div>
  );
}

function PageCanvas({ doc, num, maxW, maxH }: { doc: PDFDocumentProxy; num: number; maxW: number; maxH: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let task: RenderTask | null = null;
    let cancelled = false;
    (async () => {
      const pg = await doc.getPage(num);
      if (cancelled) return;
      const base = pg.getViewport({ scale: 1 });
      const scale = Math.min(maxW / base.width, maxH / base.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = pg.getViewport({ scale: scale * dpr });
      const canvas = ref.current;
      if (!canvas) return;
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      setSize({ w: Math.floor(base.width * scale), h: Math.floor(base.height * scale) });
      task = pg.render({ canvas, viewport: vp });
      await task.promise.catch(() => {});
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, num, maxW, maxH]);

  return (
    <canvas
      ref={ref}
      aria-label={`Page ${num}`}
      className="book-page bg-parchment shadow-book"
      style={size ? { width: size.w, height: size.h } : undefined}
    />
  );
}

function ReaderState({ status, slug }: { status: Status; slug: string }) {
  const body = (() => {
    switch (status.kind) {
      case "loading":
        return (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 font-display text-2xl">Opening the book…</p>
            {status.progress > 0 && <p className="mt-1 text-sm text-muted-foreground">{status.progress}%</p>}
          </>
        );
      case "no-pdf":
        return (
          <>
            <p className="font-display text-2xl">No PDF for this novel yet</p>
            <p className="mt-2 text-sm text-muted-foreground">The owner hasn't uploaded this book.</p>
          </>
        );
      case "offline-missing":
        return (
          <>
            <CloudOff className="h-10 w-10 text-primary" />
            <p className="mt-4 font-display text-2xl">You're offline</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              This book isn't saved on this device yet. Open it once with internet and it will be kept for offline reading.
            </p>
          </>
        );
      default:
        return (
          <>
            <p className="font-display text-2xl">The book didn't open</p>
            <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="gold" className="mt-4" onClick={() => window.location.reload()}>Try again</Button>
          </>
        );
    }
  })();
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      {body}
      {status.kind !== "loading" && (
        <Button asChild variant="glass" className="mt-6">
          <Link to="/novels/$slug" params={{ slug }}>Back to the novel</Link>
        </Button>
      )}
    </div>
  );
}
