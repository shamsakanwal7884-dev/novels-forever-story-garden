import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteFeedback, feedbackQuery } from "@/lib/admin";

const phoneDigits = (s: string) => s.replace(/[^\d]/g, "");

export function FeedbackPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(feedbackQuery());
  const remove = async (id: string) => {
    try {
      await deleteFeedback(id);
      await qc.invalidateQueries({ queryKey: ["admin-feedback"] });
      toast.success("Message deleted.");
    } catch {
      toast.error("Could not delete the message.");
    }
  };
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-3xl">Reader messages</h2>
        <p className="text-sm text-muted-foreground">Messages and novel requests sent from the Support page.</p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && (data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
      <ul className="space-y-3">
        {(data ?? []).map((f) => {
          const isEmail = /\S+@\S+\.\S+/.test(f.contact);
          const digits = phoneDigits(f.contact);
          return (
            <li key={f.id} className="rounded-xl border border-border bg-card-grad p-4">
              <p className="font-medium">{f.name} <span className="text-xs text-muted-foreground">· {new Date(f.created_at).toLocaleString()}</span></p>
              {f.contact && <p className="text-xs text-muted-foreground">{f.contact}</p>}
              <p className="mt-2 whitespace-pre-line text-sm">{f.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {isEmail && <Button asChild size="sm" variant="glass"><a href={`mailto:${f.contact}?subject=${encodeURIComponent("Novels Forever")}`}><Mail /> Reply by email</a></Button>}
                {!isEmail && digits.length >= 10 && <Button asChild size="sm" variant="whatsapp"><a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer"><MessageCircle /> Reply on WhatsApp</a></Button>}
                <Button size="sm" variant="glass" onClick={() => { if (window.confirm("Delete this message?")) void remove(f.id); }}><Trash2 /> Delete</Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
