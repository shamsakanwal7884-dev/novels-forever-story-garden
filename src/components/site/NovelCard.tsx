import { Link } from "@tanstack/react-router";
import { Eye, Headphones, ListVideo } from "lucide-react";
import { type Novel, coverOf, formatViews, getCategory } from "@/lib/catalog";

export function NovelCard({ novel, rank }: { novel: Novel; rank?: number }) {
  const cat = novel.cats[0] ? getCategory(novel.cats[0]) : undefined;
  return (
    <Link
      to="/novels/$slug"
      params={{ slug: novel.slug }}
      className="group block perspective"
      aria-label={`${novel.name}${novel.author ? ` by ${novel.author}` : ""}`}
    >
      <div className="book3d relative mx-auto aspect-[3/4] w-full">
        <div className="book3d__back" />
        <div className="book3d__pages" />
        <div className="book3d__cover bg-leather">
          <img
            src={coverOf(novel)}
            alt=""
            loading="lazy"
            className="h-full w-full scale-[1.35] object-cover transition-transform duration-700 group-hover:scale-[1.45]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          {rank !== undefined && (
            <span className="absolute left-2 top-2 rounded-sm bg-gold px-2 py-0.5 font-display text-lg font-bold text-primary-foreground">
              #{rank}
            </span>
          )}
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-sm bg-ink/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
            {novel.format === "series" ? <ListVideo className="h-3 w-3" /> : <Headphones className="h-3 w-3" />}
            {novel.format === "series" ? `${novel.eps.length} eps` : "Complete"}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-3">
            {novel.urdu && <p className="font-urdu text-right text-sm text-primary">{novel.urdu}</p>}
            <h3 className="line-clamp-2 font-display text-lg font-semibold leading-tight text-foreground">
              {novel.name}
            </h3>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1 px-1">
        <p className="truncate text-sm text-muted-foreground">{novel.author ?? "Novels Forever"}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {formatViews(novel.views)}
          </span>
          {cat && <span className="truncate text-primary/80">{cat.name.split(" ")[0]}</span>}
        </div>
      </div>
    </Link>
  );
}

export function NovelGrid({ items, ranked }: { items: Novel[]; ranked?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((n, i) => (
        <NovelCard key={n.slug} novel={n} {...(ranked ? { rank: i + 1 } : {})} />
      ))}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">{eyebrow}</p>
        )}
        <h2 className="mt-2 font-display text-4xl font-semibold text-foreground md:text-5xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}
