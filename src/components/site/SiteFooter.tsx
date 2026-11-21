import { Link } from "@tanstack/react-router";
import { MessageCircle, Youtube } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "./InstallAppButton";
import { CHANNEL_OWNER, OWNER, channel, totalNovels, totalVideos, whatsappLink } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border bg-card-grad">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            {totalNovels} Urdu novels and {totalVideos.toLocaleString()} audio episodes from the
            Novels Forever YouTube channel, arranged by category, author and playlist.
          </p>
        </div>
        <div>
          <h3 className="font-display text-xl text-primary">Explore</h3>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li><Link to="/novels" className="hover:text-primary">All novels</Link></li>
            <li><Link to="/authors" className="hover:text-primary">Authors</Link></li>
            <li><Link to="/playlists" className="hover:text-primary">Playlists</Link></li>
            <li><Link to="/pdfs" className="hover:text-primary">PDF library</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Support & feedback</Link></li>
            <li><Link to="/nadia-nawaz" className="hover:text-primary">Meet Nadia Nawaz</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-xl text-primary">Channel & support</h3>
          <p className="text-sm text-muted-foreground">
            Channel owner & narrator: <Link to="/nadia-nawaz" className="text-foreground hover:text-primary">{CHANNEL_OWNER.name}</Link>
            <br />
            Support: <span className="text-foreground">{OWNER.name}</span>
            <br />
            WhatsApp: <span className="text-foreground">{OWNER.whatsappDisplay}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="whatsapp" size="sm">
              <a href={whatsappLink()} target="_blank" rel="noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
            <Button asChild variant="youtube" size="sm">
              <a href={channel.url} target="_blank" rel="noreferrer">
                <Youtube /> YouTube
              </a>
            </Button>
            <InstallAppButton />
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Novels Forever · All audio belongs to the {channel.handle} channel
      </div>
    </footer>
  );
}
