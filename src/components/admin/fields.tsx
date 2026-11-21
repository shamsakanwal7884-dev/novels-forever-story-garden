import type { ReactNode, SelectHTMLAttributes } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/catalog";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function NativeSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

/** Toggle chips for choosing a novel's categories. */
export function CategoryPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const on = value.includes(c.slug);
        return (
          <button
            key={c.slug}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((s) => s !== c.slug) : [...value, c.slug])}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors",
              on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50",
            )}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-card-grad p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl text-primary">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
