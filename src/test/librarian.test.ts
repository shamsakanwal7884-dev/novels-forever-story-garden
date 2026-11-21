import { describe, expect, it } from "vitest";

import { extractAnabotText } from "@/lib/ai/anabot";
import { buildLibrarianInstructions, localLibrarianReply } from "@/lib/ai/librarian";
import { novels } from "@/lib/catalog";

describe("Vercel-compatible librarian", () => {
  it("gives the remote AI every novel page in the catalog", () => {
    const instructions = buildLibrarianInstructions();
    for (const novel of novels) expect(instructions).toContain(`/novels/${novel.slug}`);
  });

  it("answers an author question from the library without AI", () => {
    const reply = localLibrarianReply("Anna Ilyas ke best novels konse hain?");
    expect(reply).toContain("/authors/anna-ilyas");
    expect(reply).toContain("[Tery Mery Darmiyaan](/novels/tery-mery-darmiyaan)");
  });

  it("answers category and complete-novel requests without AI", () => {
    const reply = localLibrarianReply("Best complete rude hero romantic novel for tonight?");
    expect(reply).toContain("Rude Hero / Heroine + Romantic Love Stories");
    expect(reply).toContain("complete");
    expect(reply).toContain("/novels/");
  });

  it("knows that Nadia Nawaz owns the channel and narrates every video", () => {
    const reply = localLibrarianReply("Channel owner kaun hai aur videos kis ki voice mein hain?");
    expect(reply).toContain("Nadia Nawaz");
    expect(reply).toContain("tamam videos unhi ki awaaz mein");
    expect(reply).not.toContain("Sardar Rdx");
  });

  it("keeps PDF and WhatsApp help available without AI", () => {
    expect(localLibrarianReply("PDF kaise download karun?")).toContain("/pdfs");
    expect(localLibrarianReply("WhatsApp number kya hai?")).toContain("+92 330 1068874");
  });

  it("reads common Anabot answer shapes but rejects service errors", () => {
    expect(extractAnabotText({ success: true, result: "Hello" })).toBe("Hello");
    expect(extractAnabotText({ success: true, data: { answer: "A novel reply" } })).toBe("A novel reply");
    expect(extractAnabotText({ success: false, error: "Internal Server Error" })).toBeNull();
  });
});
