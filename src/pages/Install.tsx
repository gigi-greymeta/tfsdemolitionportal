import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Download, Smartphone, Monitor, Apple, Chrome } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the install prompt
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
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Install TFS Runsheets</h1>
            <p className="text-muted-foreground">
              Install this app on your device for quick access and offline use
            </p>
          </div>

          {isInstalled ? (
            <Card className="border-green-500/50 bg-green-500/10">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Download className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-green-500">App Already Installed!</h3>
                <p className="text-muted-foreground mt-2">
                  You're already using the installed version of TFS Runsheets.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {deferredPrompt && (
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Chrome className="h-5 w-5" />
                      Install Now
                    </CardTitle>
                    <CardDescription>
                      Click the button below to install the app directly
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleInstall} size="lg" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Install App
                    </Button>
                  </CardContent>
                </Card>
              )}

              {isIOS && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Apple className="h-5 w-5" />
                      Install on iPhone/iPad
                    </CardTitle>
                    <CardDescription>
                      Follow these steps to add to your home screen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ol className="list-decimal list-inside space-y-3 text-sm">
                      <li>Tap the <strong>Share</strong> button in Safari (the square with an arrow)</li>
                      <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                      <li>Tap <strong>"Add"</strong> in the top right corner</li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Smartphone className="h-5 w-5" />
                      Mobile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      On Android, use Chrome's menu (⋮) and tap "Install app" or "Add to Home screen".
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Monitor className="h-5 w-5" />
                      Desktop
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      In Chrome or Edge, click the install icon in the address bar, or use the browser menu.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Install;
