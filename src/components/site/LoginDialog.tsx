import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setReaderName, useReaderName } from "@/lib/reader";

export function LoginDialog() {
  const [open, setOpen] = useState(false);
  const current = useReaderName();
  const [name, setName] = useState("");

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("nf:open-login", onOpen);
    return () => window.removeEventListener("nf:open-login", onOpen);
  }, []);

  useEffect(() => {
    if (open) setName(current ?? "");
  }, [open, current]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) {
      toast.error("Please write at least 2 letters.");
      return;
    }
    setReaderName(clean);
    toast.success(`Welcome, ${clean}!`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card-grad gold-frame sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-gold">Enter the library</DialogTitle>
          <DialogDescription>
            Just pick a reader name. No password needed. Your name appears on your reviews.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="mt-2 flex flex-col gap-3">
          <Input
            autoFocus
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name, e.g. Ayesha"
            aria-label="Your reader name"
            className="h-11"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="gold" className="flex-1">
              {current ? "Save name" : "Login"}
            </Button>
            {current && (
              <Button
                type="button"
                variant="glass"
                onClick={() => {
                  setReaderName(null);
                  setOpen(false);
                  toast("You are logged out.");
                }}
              >
                Logout
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
