import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Square, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { media } from "@/lib/media";

const SUGGESTIONS = [
  "Suggest a rude hero romantic novel",
  "Anna Ilyas ke best novels konse hain?",
  "Best complete novel for tonight?",
  "Cousin marriage novels batao",
];

export default function AgentPanel({ onClose }: { onClose: () => void }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (error) => toast.error(error.message || "The librarian could not answer. Try again."),
  });
  const [prompt, setPrompt] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || busy) return;
    setPrompt("");
    void sendMessage({ text });
  };

  return (
    <section
      aria-label="Kitab AI librarian"
      className="gold-frame fixed bottom-4 right-4 z-50 flex h-[min(640px,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-lg bg-card-grad shadow-glow"
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <img src={media.logo} alt="" className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl leading-none text-gold">Kitab · Librarian</h2>
          <p className="mt-1 text-xs text-muted-foreground">Knows the novels in this library</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close chat" onClick={onClose}>
          <X />
        </Button>
      </header>

      <div ref={transcriptRef} className="flex-1 space-y-5 overflow-y-auto p-4" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 py-6 text-center">
            <img src={media.logo} alt="" className="h-16 w-16" />
            <p className="font-display text-2xl text-gold">Assalam o Alaikum!</p>
            <p className="text-sm text-muted-foreground">Ask me about a novel, writer, category, or PDF.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void sendMessage({ text: suggestion })}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            if (message.role !== "user" && message.role !== "assistant") return null;
            const textParts = message.parts.filter((part) => part.type === "text");
            return (
              <article
                key={message.id}
                className={message.role === "user" ? "ml-auto max-w-[90%] rounded-lg bg-secondary px-4 py-3 text-sm" : "max-w-full text-sm"}
              >
                {textParts.map((part, index) =>
                  message.role === "assistant" ? (
                    <Streamdown key={index} className="[&_a]:text-primary [&_a]:underline">
                      {part.text}
                    </Streamdown>
                  ) : (
                    <p key={index} className="whitespace-pre-wrap">{part.text}</p>
                  ),
                )}
              </article>
            );
          })
        )}
        {status === "submitted" && <p className="text-sm text-muted-foreground">Turning the pages…</p>}
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Koi novel suggest karo…"
          aria-label="Ask the librarian"
          rows={2}
          className="min-h-12 flex-1 resize-none"
        />
        {busy ? (
          <Button type="button" variant="outline" size="icon" aria-label="Stop response" onClick={() => stop()}>
            <Square />
          </Button>
        ) : (
          <Button type="submit" variant="gold" size="icon" aria-label="Send message" disabled={!prompt.trim()}>
            <ArrowUp />
          </Button>
        )}
      </form>
    </section>
  );
}