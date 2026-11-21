import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Marks an element data-shown="true" the first time it scrolls into view. */
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
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, shown };
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

/** Number that counts up from zero once it is on screen. */
export function CountUp({ value, format, duration = 2200 }: { value: number; format: (n: number) => string; duration?: number }) {
  const { ref, shown } = useInView<HTMLSpanElement>(0.4);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(value * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, value, duration]);
  return <span ref={ref}>{format(shown ? n : 0)}</span>;
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
