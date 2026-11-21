import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { isAdminRole } from "@/lib/admin";
import { claimLegacyIdentity, safeAuthReturnPath } from "@/lib/auth.functions";

type AuthSearch = { redirect?: string };
type AuthMode = "signin" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Owner Sign In — Novels Forever" },
      { name: "description", content: "Sign in to the Novels Forever owner area." },
      { property: "og:title", content: "Owner Sign In — Novels Forever" },
      { property: "og:description", content: "Owner access for Novels Forever." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const claimIdentity = useServerFn(claimLegacyIdentity);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sent, setSent] = useState(false);
  const finishing = useRef(false);

  const finishLogin = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        finishing.current = false;
        setBusy(false);
        setChecking(false);
        return;
      }
      await claimIdentity({ data: {} });
      const { data: role, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleError) throw roleError;
      if (!isAdminRole(role?.role)) {
        await supabase.auth.signOut();
        finishing.current = false;
        setBusy(false);
        setChecking(false);
        toast.error("This account is not authorized for the owner area.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["is-admin", data.user.id] });
      setChecking(false);
      await navigate({
        to: safeAuthReturnPath(redirect, window.location.origin),
        replace: true,
      });
    } catch {
      finishing.current = false;
      setBusy(false);
      setChecking(false);
      toast.error("Could not verify owner access. Please try again.");
    }
  }, [claimIdentity, navigate, queryClient, redirect]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (!error && data.user) void finishLogin();
      else setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [finishLogin]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw new Error("Wrong email or password.");
        await finishLogin();
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "signin" ? "Owner sign-in" : "Reset password";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <div className="gold-frame rounded-lg bg-card-grad p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Owner area</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only the site owner can enter this area. Readers only need a name to leave reviews.
        </p>
        {checking || busy ? (
          <p className="mt-6 text-sm text-muted-foreground">Checking account…</p>
        ) : sent ? (
          <div className="mt-6 rounded-md border border-primary/40 p-4 text-sm">
            Check your email for a secure password reset link.
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                aria-label="Email address"
              />
              {mode === "signin" && (
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                />
              )}
              <Button type="submit" variant="gold" className="w-full" disabled={busy}>
                {mode === "signin" ? "Sign in" : "Send reset link"}
              </Button>
            </form>
            <div className="mt-4 flex flex-col items-center gap-2 text-center text-sm">
              {mode === "signin" ? (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => { setMode("forgot"); setSent(false); }}
                >
                  Forgot password?
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => { setMode("signin"); setSent(false); }}
                >
                  Back to sign in
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      <Link to="/" className="mt-6 text-center text-sm text-muted-foreground hover:text-primary">
        ← Back to the library
      </Link>
    </div>
  );
}