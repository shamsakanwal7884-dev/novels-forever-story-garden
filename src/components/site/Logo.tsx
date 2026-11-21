import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { media } from "@/lib/media";

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <Link
      to="/"
      className={cn("group flex min-w-0 items-center gap-2.5 sm:gap-3", className)}
      aria-label="Novels Forever home"
    >
      <img
        src={media.logo}
        alt=""
        width={size === "lg" ? 64 : 44}
        height={size === "lg" ? 64 : 44}
        className={cn(
          "shrink-0 drop-shadow-[0_0_14px_oklch(0.8_0.13_82/0.45)] transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-105",
          size === "lg" ? "h-16 w-16" : "h-9 w-9 sm:h-11 sm:w-11",
        )}
      />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "truncate whitespace-nowrap font-display font-semibold tracking-wide text-gold animate-shine",
            size === "lg" ? "text-3xl" : "text-xl sm:text-2xl",
          )}
        >
          Novels Forever
        </span>
        <span
          className={cn(
            "mt-1 truncate text-[10px] uppercase tracking-[0.32em] text-muted-foreground",
            size === "md" && "hidden sm:block",
          )}
        >
          Urdu audio novel library
        </span>
      </span>
    </Link>
  );
}
