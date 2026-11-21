import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MAX_PDF_BYTES = 50 * 1024 * 1024;

export function isAdminRole(role: string | null | undefined) {
  return role === "admin";
}

export const isAdminQuery = (userId: string) =>
  queryOptions({
    queryKey: ["is-admin", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return isAdminRole(data?.role);
    },
  });

export const feedbackQuery = () =>
  queryOptions({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("id, name, contact, message, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

export const allReviewsQuery = () =>
  queryOptions({
    queryKey: ["reviews", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, novel_slug, name, rating, comment, created_at, reply, replied_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

/** Full PDF list for the owner area (includes storage locations; admins only). */
export const adminPdfListQuery = () =>
  queryOptions({
    queryKey: ["novel-pdf", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novel_pdfs")
        .select("novel_slug, file_path, file_size, uploaded_at")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export async function uploadNovelPdf(slug: string, file: File) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files can be uploaded.");
  }
  if (file.size > MAX_PDF_BYTES) throw new Error("The PDF is larger than 50 MB.");
  const path = `${slug}.pdf`;
  const { error: upErr } = await supabase.storage
    .from("novel-pdfs")
    .upload(path, file, { upsert: true, contentType: "application/pdf" });
  if (upErr) throw upErr;
  const { error } = await supabase
    .from("novel_pdfs")
    .upsert({ novel_slug: slug, file_path: path, file_size: file.size, uploaded_at: new Date().toISOString() });
  if (error) throw error;
}

export async function removeNovelPdf(slug: string, filePath: string) {
  const { error: delErr } = await supabase.storage.from("novel-pdfs").remove([filePath]);
  if (delErr) throw delErr;
  const { error } = await supabase.from("novel_pdfs").delete().eq("novel_slug", slug);
  if (error) throw error;
}

export async function deleteFeedback(id: string) {
  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}
