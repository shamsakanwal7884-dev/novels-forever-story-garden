import { Mic } from "lucide-react";
import { CHANNEL_OWNER } from "@/lib/catalog";

/** Slim ribbon at the very top of every page naming the channel owner and narrator. */
export function OwnerStrip() {
  return (
    <div className="bg-owner-strip border-b border-primary/15">
      <div className="mx-auto flex h-8 max-w-7xl items-center justify-center gap-2 px-4">
        <Mic className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="sm:hidden">Channel owner</span>
          <span className="hidden sm:inline">{CHANNEL_OWNER.role}</span>
        </span>
        <span className="h-3 w-px shrink-0 bg-primary/40" aria-hidden />
        <span className="whitespace-nowrap font-display text-base font-semibold italic leading-none text-gold">
          {CHANNEL_OWNER.name}
        </span>
      </div>
    </div>
  );
}
