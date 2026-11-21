import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { NovelGrid, SectionHeading } from "@/components/site/NovelCard";
import { Input } from "@/components/ui/input";
import { byRecent, byViews, categories, getCategory, searchNovels } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type NovelsSearch = {
  category?: string | undefined;
  q?: string | undefined;
  sort?: "popular" | "latest" | undefined;
};

export const Route = createFileRoute("/novels/")({
  validateSearch: (s: Record<string, unknown>): NovelsSearch => {
    const out: NovelsSearch = {};
    if (typeof s["category"] === "string") out.category = s["category"];
    if (typeof s["q"] === "string" && s["q"]) out.q = s["q"];
    if (s["sort"] === "latest" || s["sort"] === "popular") out.sort = s["sort"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "All Novels by Category — Novels Forever" },
      { name: "description", content: "Browse every Novels Forever Urdu audio novel by category, search by name or writer." },
      { property: "og:title", content: "All Novels by Category — Novels Forever" },
      { property: "og:description", content: "Browse every Novels Forever Urdu audio novel by category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NovelsPage,
});

function NovelsPage() {
  const { category, q, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/novels/" });
  let list = sort === "latest" ? byRecent : byViews;
  if (category) list = list.filter((n) => n.cats.includes(category));
  list = searchNovels(q ?? "", list);
  const cat = category ? getCategory(category) : undefined;

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary",
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="The library" title={cat ? cat.name : "All novels"}>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            defaultValue={q ?? ""}
            placeholder="Search novel or writer…"
            aria-label="Search novels"
            className="h-11 pl-10"
            onChange={(e) => void navigate({ search: (p) => ({ ...p, q: e.target.value || undefined }), replace: true })}
          />
        </div>
      </SectionHeading>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/novels" search={(p) => ({ ...p, category: undefined })} className={chip(!category)}>All</Link>
        {categories.map((c) => (
          <Link key={c.slug} to="/novels" search={(p) => ({ ...p, category: c.slug })} className={chip(category === c.slug)}>
            {c.name} <span className="opacity-70">({c.count})</span>
          </Link>
        ))}
      </div>
      <div className="mb-10 flex gap-2">
        <Link to="/novels" search={(p) => ({ ...p, sort: undefined })} className={chip(sort !== "latest")}>Most popular</Link>
        <Link to="/novels" search={(p) => ({ ...p, sort: "latest" })} className={chip(sort === "latest")}>Latest</Link>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{list.length} novels</p>
      {list.length ? <NovelGrid items={list} /> : <p className="text-muted-foreground">No novel found. Try another name.</p>}
    </div>
  );
}
