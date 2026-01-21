import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  PenLine, 
  Loader2, 
  FileText, 
  User, 
  Calendar, 
  Building2,
  ExternalLink,
  Eraser
} from "lucide-react";
import { toast } from "sonner";

interface SignaturePageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    title: string;
    description: string | null;
    document_type: string;
    version: string | null;
    file_url: string | null;
    projects: {
      id: string;
      name: string;
    };
  } | null;
}

export function SignaturePage({ open, onOpenChange, document }: SignaturePageProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!document || !user || !canvasRef.current) throw new Error("Missing required data");

      const signatureData = canvasRef.current.toDataURL("image/png");

      const { error } = await supabase
        .from("document_signatures")
        .insert({
          document_id: document.id,
          user_id: user.id,
          signature_data: signatureData,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["my-assigned-documents"] });
      toast.success("Document signed successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Failed to sign document", { description: error.message });
    },
  });

  const resetForm = () => {
    setAcknowledged(false);
    setHasSignature(false);
    clearCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasSignature(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isValid = acknowledged && hasSignature;

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Signature Page
          </DialogTitle>
          <DialogDescription>
            Review and sign the document below
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Document Info Section */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Document</p>
                <p className="font-semibold">{document.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{document.projects.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  <span className="font-medium">{document.document_type}</span>
                </div>
              </div>

              {document.description && (
                <p className="text-sm text-muted-foreground">{document.description}</p>
              )}

              {document.file_url && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Document
                  </a>
                </Button>
              )}
            </div>

            <Separator />

            {/* Signatory Details */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Signatory Details</p>
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(new Date())}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Acknowledgement */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                />
                <Label htmlFor="acknowledge" className="text-sm leading-relaxed cursor-pointer">
                  I confirm that I have read and understood this document in its entirety. 
                  I acknowledge that my electronic signature below constitutes my legal 
                  signature and acceptance of the terms and conditions contained within.
                </Label>
              </div>
            </div>

            <Separator />

            {/* Signature Pad */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <PenLine className="h-4 w-4" />
                  Your Signature
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCanvas}
                  disabled={!hasSignature}
                >
                  <Eraser className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Use your mouse or finger to sign above
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => signMutation.mutate()}
            disabled={!isValid || signMutation.isPending}
          >
            {signMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Signing...
              </>
            ) : (
              <>
                <PenLine className="h-4 w-4 mr-1" />
                Submit Signature
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
