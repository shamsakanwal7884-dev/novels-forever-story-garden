import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Marks an element data-shown="true" the first time it scrolls into view.
 * Tall blocks count as seen once a quarter of the screen shows them, and if the browser
 * never reports visibility (some in-app browsers), content is shown anyway after 2.5s.
 */
export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    let reported = false;
    const io = new IntersectionObserver(
      (entries) => {
        reported = true;
        const seen = entries.some(
          (e) => e.isIntersecting && (e.intersectionRatio >= threshold || e.intersectionRect.height >= window.innerHeight * 0.25),
        );
        if (seen) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: [0, 0.05, threshold, Math.min(1, threshold * 2)], rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    const failsafe = window.setTimeout(() => {
      if (!reported) {
        setShown(true);
        io.disconnect();
      }
    }, 2500);
    return () => {
      window.clearTimeout(failsafe);
      io.disconnect();
    };
  }, [threshold]);
  return { ref, shown };
}

/**
 * Sets data-play="false" on a section while it is off-screen so the CSS pauses its looping
 * animations; phones then only animate what the visitor can actually see.
 */
export function usePlayWhenVisible<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (e) el.dataset["play"] = e.isIntersecting ? "true" : "false";
      },
      { rootMargin: "150px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      delete el.dataset["play"];
    };
  }, []);
  return ref;
}

export function Reveal({
  children, className, delay = 0, from = "up", as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "up" | "left" | "right";
  as?: "div" | "section" | "li" | "article";
}) {
  const { ref, shown } = useInView<HTMLDivElement>(0.15);
  return (
    <Tag
      ref={ref as never}
      data-shown={shown}
      style={{ "--d": `${delay}ms` } as CSSProperties}
      className={cn("nn-reveal", from === "left" && "nn-reveal-left", from === "right" && "nn-reveal-right", className)}
    >
      {children}
    </Tag>
  );
}

/** Number that counts up from zero once it is on screen (re-renders only when the text changes). */
export function CountUp({ value, format, duration = 2200 }: { value: number; format: (n: number) => string; duration?: number }) {
  const { ref, shown } = useInView<HTMLSpanElement>(0.4);
  const [text, setText] = useState(() => format(0));
  const formatRef = useRef(format);
  formatRef.current = format;
  useEffect(() => {
    if (!shown) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = calm ? Math.min(duration, 1200) : duration;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      setText(formatRef.current(value * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, value, duration]);
  return <span ref={ref}>{text}</span>;
}

/** Name revealed letter by letter, flipping up from the baseline. */
export function LetterReveal({
  text, className, letterClassName, start = 0, step = 55,
}: { text: string; className?: string; letterClassName?: string; start?: number; step?: number }) {
  return (
    <span className={className} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden className={cn("nn-letter", letterClassName)} style={{ "--d": `${start + i * step}ms` } as CSSProperties}>
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </span>
  );
}

/** Voice equalizer bars. */
export function Equalizer({ bars = 32, className }: { bars?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-end gap-[3px]", className)}>
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="flex h-full flex-1 items-end">
          <span
            className="nn-bar h-full"
            style={{ "--d": `${-((i * 137) % 1000) / 1000}s`, "--t": `${0.9 + ((i * 53) % 9) / 10}s` } as CSSProperties}
          />
        </span>
      ))}
    </div>
  );
}

/** Card that leans toward the mouse pointer (desktop only). */
export function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--ry", `${x * 14}deg`);
    ref.current.style.setProperty("--rx", `${-y * 14}deg`);
  };
  const reset = () => {
    ref.current?.style.setProperty("--ry", "0deg");
    ref.current?.style.setProperty("--rx", "0deg");
  };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={cn("nn-tilt", className)}>
      {children}
    </div>
  );
}

/** Thin gold bar at the top of the window that fills as the visitor scrolls. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} aria-hidden className="nn-progress" />;
}
