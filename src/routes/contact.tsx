import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/site/NovelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OWNER, whatsappLink } from "@/lib/catalog";
import { sendFeedback } from "@/lib/community";
import { useReaderName } from "@/lib/reader";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Support & Feedback — Novels Forever" },
      { name: "description", content: "Contact the Novels Forever team on WhatsApp or send your feedback and novel requests." },
      { property: "og:title", content: "Support & Feedback — Novels Forever" },
      { property: "og:description", content: "Send feedback or request a novel from Novels Forever." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const reader = useReaderName();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = (name || reader || "").trim();
    if (finalName.length < 1) {
      toast.error("Please write your name.");
      return;
    }
    if (message.trim().length < 1) {
      toast.error("Please write a message.");
      return;
    }
    setBusy(true);
    try {
      await sendFeedback({ name: finalName, contact, message });
      setMessage("");
      setContact("");
      toast.success("Thank you! Your message was sent.");
    } catch {
      toast.error("Could not send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="We're listening" title="Support & feedback" />
      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <div className="gold-frame rounded-2xl bg-card-grad p-7">
          <MessageCircle className="h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Talk to {OWNER.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Need a novel, found a problem or want to say hello? Message on WhatsApp.
          </p>
          <p className="mt-4 font-medium">{OWNER.whatsappDisplay}</p>
          <Button asChild variant="gold" className="mt-6">
            <a href={whatsappLink()} target="_blank" rel="noreferrer"><MessageCircle /> Chat on WhatsApp</a>
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card-grad p-7">
          <h2 className="font-display text-2xl font-semibold">Send feedback</h2>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={reader ?? "Your name"} maxLength={80} aria-label="Your name" />
          <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone (optional)" maxLength={120} aria-label="Contact" />
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message or novel request…" maxLength={2000} rows={6} aria-label="Message" />
          <Button type="submit" variant="gold" disabled={busy}><Send /> {busy ? "Sending…" : "Send message"}</Button>
        </form>
      </div>
    </div>
  );
}
