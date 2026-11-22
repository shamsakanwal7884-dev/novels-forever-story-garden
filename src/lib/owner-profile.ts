/** Nadia Nawaz — channel owner and narrator of Novels Forever — and her official social links. */
export type SocialLink = {
  id: "instagram" | "facebook" | "threads" | "youtube" | "whatsapp" | "tiktok";
  label: string;
  handle: string;
  url: string;
  cta: string;
};

export const NADIA_SOCIALS: SocialLink[] = [
  { id: "youtube", label: "YouTube", handle: "@NovelsForever", url: "https://www.youtube.com/@NovelsForever?sub_confirmation=1", cta: "Subscribe" },
  { id: "instagram", label: "Instagram", handle: "@novels__forever", url: "https://www.instagram.com/novels__forever", cta: "Follow" },
  { id: "facebook", label: "Facebook", handle: "Novels Forever", url: "https://www.facebook.com/share/1JTCiCohJn/", cta: "Follow page" },
  { id: "threads", label: "Threads", handle: "@novels__forever", url: "https://www.threads.com/@novels__forever", cta: "Follow" },
  { id: "whatsapp", label: "WhatsApp Channel", handle: "Novels Forever", url: "https://whatsapp.com/channel/0029Vb6EZqF17EmwdzJtcK1v", cta: "Join channel" },
  { id: "tiktok", label: "TikTok", handle: "@novels.forever", url: "https://www.tiktok.com/@novels.forever", cta: "Follow" },
];
