import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import {
  Award, BookOpen, CalendarHeart, Clock3, Crown, Feather, Headphones, Library, Mic, PenLine,
  PlayCircle, Sparkles, Star, Trophy, Users, Youtube,
} from "lucide-react";

import { BrandIcon } from "@/components/nadia/BrandIcon";
import { CountUp, Equalizer, LetterReveal, Reveal, ScrollProgress, Tilt, useInView, usePlayWhenVisible } from "@/components/nadia/motion";
import { Embers } from "@/components/site/Embers";
import { Button } from "@/components/ui/button";
import {
  CHANNEL_OWNER, authors, byViews, categories, channel, coverOf, formatViews, novels, totalNovels, totalVideos,
} from "@/lib/catalog";
import { FALLBACK_CHANNEL_STATS, type ChannelStats } from "@/lib/channel-stats";
import { getChannelStats } from "@/lib/channel-stats.functions";
import { media } from "@/lib/media";
import { NADIA_SOCIALS, type SocialLink } from "@/lib/owner-profile";

const TITLE = "Nadia Nawaz — The Voice of Novels Forever";
const DESCRIPTION =
  "Meet Nadia Nawaz, channel owner and narrator of Novels Forever: subscribers, listeners, hours narrated, achievements and her official Instagram, Facebook, Threads and YouTube.";

export const Route = createFileRoute("/nadia-nawaz")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NadiaPage,
});

const SOCIAL_COLOR: Record<SocialLink["id"], string> = {
  youtube: "var(--youtube)",
  instagram: "var(--instagram)",
  facebook: "var(--facebook)",
  threads: "var(--threads)",
};

const SOCIAL_NOTE: Record<SocialLink["id"], string> = {
  youtube: "New episodes, complete novels and live premieres — every story in her voice.",
  instagram: "Behind the mic, new-release teasers and little moments from the studio.",
  facebook: "Join the reader family, share requests and talk about your favourite novels.",
  threads: "Quick thoughts, polls on the next novel and conversations with listeners.",
};

const compact = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : `${Math.round(n)}`;
const whole = (n: number) => Math.round(n).toLocaleString("en-US");

function yearsSince(iso: string) {
  const start = new Date(iso);
  const now = new Date();
  let y = now.getFullYear() - start.getFullYear();
  if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) y--;
  return Math.max(1, y);
}

function useChannelStats(): ChannelStats {
  const { data } = useQuery({
    queryKey: ["channel-stats"],
    queryFn: () => getChannelStats(),
    placeholderData: FALLBACK_CHANNEL_STATS,
    staleTime: 30 * 60 * 1000,
  });
  return data ?? FALLBACK_CHANNEL_STATS;
}

function NadiaPage() {
  const stats = useChannelStats();
  const totalSeconds = novels.reduce((s, n) => s + n.eps.reduce((a, e) => a + e.d, 0), 0);
  const hours = Math.round(totalSeconds / 3600);
  const complete = novels.filter((n) => n.format === "complete").length;
  const series = novels.length - complete;
  const top = byViews.slice(0, 8);
  const years = yearsSince(stats.joined);
  const joinedLabel = new Date(stats.joined).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="nn-page relative overflow-x-clip">
      <ScrollProgress />
      <Hero stats={stats} />
      <LiveCounters stats={stats} hours={hours} />
      <VoiceInNumbers hours={hours} complete={complete} series={series} />
      <Achievements stats={stats} hours={hours} complete={complete} topViews={top[0]?.views ?? 0} topName={top[0]?.name ?? ""} />
      <Journey stats={stats} years={years} joinedLabel={joinedLabel} complete={complete} series={series} hours={hours} />
      <MostLoved top={top} />
      <Contacts />
      <FinalCall stats={stats} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Six identical wave periods (480 units each) so sliding the strip by half loops seamlessly. */
const WAVE_PATH =
  "M0 60 " +
  Array.from({ length: 6 }, (_, i) => {
    const x = i * 480;
    return `C ${x + 80} 10, ${x + 160} 110, ${x + 240} 60 S ${x + 400} 10, ${x + 480} 60`;
  }).join(" ");

function Hero({ stats }: { stats: ChannelStats }) {
  const orbit = NADIA_SOCIALS.map((s, i) => ({ ...s, angle: (360 / NADIA_SOCIALS.length) * i - 90 }));
  const play = usePlayWhenVisible<HTMLElement>();
  return (
    <section ref={play} className="relative isolate min-h-[92vh] min-h-[92svh] overflow-hidden bg-night">
      <span className="nn-aurora left-[-10%] top-[5%] h-80 w-80" style={{ "--nn-c": "var(--primary)" } as CSSProperties} />
      <span className="nn-aurora right-[-8%] top-[30%] h-96 w-96" style={{ "--d": "-6s", "--nn-c": "var(--leather)" } as CSSProperties} />
      <span className="nn-aurora bottom-[-10%] left-[30%] h-72 w-72" style={{ "--d": "-11s", "--nn-c": "var(--accent)" } as CSSProperties} />
      <Embers />
      <div aria-hidden className="nn-stars pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }, (_, i) => (
          <Star
            key={i}
            className="nn-twinkle absolute h-2.5 w-2.5 fill-primary text-primary"
            style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 90}%`, "--d": `${-(i % 7) * 0.45}s` } as CSSProperties}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-ink/50 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-primary">
            <Mic className="h-3.5 w-3.5" /> Channel owner &amp; narrator
          </p>
          <h1 className="mt-6 font-display text-6xl font-semibold leading-[0.95] sm:text-7xl lg:text-8xl">
            <LetterReveal text="Nadia" className="block text-foreground" start={200} />
            <LetterReveal text="Nawaz" className="block" letterClassName="text-gold" start={550} />
          </h1>
          <p className="intro-title mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0" style={{ animationDelay: "1.3s" }}>
            The voice behind every story on <span className="text-foreground">Novels Forever</span> — turning Urdu novels
            into hours of heartfelt listening for readers around the world.
          </p>
          <Equalizer bars={40} className="nn-eq-trim mx-auto mt-8 h-12 max-w-md lg:mx-0" />
          <div className="intro-title mt-8 flex flex-wrap justify-center gap-3 lg:justify-start" style={{ animationDelay: "1.7s" }}>
            <Button asChild variant="youtube" size="xl" className="nn-shine">
              <a href={`${channel.url}?sub_confirmation=1`} target="_blank" rel="noreferrer">
                <Youtube /> Subscribe · {compact(stats.subscribers)}
              </a>
            </Button>
            <Button asChild variant="glass" size="xl">
              <a href="#contacts"><Sparkles /> Follow Nadia</a>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-[min(88vw,30rem)]">
          <svg aria-hidden viewBox="0 0 400 400" className="nn-spin absolute inset-0 h-full w-full text-primary/50">
            <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 10" />
          </svg>
          <svg aria-hidden viewBox="0 0 400 400" className="nn-spin-rev absolute inset-[8%] h-[84%] w-[84%] text-primary/70">
            <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="60 30 4 30" />
          </svg>
          <div className="absolute inset-[22%]">
            {[0, 1.5, 3].map((d) => (
              <span key={d} className="nn-ripple" style={{ "--d": `${d}s` } as CSSProperties} />
            ))}
            <div className="nn-float-slow relative h-full w-full overflow-hidden rounded-full shadow-glow ring-4 ring-primary/70 ring-offset-4 ring-offset-background">
              <img src={media.narrator} alt={`${CHANNEL_OWNER.name}, narrator of Novels Forever`} className="h-full w-full object-cover" />
            </div>
            <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary/50 bg-card px-3 py-1 text-xs font-semibold text-primary shadow-gold">
              <span className="nn-pulse-dot h-2 w-2 rounded-full bg-whatsapp" /> On air
            </span>
          </div>
          <div className="nn-orbit">
            {orbit.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${s.label} ${s.handle}`}
                className="nn-orbit-item -ml-6 -mt-6"
                style={{ "--a": `${s.angle}deg`, "--r": "min(44vw, 14.5rem)" } as CSSProperties}
              >
                <span
                  className="nn-orbit-upright flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-card shadow-gold transition-transform hover:scale-125"
                  style={{ color: SOCIAL_COLOR[s.id] }}
                >
                  <BrandIcon id={s.id} className="h-5 w-5" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden">
        <div className="nn-wave-flow h-full w-[200%]">
          <svg viewBox="0 0 2880 120" preserveAspectRatio="none" className="h-full w-full text-primary/60">
            <path
              className="nn-wave-path"
              pathLength={1}
              d={WAVE_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function LiveCounters({ stats, hours }: { stats: ChannelStats; hours: number }) {
  const items = [
    { icon: Users, value: stats.subscribers, label: "Subscribers", sub: "people who never miss a story", fmt: compact, ring: 0.82 },
    { icon: Headphones, value: stats.views, label: "Total listens", sub: "plays across the channel", fmt: compact, ring: 0.94 },
    { icon: PlayCircle, value: stats.videos, label: "Videos uploaded", sub: "episodes & complete novels", fmt: whole, ring: 0.76 },
    { icon: Clock3, value: hours, label: "Hours of narration", sub: "of her voice in the library", fmt: (n: number) => `${whole(n)}+`, ring: 0.88 },
  ];
  const play = usePlayWhenVisible<HTMLElement>();
  return (
    <section ref={play} className="relative mx-auto -mt-10 max-w-7xl px-4 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={i * 120}>
            <Tilt className="h-full">
              <div className="nn-glow-card h-full" style={{ "--nn-c": "var(--primary)" } as CSSProperties}>
                <div className="nn-glow-inner flex items-center gap-4 p-5">
                  <RingIcon icon={it.icon} fill={it.ring} delay={i * 150} />
                  <div className="min-w-0">
                    <p className="font-display text-4xl font-semibold leading-none text-gold">
                      <CountUp value={it.value} format={it.fmt} />
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{it.label}</p>
                    <p className="text-xs text-muted-foreground">{it.sub}</p>
                  </div>
                </div>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className={stats.live ? "nn-pulse-dot h-2 w-2 rounded-full bg-whatsapp" : "h-2 w-2 rounded-full bg-muted-foreground"} />
        {stats.live ? "Live numbers from YouTube" : "Latest known numbers from YouTube"}
      </p>
    </section>
  );
}

function RingIcon({ icon: Icon, fill, delay }: { icon: typeof Users; fill: number; delay: number }) {
  const { ref, shown } = useInView<HTMLSpanElement>(0.4);
  const c = 2 * Math.PI * 26;
  return (
    <span ref={ref} className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="30" cy="30" r="26" fill="none" className="stroke-border" strokeWidth="3" />
        <circle
          cx="30" cy="30" r="26" fill="none" className="nn-ring-draw stroke-primary" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: shown ? c * (1 - fill) : c, "--d": `${delay}ms` } as CSSProperties}
        />
      </svg>
      <Icon className="h-6 w-6 text-primary" />
    </span>
  );
}

/* ------------------------------------------------------------------ */

function VoiceInNumbers({ hours, complete, series }: { hours: number; complete: number; series: number }) {
  const days = Math.round(hours / 24);
  const cells = [
    { icon: Library, value: totalNovels, label: "Novels narrated", fmt: whole },
    { icon: BookOpen, value: totalVideos, label: "Episodes in the library", fmt: whole },
    { icon: Feather, value: complete, label: "Complete novels", fmt: whole },
    { icon: Sparkles, value: series, label: "Episode series", fmt: whole },
    { icon: PenLine, value: authors.length, label: "Writers given a voice", fmt: whole },
    { icon: Crown, value: categories.length, label: "Genres & moods", fmt: whole },
  ];
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <Reveal className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Her voice, in numbers</p>
        <h2 className="mt-3 font-display text-4xl font-semibold sm:text-6xl">
          <span className="text-gold">{whole(hours)}</span> hours of stories
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          That is about <span className="text-foreground">{days} days</span> of non-stop narration — every line read,
          every character voiced, every chapter recorded by Nadia herself.
        </p>
      </Reveal>
      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3">
        {cells.map((c, i) => (
          <Reveal key={c.label} delay={i * 90} from={i % 2 ? "right" : "left"}>
            <div className="nn-card-lift group gold-frame relative overflow-hidden rounded-2xl bg-card-grad p-6">
              <c.icon className="nn-icon-pop h-8 w-8 text-primary" />
              <p className="mt-5 font-display text-5xl font-semibold text-gold sm:text-6xl">
                <CountUp value={c.value} format={c.fmt} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
              <c.icon aria-hidden className="absolute -bottom-6 -right-6 h-28 w-28 text-primary/5" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** Rounds down to two significant digits: 1547 → 1500, 35700 → 35000, 12646283 → 12000000. */
function floorNice(n: number) {
  if (n < 100) return Math.floor(n);
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.floor(n / p) * p;
}

function Achievements({
  stats, hours, complete, topViews, topName,
}: { stats: ChannelStats; hours: number; complete: number; topViews: number; topName: string }) {
  const medals = [
    { icon: Trophy, title: `${compact(floorNice(stats.views))}+ Listens`, text: `More than ${compact(floorNice(stats.views))} plays of Nadia's narrations on YouTube.` },
    { icon: Users, title: `${compact(floorNice(stats.subscribers))}+ Family`, text: "Subscribers who come back for every new episode." },
    { icon: PlayCircle, title: `${whole(floorNice(stats.videos))}+ Videos`, text: "Episodes and complete novels uploaded so far." },
    { icon: Clock3, title: `${whole(floorNice(hours))}+ Hours`, text: "Of recorded narration, all in one voice." },
    { icon: Feather, title: `${whole(floorNice(complete))}+ Complete Novels`, text: "Full novels, start to finish, ready to listen." },
    { icon: Award, title: `${compact(topViews)} on one novel`, text: `${topName} — her most-loved narration so far.` },
  ];
  const play = usePlayWhenVisible<HTMLElement>();
  return (
    <section ref={play} className="relative bg-night py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/80">The trophy shelf</p>
          <h2 className="mt-3 font-display text-4xl font-semibold sm:text-6xl">Achievements so far</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {medals.map((m, i) => (
            <Reveal key={m.title} delay={i * 110}>
              <div className="group flex items-start gap-5 rounded-2xl border border-border bg-ink/40 p-6 transition-colors hover:border-primary/50">
                <span
                  className="nn-medal nn-shine relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gold text-primary-foreground shadow-gold"
                  style={{ "--d": `${i * 140}ms` } as CSSProperties}
                >
                  <m.icon className="h-9 w-9" />
                  <span className="absolute inset-1.5 rounded-full border border-primary-foreground/30" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-gold">{m.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Journey({
  stats, years, joinedLabel, complete, series, hours,
}: { stats: ChannelStats; years: number; joinedLabel: string; complete: number; series: number; hours: number }) {
  const steps = [
    { icon: CalendarHeart, tag: joinedLabel, title: "Novels Forever is born", text: `Nadia opens the channel on YouTube from ${stats.country} with one dream: let everyone hear Urdu novels.` },
    { icon: Mic, tag: "The voice", title: "One narrator, every character", text: "Heroes, villains, mothers, lovers — all voiced by Nadia, with feeling in every line." },
    { icon: Feather, tag: `${whole(complete)} novels`, title: "Complete novels, start to finish", text: "Whole books released as one long video, so listeners can lose themselves for hours." },
    { icon: BookOpen, tag: `${whole(series)} series`, title: "Long-running episode series", text: "Stories released part by part, keeping the family waiting for every next episode." },
    { icon: Clock3, tag: `${whole(hours)}+ hours`, title: "A library of her voice", text: `${whole(totalNovels)} novels by ${whole(authors.length)} writers, all in one place.` },
    { icon: Sparkles, tag: `${years} years on`, title: "And the story continues", text: `${compact(stats.subscribers)} subscribers and ${compact(stats.views)} listens later, new stories keep arriving.` },
  ];
  return (
    <section className="relative mx-auto max-w-5xl px-4 py-24 sm:px-6">
      <Reveal className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">The journey</p>
        <h2 className="mt-3 font-display text-4xl font-semibold sm:text-6xl">From one voice to a library</h2>
      </Reveal>
      <JourneyLine steps={steps} />
    </section>
  );
}

function JourneyLine({ steps }: { steps: { icon: typeof Users; tag: string; title: string; text: string }[] }) {
  return (
    <Reveal className="relative mt-16">
      <span aria-hidden className="nn-line absolute bottom-0 left-6 top-0 w-0.5 bg-gold md:left-1/2 md:-ml-px" />
      <ol className="space-y-12">
        {steps.map((s, i) => (
          <Reveal as="li" key={s.title} delay={i * 120} from={i % 2 ? "right" : "left"} className="relative md:grid md:grid-cols-2 md:gap-12">
            <span className="absolute left-6 top-2 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-glow md:left-1/2">
              <s.icon className="h-5 w-5" />
            </span>
            <div className={i % 2 ? "pl-16 md:col-start-2 md:pl-10" : "pl-16 md:pl-0 md:pr-10 md:text-right"}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{s.tag}</p>
              <h3 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */

function MostLoved({ top }: { top: typeof byViews }) {
  const loop = [...top, ...top];
  const play = usePlayWhenVisible<HTMLElement>();
  return (
    <section ref={play} className="relative overflow-hidden bg-night py-24">
      <Reveal className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Listeners' favourites</p>
        <h2 className="mt-3 font-display text-4xl font-semibold sm:text-6xl">Her most-loved narrations</h2>
      </Reveal>
      <div className="shelf-mask mt-14">
        <div className="shelf-track flex w-max gap-6 px-6">
          {loop.map((n, i) => (
            <Link
              key={`${n.slug}-${i}`}
              to="/novels/$slug"
              params={{ slug: n.slug }}
              className="group relative block w-44 shrink-0 sm:w-56"
              aria-hidden={i >= top.length}
              tabIndex={i >= top.length ? -1 : undefined}
            >
              <div className="nn-card-lift relative aspect-video overflow-hidden rounded-xl border border-border shadow-book sm:aspect-[4/3]">
                <img src={coverOf(n)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gold font-display text-lg font-bold text-primary-foreground shadow-gold">
                  {(i % top.length) + 1}
                </span>
              </div>
              <p className="mt-3 truncate font-display text-xl font-semibold group-hover:text-primary">{n.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Headphones className="h-3.5 w-3.5 text-primary" /> {formatViews(n.views)} listens
                {n.author ? <span className="truncate">· {n.author}</span> : null}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Contacts() {
  const play = usePlayWhenVisible<HTMLElement>();
  return (
    <section ref={play} id="contacts" className="relative mx-auto max-w-7xl scroll-mt-28 px-4 py-24 sm:px-6">
      <Reveal className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Official contacts</p>
        <h2 className="mt-3 font-display text-4xl font-semibold sm:text-6xl">Stay close to Nadia</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          These are Nadia Nawaz's only official pages. Follow, say hello and be the first to hear what's next.
        </p>
      </Reveal>
      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {NADIA_SOCIALS.map((s, i) => (
          <Reveal key={s.id} delay={i * 130} from={i % 2 ? "right" : "left"}>
            <Tilt>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="nn-glow-card group block"
                style={{ "--nn-c": SOCIAL_COLOR[s.id] } as CSSProperties}
              >
                <div className="nn-glow-inner relative flex items-center gap-5 overflow-hidden p-6 sm:p-8">
                  <span
                    className="nn-icon-pop relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-ink/60"
                    style={{ color: SOCIAL_COLOR[s.id] }}
                  >
                    <span className="nn-ripple rounded-2xl" style={{ borderColor: SOCIAL_COLOR[s.id] }} />
                    <BrandIcon id={s.id} className="h-10 w-10" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{s.label}</p>
                    <p className="truncate font-display text-3xl font-semibold text-foreground">{s.handle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{SOCIAL_NOTE[s.id]}</p>
                  </div>
                  <span className="nn-shine hidden shrink-0 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold sm:inline-flex">
                    {s.cta}
                  </span>
                  <BrandIcon id={s.id} className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 opacity-5" />
                </div>
              </a>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FinalCall({ stats }: { stats: ChannelStats }) {
  const play = usePlayWhenVisible<HTMLElement>();
  return (
    <section ref={play} className="relative isolate overflow-hidden bg-night py-24">
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2">
        <span className="nn-aurora inset-0" style={{ "--nn-c": "var(--primary)" } as CSSProperties} />
      </span>
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Equalizer bars={28} className="mx-auto h-14 max-w-xs" />
        <h2 className="mt-8 font-display text-4xl font-semibold sm:text-6xl">
          Join <span className="text-gold">{compact(stats.subscribers)}</span> listeners
        </h2>
        <p className="mt-4 text-muted-foreground">
          Subscribe to Novels Forever and turn on the bell — the next story in Nadia's voice is already on its way.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="youtube" size="xl" className="nn-shine">
            <a href={`${channel.url}?sub_confirmation=1`} target="_blank" rel="noreferrer"><Youtube /> Subscribe on YouTube</a>
          </Button>
          <Button asChild variant="gold" size="xl">
            <Link to="/novels"><Headphones /> Start listening</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
