/** Nadia Nawaz — channel owner and narrator of Novels Forever — and her official social links. */
export type SocialLink = {
  id: "instagram" | "facebook" | "threads" | "youtube";
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
];
