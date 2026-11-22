import { useEffect, useState } from "react";
import { Youtube } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/nadia/BrandIcon";
import { channel, totalVideos } from "@/lib/catalog";
import { media } from "@/lib/media";
import { NADIA_SOCIALS } from "@/lib/owner-profile";

const whatsappChannel = NADIA_SOCIALS.find((s) => s.id === "whatsapp");

const KEY = "nf-yt-popup";

export function YoutubePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const dismissForChat = () => {
      window.clearTimeout(t);
      setOpen(false);
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
    };
    const t = window.setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
    }, 20000);
    window.addEventListener("nf:agent-open", dismissForChat);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("nf:agent-open", dismissForChat);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card-grad gold-frame text-center sm:max-w-md">
        <img src={media.logo} alt="" className="animate-float mx-auto h-24 w-24" />
        <DialogHeader className="items-center text-center sm:text-center">
          <DialogTitle className="font-display text-3xl text-gold">Visit our YouTube channel</DialogTitle>
          <DialogDescription>
            {totalVideos.toLocaleString()}+ Urdu audio novels with full text. Subscribe to{" "}
            {channel.name} so you never miss a new episode.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="youtube" size="lg">
            <a href={`${channel.url}?sub_confirmation=1`} target="_blank" rel="noreferrer">
              <Youtube /> Subscribe on YouTube
            </a>
          </Button>
          {whatsappChannel ? (
            <Button asChild variant="whatsapp" size="lg">
              <a href={whatsappChannel.url} target="_blank" rel="noreferrer">
                <BrandIcon id="whatsapp" className="h-5 w-5" /> Join WhatsApp channel
              </a>
            </Button>
          ) : null}
          <Button variant="glass" size="lg" onClick={() => setOpen(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
