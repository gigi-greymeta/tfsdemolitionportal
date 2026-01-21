import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Copy, Check } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  type: "project" | "document";
  id: string;
  name: string;
  trigger?: React.ReactNode;
}

export function QRCodeDisplay({ type, id, name, trigger }: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const signOnUrl = type === "project"
    ? `${window.location.origin}/project-sign?project=${id}`
    : `${window.location.origin}/document-sign?doc=${id}`;

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(signOnUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
    };
    generateQR();
  }, [signOnUrl]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.download = `${type}-${name.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(signOnUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <QrCode className="h-4 w-4" />
            QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {type === "project" ? "Project Sign-On" : "Document Sign-On"} QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <p className="text-sm text-muted-foreground text-center">{name}</p>
          
          {qrCodeUrl ? (
            <div className="bg-white p-4 rounded-lg shadow-inner">
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            </div>
          ) : (
            <div className="w-64 h-64 bg-muted animate-pulse rounded-lg" />
          )}

          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {type === "project" 
              ? "Scan to sign onto this project site" 
              : "Scan to sign this document"}
          </p>

          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={handleDownload}
              disabled={!qrCodeUrl}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
