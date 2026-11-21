import {
  CHANNEL_OWNER,
  OWNER,
  authors,
  byRecent,
  byViews,
  categories,
  channel,
  collections,
  formatViews,
  novels,
  novelsInCategory,
  novelsOf,
  whatsappLink,
  type Novel,
} from "@/lib/catalog";

let cachedInstructions: string | null = null;
let cachedFor: Novel[] | null = null;

/** The complete library is sent to the remote AI, not just the home-page novels. */
export function buildLibrarianInstructions(): string {
  // Rebuilt whenever the live catalog changes (admin added or edited novels/videos).
  if (cachedInstructions && cachedFor === novels) return cachedInstructions;
  cachedFor = novels;
  const catName = new Map(categories.map((c) => [c.slug, c.name]));
  const lines = novels.map((n) => {
    const cats = n.cats.map((c) => catName.get(c) ?? c).join(", ");
    const kind = n.format === "series" ? `series, ${n.eps.length} episodes` : "complete in one video";
    return `- ${n.name}${n.urdu ? ` (${n.urdu})` : ""} | by ${n.author ?? "unknown"} | ${cats} | ${kind} | ${n.views} views | /novels/${n.slug}`;
  });

  cachedInstructions = `You are "Kitab", the friendly librarian of the Novels Forever website — a library of Urdu audio novels from the YouTube channel ${channel.name} (${channel.url}).
Answer in the same language and script the visitor uses (Roman Urdu, Urdu or English). Keep answers short, warm and helpful.
Only recommend novels from the catalog below. When you mention a novel, link it as a markdown link to its page path, e.g. [Man Yaram](/novels/man-yaram). Never invent novels, authors or episodes.
If asked for a PDF: the novel page has a "Find PDF" button (Google search) and, when the owner has uploaded one, Read and Download buttons. Never claim a PDF exists unless the visitor says it appears on the page. The PDF Library page is /pdfs.
Channel owner and narrator: ${CHANNEL_OWNER.name}. Every video on the channel is in her voice. Do not confuse her with the support contact.
Support: ${OWNER.name}, WhatsApp ${OWNER.whatsappDisplay} (https://wa.me/${OWNER.whatsapp}). Contact page: /contact. Never reveal admin credentials.
Site pages: /novels (all novels by category, search), /authors, /playlists, /pdfs, /contact.

Categories: ${categories.map((c) => `${c.name} (${c.count})`).join("; ")}
Authors with most novels: ${authors
    .slice(0, 40)
    .map((a) => `${a.name} (${a.novels.length}) /authors/${a.slug}`)
    .join("; ")}
Playlists: ${collections.map((c) => `${c.title} (${c.count})`).join("; ")}

CATALOG (${novels.length} novels):
${lines.join("\n")}`;
  return cachedInstructions;
}

const normalise = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const CATEGORY_TERMS: Record<string, string[]> = {
  nikkah: ["nikkah", "nikah", "marriage", "married", "shaadi", "shadi"],
  "rude-hero": ["rude hero", "rude heroine", "rude heroin", "rudehero", "aggressive hero"],
  romantic: ["romantic", "romance", "love story", "mohabbat", "muhabbat"],
  cousin: ["cousin", "family stories", "family story"],
  thriller: ["thriller", "revenge", "kidnap", "kidnapping", "inteqam"],
  funny: ["funny", "comedy", "light novel", "mazahiya"],
  "age-difference": ["age difference", "age gap", "teacher student", "teacher"],
  feudal: ["feudal", "haveli", "village", "wadera", "gaon"],
  "boss-hero": ["boss hero", "doctor hero", "boss", "doctor"],
  university: ["university", "college", "campus"],
  fantasy: ["fantasy", "adventure"],
  "love-triangle": ["love triangle", "triangle"],
  spiritual: ["spiritual", "islamic", "islami"],
};

const STOP_WORDS = new Set([
  "aik", "aur", "batao", "bataen", "best", "chaheye", "chahiye", "complete", "for", "hai", "hain", "ka", "ke", "ki",
  "konse", "konsa", "koi", "mein", "mujhe", "novel", "novels", "please", "suggest", "the", "tonight", "urdu",
]);

const novelLink = (n: Novel) => `[${n.name}](/novels/${n.slug})`;
const novelDescription = (n: Novel) =>
  `${novelLink(n)} — ${n.author ?? "Unknown writer"} · ${n.format === "complete" ? "complete" : `${n.eps.length} episodes`} · ${formatViews(n.views)} views`;

function recommendationList(list: Novel[], limit = 5): string {
  return list.slice(0, limit).map((n) => `- ${novelDescription(n)}`).join("\n");
}

/** Deterministic answers keep the librarian useful when the external AI is unavailable. */
export function localLibrarianReply(question: string): string {
  const q = normalise(question);
  if (!q) return "Apna sawal likhein — main novels, writers, categories aur PDFs mein madad kar sakta hoon.";

  if (/^(hi+|hello|hey|salam|salaam|assalam o alaikum|assalamu alaikum)\b/.test(q)) {
    return "Assalam o Alaikum! Main Kitab hoon. Novel ka naam, writer ya category likhein — masalan **rude hero romantic novels** ya **Anna Ilyas ke novels**.";
  }
  if (/nadia|channel owner|narrator|voice|awaaz|awaz|kis ki awaaz/.test(q)) {
    return `**${CHANNEL_OWNER.name}** ${channel.name} channel ki owner hain, aur **tamam videos unhi ki awaaz mein** hain.`;
  }
  if (/\bpdf\b|book download|pdf download|parhna|read novel/.test(q)) {
    return "PDFs ke liye [PDF Library](/pdfs) kholein. Novel page par **Find PDF** se Google search hoti hai; jahan owner ne PDF upload ki ho wahan **Read** aur **Download** buttons milte hain.";
  }
  if (/whatsapp|contact|support|number|rabta/.test(q)) {
    return `Support ke liye ${OWNER.name} se [WhatsApp par rabta karein](${whatsappLink()}) (${OWNER.whatsappDisplay}), ya [contact page](/contact) se feedback bhejein.`;
  }
  if (/owner/.test(q)) {
    return `Channel owner **${CHANNEL_OWNER.name}** hain aur tamam videos unki awaaz mein hain. Support contact **${OWNER.name}** hain.`;
  }
  if (/how many|kitne novels|total novels|library size/.test(q)) {
    return `Library mein **${novels.length} novels**, **${authors.length} writers** aur **${collections.length} playlists** hain. [Tamam novels](/novels) dekhein.`;
  }
  if (/categor|categories|kis type/.test(q)) {
    return `Yeh categories available hain:\n${categories.map((c) => `- **${c.name}** (${c.count})`).join("\n")}\n\n[Novels page](/novels) par category select kar sakte hain.`;
  }
  if (/playlist/.test(q)) {
    return `Hamari **${collections.length} playlists** yahan dekhein: [Playlists page](/playlists).\n${recommendationList(byViews, 3)}`;
  }
  if (/best author|top author|writers list|authors list|writer kon/.test(q)) {
    return `Popular writers:\n${authors.slice(0, 8).map((a) => `- [${a.name}](/authors/${a.slug}) — ${a.novels.length} novels`).join("\n")}`;
  }

  const author = authors
    .filter((a) => q.includes(normalise(a.name)))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (author) {
    const list = novelsOf(author.novels).sort((a, b) => b.views - a.views);
    return `**${author.name}** ke ${list.length} novels available hain. Sab se zyada dekhe jane wale:\n${recommendationList(list)}\n\n[Writer ka poora safha](/authors/${author.slug})`;
  }

  const namedNovels = byViews.filter((n) => {
    const name = normalise(n.name);
    return name.length >= 4 && q.includes(name);
  });
  if (namedNovels.length > 0) {
    const n = namedNovels.at(0);
    if (n) return `**${n.name}** ${n.author ? `by **${n.author}**` : ""} — ${n.format === "complete" ? "complete novel" : `${n.eps.length} episodes ki series`}, ${formatViews(n.views)} views.\n\n[Novel kholein aur sunein](/novels/${n.slug})`;
  }

  const selectedCategories = categories.filter((c) => {
    const terms = CATEGORY_TERMS[c.slug] ?? [];
    return terms.some((term) => q.includes(term)) || q.includes(normalise(c.name));
  });
  if (selectedCategories.length > 0) {
    let matches = byViews.filter((n) => selectedCategories.every((c) => n.cats.includes(c.slug)));
    if (matches.length === 0) {
      const firstCategory = selectedCategories.at(0);
      if (firstCategory) matches = novelsInCategory(firstCategory.slug);
    }
    if (/complete|mukammal/.test(q)) matches = matches.filter((n) => n.format === "complete");
    if (/latest|new|recent|nayi|naya/.test(q)) matches = [...matches].sort((a, b) => b.recent - a.recent);
    return `Aapke liye **${selectedCategories.map((c) => c.name).join(" + ")}** novels:\n${recommendationList(matches)}`;
  }

  if (/latest|new novels|recent|nayi novels|naya novel/.test(q)) {
    return `Latest additions se yeh novels dekhein:\n${recommendationList(byRecent)}`;
  }

  const tokens = q.split(" ").filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
  const scored = byViews
    .map((n) => {
      const name = normalise(n.name);
      const writer = normalise(n.author ?? "");
      const cats = normalise(n.cats.join(" "));
      const episodes = normalise(n.eps.map((e) => e.t).join(" "));
      const score = tokens.reduce(
        (sum, token) => sum + (name.includes(token) ? 8 : writer.includes(token) ? 5 : cats.includes(token) ? 3 : episodes.includes(token) ? 1 : 0),
        0,
      );
      return { n, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.n.views - a.n.views)
    .map((item) => item.n);

  if (scored.length > 0) return `Aapki search se milte novels:\n${recommendationList(scored)}`;

  const popular = /complete|mukammal/.test(q) ? byViews.filter((n) => n.format === "complete") : byViews;
  return `Yeh popular novels try karein:\n${recommendationList(popular)}\n\nAap novel ka naam, writer ya category bhi likh sakte hain.`;
}
