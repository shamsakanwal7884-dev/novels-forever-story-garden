import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInstallApp } from "@/lib/pwa";
import { media } from "@/lib/media";

const KEY = "nf-install-popup-dismissed";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // ask again after 3 days
const DELAY_MS = 6000; // after the book intro has finished

function snoozed(): boolean {
  try {
    const at = Number(localStorage.getItem(KEY) ?? 0);
    return Number.isFinite(at) && Date.now() - at < SNOOZE_MS;
  } catch {
    return true;
  }
}

function snooze() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** Home-page popup inviting visitors to install Novels Forever as an app. */
export function InstallAppPopup() {
  const { installed, isIos, install } = useInstallApp();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState<null | "ios" | "menu">(null);

  useEffect(() => {
    if (installed || snoozed()) return;
    const t = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, [installed]);

  const close = () => {
    snooze();
    setOpen(false);
  };

  const onInstall = async () => {
    const result = await install();
    if (result === "prompted") {
      close();
      return;
    }
    setHelp(result === "ios" ? "ios" : "menu");
  };

  if (installed) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent className="bg-card-grad gold-frame text-center sm:max-w-md">
        <img src={media.logo} alt="" className="animate-float mx-auto h-24 w-24" />
        <DialogHeader className="items-center text-center sm:text-center">
          <DialogTitle className="font-display text-3xl text-gold">Install the Novels Forever app</DialogTitle>
          <DialogDescription>
            Open your favourite Urdu novels in one tap from your home screen — faster, full screen, and saved
            books work even without internet.
          </DialogDescription>
        </DialogHeader>

        {help === "ios" || (help === null && isIos) ? (
          <p className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
            On iPhone: tap the <Share className="inline h-4 w-4 align-text-bottom text-primary" /> Share button,
            then choose <span className="text-foreground">“Add to Home Screen”</span>.
          </p>
        ) : help === "menu" ? (
          <p className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
            Open your browser menu (⋮) and choose <span className="text-foreground">“Install app”</span> or{" "}
            <span className="text-foreground">“Add to Home screen”</span>.
          </p>
        ) : null}

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {!(isIos || help) && (
            <Button variant="gold" size="lg" onClick={() => void onInstall()}>
              <Download /> Install app
            </Button>
          )}
          <Button variant="glass" size="lg" onClick={close}>
            {isIos || help ? <>Got it</> : <><X /> Not now</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
