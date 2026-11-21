import { applyCatalogOverrides, getCatalogOverridesSnapshot, type CatalogOverrides } from "@/lib/catalog";
import { getCatalogOverrides } from "@/lib/catalog.functions";

let inflight: Promise<CatalogOverrides> | null = null;
let loadedAt = 0;

/**
 * Loads the admin's novel/video edits into the live catalog. Cached briefly (30s on the server,
 * 60s in the browser); pass fresh after an admin save. Never throws: on failure the site keeps
 * showing the last known library.
 */
export function loadCatalog(opts: { fresh?: boolean } = {}): Promise<CatalogOverrides> {
  const ttl = typeof window === "undefined" ? 30_000 : 60_000;
  if (!opts.fresh && inflight && Date.now() - loadedAt < ttl) return inflight;
  loadedAt = Date.now();
  const request = getCatalogOverrides({ data: { fresh: Boolean(opts.fresh) } })
    .then((o) => {
      applyCatalogOverrides(o);
      return o;
    })
    .catch((error: unknown) => {
      console.warn("Could not load admin catalog edits; showing the saved library.", error);
      if (inflight === request) inflight = null;
      return getCatalogOverridesSnapshot();
    });
  inflight = request;
  return request;
}
