import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Check if user previously dismissed the prompt
    const promptDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (promptDismissed) {
      const dismissedTime = parseInt(promptDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    
    if (isIOSDevice) {
      // Show prompt for iOS after a short delay
      setTimeout(() => setShowPrompt(true), 1000);
    }

    // Listen for the install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 1000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 left-3 right-3 z-50 border-primary/50 shadow-elevated animate-in slide-in-from-bottom-4 duration-300 sm:left-auto sm:right-4 sm:max-w-sm">
      <CardContent className="p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install TFS Runsheets</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS 
                ? "Add to Home Screen for quick access"
                : "Install for offline access and quick launch"
              }
            </p>
            
            {isIOS ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                <Share className="h-4 w-4 flex-shrink-0" />
                <span>Tap Share, then "Add to Home Screen"</span>
              </div>
            ) : deferredPrompt ? (
              <Button 
                onClick={handleInstall} 
                size="sm" 
                className="mt-3 w-full h-9 touch-target"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
