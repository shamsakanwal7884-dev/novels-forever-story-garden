import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { NovelGrid, SectionHeading } from "@/components/site/NovelCard";
import { getAuthor, novelsOf } from "@/lib/catalog";

export const Route = createFileRoute("/authors/$slug")({
  loader: ({ params }) => {
    const author = getAuthor(params.slug);
    if (!author) throw notFound();
    return { slug: author.slug, seo: { name: author.name, novels: { length: author.novels.length } } };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.seo;
    const title = a ? `${a.name} Novels — Novels Forever` : "Writer — Novels Forever";
    const desc = a
      ? `Listen to all ${a.novels.length} Urdu audio novels by ${a.name} on Novels Forever.`
      : "Urdu novel writer on Novels Forever.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Writer not found</h1>
      <Link to="/authors" className="mt-4 inline-block text-primary underline">Back to all writers</Link>
    </div>
  ),
  component: AuthorPage,
});

function AuthorPage() {
  const { slug } = Route.useLoaderData();
  const author = getAuthor(slug);
  if (!author) return null;
  const list = novelsOf(author.novels).sort((a, b) => b.views - a.views);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Link to="/authors" className="text-sm text-muted-foreground hover:text-primary">← All writers</Link>
      <div className="mt-6 flex items-center gap-5">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gold font-display text-4xl font-bold text-primary-foreground">
          {author.name.charAt(0)}
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Writer</p>
          <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">{author.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{list.length} novels</p>
        </div>
      </div>
      <div className="mt-12">
        <SectionHeading title="Novels" />
        <NovelGrid items={list} />
      </div>
    </div>
  );
}
