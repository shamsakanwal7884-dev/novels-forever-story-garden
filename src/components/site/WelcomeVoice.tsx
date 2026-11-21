import { useEffect } from "react";
import { media } from "@/lib/media";

const KEY = "nf-welcome-played";
/** If the browser blocks sound until a tap, wait this long for that first tap. */
const TAP_WINDOW_MS = 20000;

/**
 * Plays the "Novels Forever mein khush aamdeed" greeting once per browser session.
 * Browsers often block sound until the visitor taps, so it falls back to the first tap/key.
 */
export function WelcomeVoice() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const audio = new Audio(media.welcomeAudio);
    audio.preload = "auto";
    audio.volume = 0.9;
    let done = false;
    const events = ["pointerdown", "touchstart", "keydown"] as const;

    const markPlayed = () => {
      done = true;
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
      events.forEach((e) => window.removeEventListener(e, onGesture));
    };

    const tryPlay = () => {
      if (done) return;
      audio
        .play()
        .then(() => {
          if (!done) markPlayed();
        })
        .catch(() => {
          /* blocked until the visitor interacts */
        });
    };

    function onGesture() {
      tryPlay();
    }

    events.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));
    tryPlay();
    const stop = window.setTimeout(() => {
      events.forEach((e) => window.removeEventListener(e, onGesture));
    }, TAP_WINDOW_MS);

    return () => {
      done = true;
      audio.pause();
      window.clearTimeout(stop);
      events.forEach((e) => window.removeEventListener(e, onGesture));
    };
  }, []);

  return null;
}
