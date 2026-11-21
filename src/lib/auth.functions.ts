import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export function isVerifiedEmailMatch(
  authEmail: string | null | undefined,
  confirmedAt: string | null,
  importedEmail: string | null | undefined,
) {
  return Boolean(
    authEmail &&
      confirmedAt &&
      importedEmail &&
      authEmail.trim().toLowerCase() === importedEmail.trim().toLowerCase(),
  );
}

export function safeAuthReturnPath(value: string | undefined, origin: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  try {
    const base = new URL(origin);
    const target = new URL(value, base);
    if (target.origin !== base.origin) return "/admin";
    if (target.pathname === "/auth" || target.pathname.startsWith("/auth/")) return "/admin";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/admin";
  }
}

/** Link an account only after its owner verifies the same email as the exported identity. */
export const claimLegacyIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const { data, error: authError } = await context.supabase.auth.getUser();
    const user = data.user;
    if (authError || !user?.email || !user.email_confirmed_at) return { linked: false };

    // Hosts without the private service key (e.g. a Vercel copy) skip legacy linking.
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return { linked: false };
    const email = user.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: imported, error: lookupError } = await supabaseAdmin
      .from("legacy_user_imports")
      .select("legacy_user_id, email, role, cloud_user_id")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) throw new Error("Could not check the original account.");
    if (!imported || !isVerifiedEmailMatch(user.email, user.email_confirmed_at, imported.email)) {
      return { linked: false };
    }
    if (imported.cloud_user_id && imported.cloud_user_id !== context.userId) {
      return { linked: false };
    }

    if (!imported.cloud_user_id) {
      const { data: linked, error: linkError } = await supabaseAdmin
        .from("legacy_user_imports")
        .update({ cloud_user_id: context.userId, claimed_at: new Date().toISOString() })
        .eq("legacy_user_id", imported.legacy_user_id)
        .is("cloud_user_id", null)
        .select("legacy_user_id")
        .maybeSingle();

      if (linkError) throw new Error("Could not link the original account.");
      if (!linked) {
        const { data: current, error: currentError } = await supabaseAdmin
          .from("legacy_user_imports")
          .select("cloud_user_id")
          .eq("legacy_user_id", imported.legacy_user_id)
          .maybeSingle();
        if (currentError) throw new Error("Could not verify the account link.");
        if (current?.cloud_user_id !== context.userId) return { linked: false };
      }
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: imported.role }, { onConflict: "user_id,role" });
    if (roleError) throw new Error("Could not restore the original account access.");

    return { linked: true };
  });