import type { SocialLink } from "@/lib/owner-profile";

/** Simple brand marks for the social platforms (drawn inline so they always match the theme). */
export function BrandIcon({ id, className }: { id: SocialLink["id"]; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", "aria-hidden": true, fill: "currentColor" } as const;
  switch (id) {
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M13.5 21v-7.5h2.6l.4-3.1h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H7.9v3.1h2.6V21h3z" />
        </svg>
      );
    case "threads":
      return (
        <svg {...common}>
          <path d="M16.9 11.1c-.1 0-.2-.1-.3-.1-.2-3.1-1.9-4.9-4.7-4.9-1.7 0-3.1.7-3.9 2l1.5 1c.6-.9 1.6-1.1 2.4-1.1 1 0 1.7.3 2.2.9.3.4.6 1 .7 1.7-.8-.1-1.6-.2-2.5-.1-2.5.1-4.1 1.6-4 3.6.1 1 .6 1.9 1.4 2.5.7.5 1.6.7 2.6.7 1.3-.1 2.3-.6 3-1.5.5-.7.9-1.6 1-2.7.6.4 1.1.9 1.3 1.5.4 1.1.4 2.8-1 4.2-1.2 1.2-2.7 1.8-4.9 1.8-2.5 0-4.3-.8-5.5-2.3-1.1-1.4-1.7-3.4-1.7-6s.6-4.6 1.7-6c1.2-1.5 3-2.3 5.5-2.3s4.4.8 5.6 2.3c.6.7 1 1.7 1.3 2.7l1.8-.5c-.4-1.3-.9-2.4-1.7-3.4C17.3 1.6 15 .6 12.1.6 9.1.6 6.8 1.6 5.3 3.5 3.9 5.2 3.2 7.5 3.2 10.5s.7 5.3 2.1 7c1.5 1.9 3.8 2.9 6.8 2.9 2.7 0 4.6-.7 6.1-2.2 2-2 1.9-4.5 1.3-6-.5-1.1-1.4-2-2.6-2.6zm-4.5 4.4c-1.1.1-2.2-.4-2.3-1.4 0-.8.6-1.6 2.4-1.7h.6c.7 0 1.3.1 1.9.2-.2 2.4-1.4 2.8-2.6 2.9z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" />
        </svg>
      );
  }
}
