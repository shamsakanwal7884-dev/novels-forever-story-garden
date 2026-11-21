import { ClientOnly, createFileRoute, Link, notFound } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getNovel } from "@/lib/catalog";

// pdf.js is browser-only, so the reader loads after the page is in the browser.
const BookReader = lazy(() => import("@/components/reader/BookReader"));

export const Route = createFileRoute("/read/$slug")({
  loader: ({ params }) => {
    const novel = getNovel(params.slug);
    if (!novel) throw notFound();
    return { slug: novel.slug, seo: { name: novel.name, author: novel.author } };
  },
  head: ({ loaderData }) => {
    const n = loaderData?.seo;
    const title = n ? `Read ${n.name}${n.author ? ` by ${n.author}` : ""} — Novels Forever` : "Read — Novels Forever";
    const desc = n ? `Read ${n.name} as a book on Novels Forever, online or offline.` : "Read Urdu novels as a book.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "book" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Book not found</h1>
      <Link to="/pdfs" className="mt-4 inline-block text-primary underline">Back to the PDF library</Link>
    </div>
  ),
  component: ReadPage,
});

function ReaderLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

function ReadPage() {
  const { slug } = Route.useLoaderData();
  const novel = getNovel(slug);
  if (!novel) throw notFound();
  return (
    <div className="bg-night fixed inset-0 z-50">
      <ClientOnly fallback={<ReaderLoading />}>
        <Suspense fallback={<ReaderLoading />}>
          <BookReader slug={slug} title={novel.name} author={novel.author ?? undefined} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
