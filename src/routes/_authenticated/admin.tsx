import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, FileText, Inbox, LayoutGrid, Star, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/admin/fields";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { FeedbackPanel } from "@/components/admin/FeedbackPanel";
import { NovelsPanel } from "@/components/admin/NovelsPanel";
import { PdfPanel } from "@/components/admin/PdfPanel";
import { ReviewsPanel } from "@/components/admin/ReviewsPanel";
import { UploadsPanel } from "@/components/admin/UploadsPanel";
import { supabase } from "@/integrations/supabase/client";
import { allReviewsQuery, feedbackQuery, isAdminRole } from "@/lib/admin";
import { refreshCatalog } from "@/lib/admin-catalog";
import { categories, totalNovels, totalVideos } from "@/lib/catalog";

const TABS = ["uploads", "novels", "categories", "reviews", "messages", "pdfs"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(search["tab"] as Tab) ? { tab: search["tab"] as Tab } : {},
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !isAdminRole(data?.role)) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Owner Area — Novels Forever" },
      { name: "description", content: "Manage novels, episodes, categories, reviews and PDFs on Novels Forever." },
      { property: "og:title", content: "Owner Area — Novels Forever" },
      { property: "og:description", content: "Owner tools for Novels Forever." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = Route.useRouteContext();
  const { tab = "uploads" } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin" });
  const router = useRouter();
  const qc = useQueryClient();
  const [version, setVersion] = useState(0);
  const { data: reviews } = useQuery(allReviewsQuery());
  const { data: feedback } = useQuery(feedbackQuery());
  const waiting = (reviews ?? []).filter((r) => !r.reply).length;

  const onChanged = async () => {
    await refreshCatalog();
    setVersion((v) => v + 1);
    await router.invalidate();
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const trigger = "gap-1.5 data-[state=active]:bg-gold data-[state=active]:text-primary-foreground";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Owner area</p>
          <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">Admin portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <Button variant="glass" onClick={() => void signOut()}>Sign out</Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5" key={version}>
        <StatCard label="Novels" value={totalNovels} />
        <StatCard label="Episodes" value={totalVideos.toLocaleString()} />
        <StatCard label="Categories" value={categories.length} />
        <StatCard label="Reviews" value={reviews?.length ?? "—"} hint={waiting ? `${waiting} waiting for reply` : undefined} />
        <StatCard label="Messages" value={feedback?.length ?? "—"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => void navigate({ search: { tab: v as Tab }, replace: true })} className="mt-8">
        <TabsList className="scrollbar-none h-auto w-full justify-start gap-1 overflow-x-auto bg-card p-1">
          <TabsTrigger value="uploads" className={trigger}><Youtube className="h-4 w-4" /> New uploads</TabsTrigger>
          <TabsTrigger value="novels" className={trigger}><BookOpen className="h-4 w-4" /> Novels</TabsTrigger>
          <TabsTrigger value="categories" className={trigger}><LayoutGrid className="h-4 w-4" /> Categories</TabsTrigger>
          <TabsTrigger value="reviews" className={trigger}><Star className="h-4 w-4" /> Reviews{waiting ? ` (${waiting})` : ""}</TabsTrigger>
          <TabsTrigger value="messages" className={trigger}><Inbox className="h-4 w-4" /> Messages</TabsTrigger>
          <TabsTrigger value="pdfs" className={trigger}><FileText className="h-4 w-4" /> PDFs</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="uploads"><UploadsPanel onChanged={onChanged} /></TabsContent>
          <TabsContent value="novels"><NovelsPanel onChanged={onChanged} version={version} /></TabsContent>
          <TabsContent value="categories"><CategoriesPanel key={version} onChanged={onChanged} /></TabsContent>
          <TabsContent value="reviews"><ReviewsPanel /></TabsContent>
          <TabsContent value="messages"><FeedbackPanel /></TabsContent>
          <TabsContent value="pdfs"><PdfPanel /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
