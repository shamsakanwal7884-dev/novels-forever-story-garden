import { Suspense, lazy, useState } from "react";
import { media } from "@/lib/media";

const AgentPanel = lazy(() => import("./AgentPanel"));

export function AgentLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open ? (
        <Suspense fallback={null}>
          <AgentPanel onClose={() => setOpen(false)} />
        </Suspense>
      ) : (
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event("nf:agent-open"));
            setOpen(true);
          }}
          className="group fixed bottom-tabbar right-4 lg:bottom-5 lg:right-5 z-50 flex cursor-pointer items-center gap-2 rounded-full border border-primary/40 bg-card p-1.5 sm:py-2 sm:pl-2 sm:pr-4 shadow-glow transition-transform hover:-translate-y-1"
          aria-label="Ask the AI librarian"
        >
          <img src={media.logo} alt="" className="h-10 w-10 transition-transform group-hover:rotate-[-8deg]" />
          <span className="hidden text-sm font-medium text-primary sm:inline">Ask the librarian</span>
        </button>
      )}
    </>
  );
}
