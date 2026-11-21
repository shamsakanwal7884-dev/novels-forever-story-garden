import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/site/NovelCard";
import { Input } from "@/components/ui/input";
import { authors } from "@/lib/catalog";

export const Route = createFileRoute("/authors/")({
  head: () => ({
    meta: [
      { title: "Urdu Novel Writers — Novels Forever" },
      { name: "description", content: "Every writer in the Novels Forever audio library, with all of their novels in one place." },
      { property: "og:title", content: "Urdu Novel Writers — Novels Forever" },
      { property: "og:description", content: "Find audio novels by your favourite Urdu writer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthorsPage,
});

function AuthorsPage() {
  const sorted = [...authors].sort((a, b) => b.novels.length - a.novels.length || a.name.localeCompare(b.name));
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = term ? sorted.filter((a) => a.name.toLowerCase().includes(term)) : sorted;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="The pens behind the stories" title="All writers">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search writer…" aria-label="Search writers" className="h-11 pl-10" />
        </div>
      </SectionHeading>
      <p className="mb-6 text-sm text-muted-foreground">{list.length} writers</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {list.map((a) => (
          <Link
            key={a.slug}
            to="/authors/$slug"
            params={{ slug: a.slug }}
            className="group rounded-xl border border-border bg-card-grad p-4 text-center transition-all hover:-translate-y-1 hover:border-primary/50"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold font-display text-2xl font-bold text-primary-foreground">
              {a.name.charAt(0)}
            </span>
            <p className="mt-3 truncate font-display text-lg group-hover:text-primary">{a.name}</p>
            <p className="text-xs text-muted-foreground">{a.novels.length} novels</p>
          </Link>
        ))}
      </div>
      {list.length === 0 && <p className="text-muted-foreground">No writer found. Try another name.</p>}
    </div>
  );
}
