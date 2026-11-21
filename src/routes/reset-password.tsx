import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { claimLegacyIdentity } from "@/lib/auth.functions";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Novels Forever" },
      { name: "description", content: "Choose a new password for your Novels Forever owner account." },
      { property: "og:title", content: "Set New Password — Novels Forever" },
      { property: "og:description", content: "Choose a new owner password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const claimIdentity = useServerFn(claimLegacyIdentity);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(`${window.location.search.slice(1)}&${window.location.hash.slice(1)}`);
    const linkType = params.get("type");
    if (linkType === "recovery" || linkType === "invite" || linkType === "signup") {
      setReady(true);
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    void supabase.auth.getUser().then(({ data: result, error }) => {
      if (active && !error && result.user?.email_confirmed_at) setReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { linked } = await claimIdentity({ data: {} });
      if (!linked) {
        await supabase.auth.signOut();
        toast.error("This address could not be matched to a migrated account.");
        await navigate({ to: "/auth", replace: true });
        return;
      }
      toast.success("Password updated.");
      await navigate({ to: "/admin", replace: true });
    } catch {
      toast.error("Could not verify owner access. Please sign in again.");
      await navigate({ to: "/auth", replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="gold-frame rounded-2xl bg-card-grad p-8">
        <h1 className="font-display text-4xl font-semibold">Set a new password</h1>
        {ready ? (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              aria-label="New password"
              autoComplete="new-password"
            />
            <Button type="submit" variant="gold" className="w-full" disabled={busy}>
              {busy ? "Saving…" : "Save password"}
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Open this page from your setup or password-reset email.
          </p>
        )}
      </div>
    </div>
  );
}