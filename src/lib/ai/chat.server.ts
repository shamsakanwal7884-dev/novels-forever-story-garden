import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { z } from "zod";

import { askAnabot, type AnabotMessage } from "./anabot.ts";
import { buildLibrarianInstructions, localLibrarianReply } from "./librarian.ts";
import { loadCatalog } from "@/lib/catalog-live";

const bodySchema = z.object({
  messages: z.array(z.any()).min(1).max(60),
});

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim()
    .slice(0, 4_000);
}

export async function handleChat(request: Request): Promise<Response> {
  let messages: UIMessage[];
  try {
    const parsed = bodySchema.parse(await request.json());
    messages = parsed.messages as UIMessage[];
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const conversation = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-12)
    .map((m) => ({ role: m.role, content: messageText(m) }))
    .filter((m) => m.content.length > 0);
  const latestQuestion = [...conversation].reverse().find((m) => m.role === "user")?.content;
  if (!latestQuestion) return Response.json({ error: "Please write a question." }, { status: 400 });

  const stream = createUIMessageStream<UIMessage>({
    originalMessages: messages,
    execute: async ({ writer }) => {
      await loadCatalog(); // include novels/videos the admin added
      const remoteMessages: AnabotMessage[] = [
        { role: "system", content: buildLibrarianInstructions() },
        ...conversation,
      ];
      const answer = (await askAnabot(remoteMessages, request.signal)) ?? localLibrarianReply(latestQuestion);
      const textId = "librarian-answer";
      writer.write({ type: "text-start", id: textId });
      for (let offset = 0; offset < answer.length; offset += 240) {
        if (request.signal.aborted) break;
        writer.write({ type: "text-delta", id: textId, delta: answer.slice(offset, offset + 240) });
      }
      writer.write({ type: "text-end", id: textId });
    },
    onError: (error) => {
      console.error("chat error", error);
      return "Sorry, the librarian could not answer. Please try again.";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
