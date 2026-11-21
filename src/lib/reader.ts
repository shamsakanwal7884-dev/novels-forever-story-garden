import { useSyncExternalStore } from "react";

const KEY = "nf-reader-name";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setReaderName(name: string | null) {
  try {
    if (name) window.localStorage.setItem(KEY, name.trim().slice(0, 60));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Username-only "login": a name kept in this browser, used to sign reviews. */
export function useReaderName(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** Opens the login dialog from anywhere. */
export const openLogin = () => window.dispatchEvent(new Event("nf:open-login"));
