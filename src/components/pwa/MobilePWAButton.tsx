import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function MobilePWAButton() {
  const isMobile = useIsMobile();
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowDialog(false);
    }
  };

  // Don't show if not mobile, already installed, or no prompt available
  if (!isMobile || isInstalled) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 shadow-lg bg-card border-primary/30 gap-2 safe-area-bottom"
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install TFS Runsheets
            </DialogTitle>
            <DialogDescription>
              Add this app to your home screen for quick access and offline support.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isIOS ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To install on iOS:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span>Tap the</span>
                    <Share className="h-4 w-4 inline-block flex-shrink-0 mt-0.5" />
                    <span>Share button</span>
                  </li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
            ) : deferredPrompt ? (
              <Button onClick={handleInstall} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Install Now
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To install on your device:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Open browser menu (⋮ or ⋯)</li>
                  <li>Select "Add to Home Screen" or "Install App"</li>
                  <li>Confirm the installation</li>
                </ol>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
