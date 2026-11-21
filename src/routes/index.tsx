import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, FileText, Headphones, MessageSquareText, Mic, Search, Users, Youtube } from "lucide-react";

import { Embers } from "@/components/site/Embers";
import { InstallAppPopup } from "@/components/site/InstallAppPopup";
import { NovelCard, NovelGrid, SectionHeading } from "@/components/site/NovelCard";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CHANNEL_OWNER,
  authors,
  byRecent,
  byViews,
  categories,
  channel,
  coverOf,
  formatViews,
  getNovel,
  novelsInCategory,
  totalNovels,
  totalVideos,
  totalViews,
} from "@/lib/catalog";
import { latestReviewsQuery } from "@/lib/community";
import { media } from "@/lib/media";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Novels Forever — Urdu Audio Novels by Category & Author" },
      {
        name: "description",
        content: `Listen to ${totalNovels} Urdu audio novels and ${totalVideos} episodes from the Novels Forever channel: Nikkah, rude hero, romantic, cousin and more.`,
      },
      { property: "og:title", content: "Novels Forever — Urdu Audio Novel Library" },
      {
        property: "og:description",
        content: "Every Novels Forever audio novel in one magical library, by category, author and playlist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const CAT_ICONS = ["💍", "🔥", "🌹", "👪", "🗡️", "😄", "🎓", "🏰", "💼", "🏫", "✨", "💔", "🕌"];

function Home() {
  const top = byViews.slice(0, 10);
  const ring = byViews.slice(0, 12);
  const latest = byRecent.slice(0, 10);
  const topAuthors = [...authors].sort((a, b) => b.novels.length - a.novels.length).slice(0, 12);

  return (
    <>
      <InstallAppPopup />
      <Hero />

      {/* 3D ring */}
      <section className="relative overflow-hidden py-14 md:py-20" aria-label="Most popular novels">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">The golden shelf</p>
          <h2 className="mt-2 font-display text-4xl font-semibold md:text-5xl">Most loved by readers</h2>
        </div>
        {/* Phones: a light scrolling shelf that stays smooth on every device */}
        <div className="shelf-mask relative mt-10 overflow-hidden md:hidden">
          <div className="shelf-track flex w-max gap-4 pr-4">
            {[...ring, ...ring].map((n, i) => (
              <Link
                key={`${n.slug}-${i}`}
                to="/novels/$slug"
                params={{ slug: n.slug }}
                aria-hidden={i >= ring.length || undefined}
                tabIndex={i >= ring.length ? -1 : undefined}
                className="relative block h-48 w-32 shrink-0 overflow-hidden rounded-md border border-primary/30 bg-leather shadow-book"
              >
                <img src={coverOf(n)} alt="" loading="lazy" className="h-full w-full scale-[1.35] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-2.5 font-display text-sm leading-tight">{n.name}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="ring-stage relative mx-auto mt-14 hidden h-[300px] w-full [--ring-r:300px] md:block md:h-[340px] md:[--ring-r:480px]">
          <div className="ring absolute left-1/2 top-0 h-[240px] w-[150px] -translate-x-1/2 md:h-[280px] md:w-[180px]">
            {ring.map((n, i) => (
              <Link
                key={n.slug}
                to="/novels/$slug"
                params={{ slug: n.slug }}
                className="backface-hidden absolute inset-0 overflow-hidden rounded-md border border-primary/30 bg-leather shadow-book"
                style={{ transform: `rotateY(${i * 30}deg) translateZ(var(--ring-r))` }}
              >
                <img src={coverOf(n)} alt="" loading="lazy" className="h-full w-full scale-[1.35] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3 font-display text-base leading-tight">
                  {n.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Browse by mood" title="Novel categories">
          <Button asChild variant="glass">
            <Link to="/novels">
              All {totalNovels} novels <ArrowRight />
            </Link>
          </Button>
        </SectionHeading>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((c, i) => {
            const sample = novelsInCategory(c.slug)[0];
            return (
              <Link
                key={c.slug}
                to="/novels"
                search={{ category: c.slug }}
                className="group relative min-h-36 overflow-hidden rounded-xl border border-border bg-card-grad p-4 sm:p-5 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-gold"
              >
                {sample && (
                  <img
                    src={coverOf(sample)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-15 transition-opacity duration-500 group-hover:opacity-30"
                  />
                )}
                <div className="relative flex h-full min-h-28 flex-col justify-between gap-3">
                  <span className="text-2xl" aria-hidden>
                    {CAT_ICONS[i] ?? "📖"}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold leading-tight sm:text-xl">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.count} novels</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top 10 */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Top 10" title="Most listened novels" />
        <NovelGrid items={top} ranked />
      </section>

      {/* Latest */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Fresh ink" title="Latest uploads">
          <Button asChild variant="glass">
            <Link to="/novels" search={{ sort: "latest" }}>
              See all latest <ArrowRight />
            </Link>
          </Button>
        </SectionHeading>
        <div className="scrollbar-none -mx-4 flex snap-x gap-6 overflow-x-auto px-4 pb-4">
          {latest.map((n) => (
            <div key={n.slug} className="w-40 shrink-0 snap-start sm:w-48">
              <NovelCard novel={n} />
            </div>
          ))}
        </div>
      </section>

      {/* Authors */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="The pens behind the stories" title="Popular writers">
          <Button asChild variant="glass">
            <Link to="/authors">
              All writers <ArrowRight />
            </Link>
          </Button>
        </SectionHeading>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {topAuthors.map((a) => (
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
      </section>

      {/* Features band */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<MessageSquareText />}
            title="AI librarian"
            text="Ask Kitab for a novel by mood, writer or trope. It knows every novel here."
          />
          <FeatureCard
            icon={<FileText />}
            title="PDF library"
            text="Read or download novel PDFs, or find any PDF on Google in one tap."
            to="/pdfs"
          />
          <FeatureCard
            icon={<Users />}
            title="Reader reviews"
            text="Login with just your name, rate novels and tell others what you loved."
            to="/novels"
          />
        </div>
      </section>

      <LatestReviews />

      {/* YouTube CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="gold-frame relative overflow-hidden rounded-2xl bg-card-grad px-5 py-10 text-center md:p-16">
          <Embers />
          <Youtube className="relative mx-auto h-14 w-14 text-youtube" />
          <h2 className="relative mt-4 font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
            Listen on <span className="text-gold">{channel.name}</span>
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">
            Channel owner & narrator: <span className="font-medium text-foreground">{CHANNEL_OWNER.name}</span> — every story in her voice.
            <br />
            New episodes arrive on YouTube first. Subscribe and turn on the bell.
          </p>
          <Button asChild variant="youtube" size="xl" className="relative mt-8">
            <a href={`${channel.url}?sub_confirmation=1`} target="_blank" rel="noreferrer">
              <Youtube /> Visit our YouTube channel
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const featured = byViews.slice(0, 3);

  return (
    <section className="relative isolate overflow-hidden">
      <img src={media.hero} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <Embers />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-24 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-ink/40 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-primary">
            <Headphones className="h-3.5 w-3.5" /> Urdu audio novels
          </p>
          <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            Every story,
            <br />
            <span className="text-gold animate-shine">one magical library</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            All {totalNovels} novels from the Novels Forever channel, neatly arranged by category,
            writer and playlist. Press play and lose yourself in the story.
          </p>
          <form
            className="mt-8 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({ to: "/novels", search: { q: q.trim() || undefined } });
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search novel or writer…"
                aria-label="Search novels"
                className="h-12 bg-ink/60 pl-10 text-base"
              />
            </div>
            <Button type="submit" variant="gold" size="xl" className="px-5 sm:px-7">
              Search
            </Button>
          </form>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-2.5 sm:mt-10 sm:gap-4">
            <Stat value={String(totalNovels)} label="Novels" />
            <Stat value={totalVideos.toLocaleString()} label="Episodes" />
            <Stat value={formatViews(totalViews)} label="Listens" />
          </div>
          <NarratorCard />
        </div>

        {/* Phones & tablets: fanned book stack (transform-only animation, smooth on older phones) */}
        <div className="relative mx-auto h-60 w-full max-w-xs lg:hidden" aria-hidden>
          {featured.map((n, i) => {
            const pos = [
              { x: "-58%", r: -10, top: "18%", z: 1 },
              { x: "-50%", r: 0, top: "0%", z: 3 },
              { x: "-42%", r: 10, top: "18%", z: 1 },
            ][i];
            if (!pos) return null;
            return (
              <Link
                key={n.slug}
                to="/novels/$slug"
                params={{ slug: n.slug }}
                tabIndex={-1}
                className="absolute left-1/2 w-32 sm:w-36"
                style={{
                  top: pos.top,
                  zIndex: pos.z,
                  transform: `translateX(calc(${pos.x} + ${(i - 1) * 70}%)) rotate(${pos.r}deg)`,
                }}
              >
                <div className={i === 1 ? "animate-float" : "animate-float-slow"} style={{ animationDelay: `${i * -2}s` }}>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[4px_8px_8px_4px] border border-primary/30 bg-leather shadow-book">
                    <img src={coverOf(n)} alt="" className="h-full w-full scale-[1.35] object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-2.5 font-display text-sm leading-tight">{n.name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
          <div className="absolute inset-x-6 bottom-0 h-8 rounded-full bg-glow-radial" />
        </div>

        <div className="perspective relative mx-auto hidden h-[460px] w-full max-w-md lg:block" aria-hidden>
          {featured.map((n, i) => (
            <Link
              key={n.slug}
              to="/novels/$slug"
              params={{ slug: n.slug }}
              tabIndex={-1}
              className="group absolute w-48"
              style={{
                left: `${8 + i * 26}%`,
                top: `${i === 1 ? 0 : 14}%`,
                zIndex: i === 1 ? 3 : 1,
              }}
            >
              <div
                className={i === 1 ? "animate-float" : "animate-float-slow"}
                style={{ animationDelay: `${i * -2}s` }}
              >
                <div className="book3d relative aspect-[3/4] w-full">
                  <div className="book3d__back" />
                  <div className="book3d__pages" />
                  <div className="book3d__cover bg-leather">
                    <img src={coverOf(n)} alt="" className="h-full w-full scale-[1.35] object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-3 font-display text-lg leading-tight">
                      {n.name}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <div className="absolute inset-x-10 bottom-6 h-10 rounded-full bg-primary/20 blur-2xl" />
        </div>
      </div>
    </section>
  );
}

function NarratorCard() {
  return (
    <div className="mt-6 flex max-w-lg items-center gap-4 rounded-2xl border border-primary/30 bg-ink/50 p-3 pr-5 shadow-gold sm:mt-8">
      <span className="relative block h-16 w-16 shrink-0 sm:h-[4.5rem] sm:w-[4.5rem]">
        <img
          src={media.narrator}
          alt={CHANNEL_OWNER.name}
          className="h-full w-full rounded-full object-cover object-center ring-2 ring-primary/60 ring-offset-2 ring-offset-background"
        />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-primary/50 bg-card text-primary">
          <Mic className="h-3.5 w-3.5" />
        </span>
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80">Every story in the voice of</p>
        <p className="truncate font-display text-2xl font-semibold leading-tight text-gold">{CHANNEL_OWNER.name}</p>
        <p className="text-xs text-muted-foreground">{CHANNEL_OWNER.role}</p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-ink/40 p-3 sm:p-4">
      <p className="font-display text-2xl font-semibold text-gold sm:text-3xl">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  to?: "/pdfs" | "/novels";
}) {
  const inner = (
    <>
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold text-primary-foreground [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </span>
      <h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </>
  );
  const cls =
    "block h-full rounded-2xl border border-border bg-card-grad p-7 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-gold";
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function LatestReviews() {
  const { data } = useQuery(latestReviewsQuery());
  if (!data || data.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="From the reading room" title="What readers say" />
      <div className="grid gap-5 md:grid-cols-3">
        {data.map((r) => {
          const novel = getNovel(r.novel_slug);
          return (
            <figure key={r.id} className="rounded-2xl border border-border bg-card-grad p-6">
              <Stars value={r.rating} />
              {r.comment && <blockquote className="mt-3 line-clamp-4 text-sm">“{r.comment}”</blockquote>}
              {r.reply && (
                <p className="mt-3 line-clamp-3 border-l-2 border-primary pl-3 text-xs text-muted-foreground">
                  <span className="text-primary">Novels Forever:</span> {r.reply}
                </p>
              )}
              <figcaption className="mt-4 text-xs text-muted-foreground">
                <span className="text-foreground">{r.name}</span>
                {novel && (
                  <>
                    {" on "}
                    <Link to="/novels/$slug" params={{ slug: novel.slug }} className="text-primary hover:underline">
                      {novel.name}
                    </Link>
                  </>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

