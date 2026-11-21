import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCategory, saveCategory, uniqueSlug } from "@/lib/admin-catalog";
import { categories, getCatalogOverridesSnapshot, isBuiltInCategory } from "@/lib/catalog";

export function CategoriesPanel({ onChanged }: { onChanged: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ slug: string; name: string } | null>(null);
  const custom = new Set((getCatalogOverridesSnapshot().categories ?? []).map((c) => c.slug));

  const run = async (key: string, fn: () => Promise<void>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      await onChanged();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const add = () => {
    const clean = name.trim();
    if (clean.length < 2) { toast.error("Write a category name."); return; }
    if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) { toast.error("This category already exists."); return; }
    const slug = uniqueSlug(clean, (s) => categories.some((c) => c.slug === s));
    void run("new", () => saveCategory(slug, clean), `Category “${clean}” added.`).then(() => setName(""));
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-3xl">Categories</h2>
        <p className="text-sm text-muted-foreground">Create new categories, then pick them when you add or edit a novel.</p>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="New category name, e.g. Revenge Based" aria-label="New category name" />
        <Button type="submit" variant="gold" disabled={busy !== null}>{busy === "new" ? <Loader2 className="animate-spin" /> : <Plus />} Add</Button>
      </form>
      <ul className="grid gap-3 sm:grid-cols-2">
        {categories.map((c) => (
          <li key={c.slug} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            {editing?.slug === c.slug ? (
              <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); const n = editing.name.trim(); if (n.length < 2) return; void run(c.slug, () => saveCategory(c.slug, n), "Category renamed.").then(() => setEditing(null)); }}>
                <Input value={editing.name} maxLength={80} onChange={(e) => setEditing({ slug: c.slug, name: e.target.value })} aria-label="Category name" />
                <Button size="sm" type="submit" variant="gold" disabled={busy !== null}>Save</Button>
              </form>
            ) : (
              <>
                <span className="min-w-0">
                  <span className="block font-medium">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{c.count} novels · {isBuiltInCategory(c.slug) ? "original" : "added by you"}</span>
                </span>
                <span className="flex gap-1">
                  <Button size="icon-sm" variant="glass" aria-label={`Rename ${c.name}`} onClick={() => setEditing({ slug: c.slug, name: c.name })}><Pencil /></Button>
                  {custom.has(c.slug) && !isBuiltInCategory(c.slug) && (
                    <Button
                      size="icon-sm"
                      variant="glass"
                      aria-label={`Delete ${c.name}`}
                      disabled={busy !== null}
                      onClick={() => { if (window.confirm(`Delete “${c.name}”? Novels keep their other categories.`)) void run(c.slug, () => deleteCategory(c.slug), "Category deleted."); }}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
