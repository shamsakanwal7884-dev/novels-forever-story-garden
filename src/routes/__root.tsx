import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LoginDialog } from "@/components/site/LoginDialog";
import { IntroOverlay } from "@/components/site/IntroOverlay";
import { WelcomeVoice } from "@/components/site/WelcomeVoice";
import { YoutubePopup } from "@/components/site/YoutubePopup";
import { AgentLauncher } from "@/components/site/AgentLauncher";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { setupServiceWorker } from "@/lib/pwa";
import { applyCatalogOverrides, getCatalogOverridesSnapshot } from "@/lib/catalog";
import { loadCatalog } from "@/lib/catalog-live";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Admin novel/video edits load before any page loader runs, so new novels resolve everywhere.
  beforeLoad: async () => {
    await loadCatalog();
  },
  // Sent to the browser with the page so the first render matches the server.
  loader: () => ({ catalog: getCatalogOverridesSnapshot() }),
  head: () => ({
    // Each content route, / included, sets its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Novels Forever" },
      { name: "theme-color", content: "#0f1d24" },
      { title: "Novels Forever — Urdu Audio Novel Library" },
      {
        name: "description",
        content: "Listen to Urdu audio novels from the Novels Forever YouTube channel, arranged by category, author and playlist.",
      },
      { name: "author", content: "Novels Forever" },
      { property: "og:title", content: "Novels Forever — Urdu Audio Novel Library" },
      {
        property: "og:description",
        content: "Urdu audio novels by category, author and playlist, with reviews, PDFs and an AI librarian.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Manrope:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;600&display=swap",
      },
      { rel: "preconnect", href: "https://i.ytimg.com" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  // Idempotent: installs the server's catalog version before children render.
  applyCatalogOverrides(Route.useLoaderData().catalog);

  useEffect(() => {
    setupServiceWorker();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (event === "SIGNED_OUT") queryClient.setQueryData(["owner-session"], null);
      router.invalidate();
      if (event !== "SIGNED_OUT") {
        void queryClient.invalidateQueries({ queryKey: ["owner-session"] });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <IntroOverlay />
      <WelcomeVoice />
      <div className="pb-tabbar flex min-h-screen flex-col lg:pb-0">
        <SiteHeader />
        <main className="flex-1">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <LoginDialog />
      <YoutubePopup />
      <MobileTabBar />
      <AgentLauncher />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
