import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StatKind = "view" | "pdf_read" | "pdf_download";

export const statsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["novel-stats", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_novel_stats", { _slug: slug });
      if (error) throw error;
      return data?.[0] ?? { views: 0, pdf_reads: 0, pdf_downloads: 0 };
    },
  });

export const ratingQuery = (slug: string) =>
  queryOptions({
    queryKey: ["novel-rating", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_novel_rating", { _slug: slug });
      if (error) throw error;
      const row = data?.[0];
      return { avg: Number(row?.avg_rating ?? 0), count: row?.rating_count ?? 0 };
    },
  });

export const reviewsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["reviews", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_novel_reviews", { _slug: slug });
      if (error) throw error;
      return data ?? [];
    },
  });

export const latestReviewsQuery = () =>
  queryOptions({
    queryKey: ["reviews", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_latest_reviews");
      if (error) throw error;
      return data ?? [];
    },
  });

export const pdfListQuery = () =>
  queryOptions({
    queryKey: ["novel-pdf", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_novel_pdfs");
      if (error) throw error;
      return data ?? [];
    },
  });

export const pdfQuery = (slug: string) =>
  queryOptions({
    ...pdfListQuery(),
    select: (rows: Awaited<ReturnType<NonNullable<ReturnType<typeof pdfListQuery>["queryFn"]>>>) =>
      rows.find((r) => r.novel_slug === slug) ?? null,
  });

export async function bumpStat(slug: string, kind: StatKind) {
  const { error } = await supabase.rpc("bump_stat", { _slug: slug, _kind: kind });
  if (error) console.warn("stat not counted", error.message);
}

/**
 * Short-lived link to a library PDF. The bucket is private; visitors may only sign files the
 * admin registered (database rule), so this runs in the browser and needs no server secret.
 */
export async function pdfUrl(slug: string, download: boolean) {
  const path = `${slug}.pdf`;
  const { data, error } = await supabase.storage
    .from("novel-pdfs")
    .createSignedUrl(path, 60 * 10, download ? { download: `${slug}.pdf` } : undefined);
  if (error || !data?.signedUrl) throw new Error("No PDF for this novel.");
  return data.signedUrl;
}

export async function addReview(input: {
  slug: string;
  name: string;
  rating: number;
  comment: string;
}) {
  const { error } = await supabase.from("reviews").insert({
    novel_slug: input.slug,
    name: input.name.trim().slice(0, 60),
    rating: input.rating,
    comment: input.comment.trim().slice(0, 1000),
  });
  if (error) throw error;
}

export async function sendFeedback(input: { name: string; contact: string; message: string }) {
  const { error } = await supabase.from("feedback").insert({
    name: input.name.trim().slice(0, 80),
    contact: input.contact.trim().slice(0, 120),
    message: input.message.trim().slice(0, 2000),
  });
  if (error) throw error;
}
