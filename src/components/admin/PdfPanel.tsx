import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminPdfListQuery, removeNovelPdf, uploadNovelPdf } from "@/lib/admin";
import { byViews, searchNovels } from "@/lib/catalog";

export function PdfPanel() {
  const qc = useQueryClient();
  const { data: pdfs } = useQuery(adminPdfListQuery());
  const [q, setQ] = useState("");
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const list = searchNovels(q, byViews).slice(0, 30);
  const pdfMap = new Map((pdfs ?? []).map((p) => [p.novel_slug, p]));

  const run = async (slug: string, fn: () => Promise<void>, ok: string) => {
    setBusySlug(slug);
    try {
      await fn();
      toast.success(ok);
      await qc.invalidateQueries({ queryKey: ["novel-pdf"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-3xl">PDF uploads</h2>
        <p className="text-sm text-muted-foreground">{pdfMap.size} novels have a PDF. Files up to 50 MB.</p>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search novel…" aria-label="Search novel" className="h-11" />
      <ul className="space-y-3">
        {list.map((n) => {
          const pdf = pdfMap.get(n.slug);
          return (
            <li key={n.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
              <span className="min-w-0">
                <span className="block font-medium">{n.name}</span>
                <span className="block text-xs text-muted-foreground">{pdf ? "PDF uploaded" : "No PDF yet"}{n.author ? ` · ${n.author}` : ""}</span>
              </span>
              <span className="flex gap-2">
                <label className="cursor-pointer rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  {busySlug === n.slug ? "Working…" : pdf ? "Replace PDF" : "Upload PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={busySlug !== null}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void run(n.slug, () => uploadNovelPdf(n.slug, f), "PDF uploaded."); }}
                  />
                </label>
                {pdf && (
                  <Button size="sm" variant="glass" disabled={busySlug !== null} onClick={() => void run(n.slug, () => removeNovelPdf(n.slug, pdf.file_path), "PDF removed.")}>Remove</Button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
