import { Link } from "@tanstack/react-router";
import { BookOpen, FileText, House, MessageCircle, PenLine } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: House },
  { to: "/novels", label: "Novels", icon: BookOpen },
  { to: "/authors", label: "Writers", icon: PenLine },
  { to: "/pdfs", label: "PDFs", icon: FileText },
  { to: "/contact", label: "Support", icon: MessageCircle },
] as const;

/** App-style bottom navigation for phones and tablets, so every main page is one tap away. */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Quick navigation"
      className="tabbar pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-gold opacity-0 transition-opacity group-data-[status=active]:opacity-100" />
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
