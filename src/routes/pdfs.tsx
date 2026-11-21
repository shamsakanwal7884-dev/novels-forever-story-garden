import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Download, FileSearch, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/site/NovelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { byViews, coverOf, findPdfLink, getNovel, searchNovels } from "@/lib/catalog";
import { bumpStat, pdfListQuery, pdfUrl } from "@/lib/community";

export const Route = createFileRoute("/pdfs")({
  head: () => ({
    meta: [
      { title: "Novel PDF Library — Novels Forever" },
      { name: "description", content: "Read or download Urdu novel PDFs, or find any novel PDF on Google in one tap." },
      { property: "og:title", content: "Novel PDF Library — Novels Forever" },
      { property: "og:description", content: "Read, download or find Urdu novel PDFs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PdfsPage,
});

function PdfsPage() {
  const qc = useQueryClient();
  const { data: pdfs, isLoading } = useQuery(pdfListQuery());
  const [q, setQ] = useState("");
  const found = q.trim() ? searchNovels(q, byViews).slice(0, 12) : [];

  const open = async (slug: string, download: boolean) => {
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
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="Read anywhere" title="PDF library" />

      <section aria-label="Uploaded PDFs">
        {isLoading ? (
          <p className="text-muted-foreground">Loading PDFs…</p>
        ) : pdfs && pdfs.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {pdfs.map((p) => {
              const n = getNovel(p.novel_slug);
              return (
                <li key={p.novel_slug} className="flex gap-4 rounded-2xl border border-border bg-card-grad p-4">
                  {n && <img src={coverOf(n)} alt="" loading="lazy" className="h-24 w-32 shrink-0 rounded object-cover" />}
                  <div className="min-w-0 flex-1">
                    {n ? (
                      <Link to="/novels/$slug" params={{ slug: n.slug }} className="font-display text-xl hover:text-primary">{n.name}</Link>
                    ) : (
                      <p className="font-display text-xl">{p.novel_slug}</p>
                    )}
                    {n?.author && <p className="text-sm text-muted-foreground">by {n.author}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="gold" onClick={() => void open(p.novel_slug, false)}><BookOpen /> Read</Button>
                      <Button size="sm" variant="glass" onClick={() => void open(p.novel_slug, true)}><Download /> Download</Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-border bg-card-grad p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 text-muted-foreground">No PDFs uploaded yet. Search below to find any novel's PDF on Google.</p>
          </div>
        )}
      </section>

      <section className="mt-16" aria-label="Find a PDF">
        <h2 className="font-display text-3xl font-semibold">Find any novel PDF</h2>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a novel or writer name…" aria-label="Find a novel PDF" className="mt-4 h-12 max-w-xl" />
        {found.length > 0 && (
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {found.map((n) => (
              <li key={n.slug} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{n.name}</span>
                  {n.author && <span className="block truncate text-xs text-muted-foreground">{n.author}</span>}
                </span>
                <Button asChild size="sm" variant="glass">
                  <a href={findPdfLink(n)} target="_blank" rel="noreferrer"><FileSearch /> Find PDF</a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
