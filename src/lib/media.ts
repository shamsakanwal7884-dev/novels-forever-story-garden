/**
 * Site media served from /public so the same paths work on Lovable hosting and on Vercel
 * (CDN asset pointers only resolve on Lovable hosting).
 */
export const media = {
  logo: "/media/logo.png",
  hero: "/media/hero-library.jpg",
  narrator: "/media/nadia-nawaz-round.jpg",
  welcomeAudio: "/media/welcome-novels-forever.mp3",
} as const;
