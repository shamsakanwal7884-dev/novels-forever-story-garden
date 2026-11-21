import { useEffect, useState } from "react";

/**
 * The only place that registers the offline service worker.
 * It never registers in development, inside the editor preview, or with ?sw=off.
 */
const PROJECT_ID = "efc5c138-aeb8-43bb-9930-7c2c607b9d82";
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const LOVABLE_HOSTS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  if (LOVABLE_HOSTS.some((d) => host.endsWith(d)) && PREVIEW_LABEL.test(label)) return true;
  if (LOVABLE_HOSTS.some((d) => host === `project--${PROJECT_ID}-dev${d}`)) return true;
  for (const d of ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"]) {
    if (host === d || host.endsWith(`.${d}`)) return true;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorker() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => {
        const url = r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL;
        return url ? new URL(url).pathname === "/sw.js" : false;
      })
      .map((r) => r.unregister()),
  );
}

let started = false;
export function setupServiceWorker() {
  if (started || typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  started = true;
  if (isRefusedContext()) {
    void unregisterAppWorker();
    return;
  }
  void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}

/* ---------- "Install app" prompt ---------- */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let installPromptListenersRegistered = false;

function ensureInstallPromptListeners() {
  if (installPromptListenersRegistered || typeof window === "undefined") return;
  installPromptListenersRegistered = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((listener) => listener());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((listener) => listener());
  });
}

export function useInstallApp() {
  const [state, setState] = useState({ canPrompt: false, isIos: false, installed: false });
  useEffect(() => {
    ensureInstallPromptListeners();
    const update = () => {
      const ua = navigator.userAgent;
      const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
      const installed =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setState({ canPrompt: deferred !== null, isIos, installed });
    };
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = async (): Promise<"prompted" | "ios" | "unavailable"> => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice.catch(() => null);
      deferred = null;
      listeners.forEach((l) => l());
      return "prompted";
    }
    return state.isIos ? "ios" : "unavailable";
  };

  return { ...state, install };
}
