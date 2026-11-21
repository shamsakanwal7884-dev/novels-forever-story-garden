import { useEffect, useState } from "react";
import { media } from "@/lib/media";

const KEY = "nf-intro-seen";

/** Book-opening intro, shown once per browser session. */
export function IntroOverlay() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    if (seen) {
      setShow(false);
      return;
    }
    const t = window.setTimeout(() => setShow(false), 3800);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      className="intro-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center bg-night"
      onClick={() => setShow(false)}
      role="presentation"
    >
      <div className="intro-book relative h-64 w-48 sm:h-80 sm:w-60">
        <div className="intro-glow absolute -inset-16 rounded-full bg-glow-radial" />
        {/* inner pages */}
        <div className="absolute inset-0 rounded-r-lg bg-parchment shadow-book" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={media.logo} alt="" className="h-28 w-28 sm:h-36 sm:w-36" />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="intro-page absolute inset-0 rounded-r-lg border-l border-parchment-foreground/10 bg-parchment"
            style={{ animationDelay: `${0.9 + i * 0.18}s` }}
          />
        ))}
        {/* cover */}
        <div className="intro-cover gold-frame absolute inset-0 flex flex-col items-center justify-center rounded-r-lg bg-leather shadow-book">
          <img src={media.logo} alt="" className="h-20 w-20 opacity-90" />
          <span className="mt-3 font-display text-2xl text-gold">Novels Forever</span>
        </div>
      </div>
      <h1 className="intro-title mt-10 font-display text-4xl text-gold sm:text-5xl">
        Novels Forever
      </h1>
      <p className="intro-title mt-2 text-sm uppercase tracking-[0.3em] text-muted-foreground">
        Every story, one library
      </p>
    </div>
  );
}
