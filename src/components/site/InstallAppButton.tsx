import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useInstallApp } from "@/lib/pwa";

/** "Install app" button. Hidden once the site is already opened as an installed app. */
export function InstallAppButton({ className, variant = "glass", size = "sm" }: Pick<ButtonProps, "className" | "variant" | "size">) {
  const { installed, install } = useInstallApp();
  if (installed) return null;

  const onClick = async () => {
    const result = await install();
    if (result === "ios") {
      toast("Install on iPhone", { description: "Tap the Share button, then “Add to Home Screen”." });
    } else if (result === "unavailable") {
      toast("Install the app", {
        description: "Open your browser menu (⋮) and choose “Install app” or “Add to Home screen”.",
      });
    }
  };

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={() => void onClick()}>
      <Download /> Install app
    </Button>
  );
}
