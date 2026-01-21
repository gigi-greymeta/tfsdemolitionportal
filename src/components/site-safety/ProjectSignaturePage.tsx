import { useState, useRef, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { 
  PenLine, 
  Loader2, 
  MapPin, 
  User, 
  Calendar, 
  Building2,
  Eraser
} from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  address: string | null;
  clients?: { name: string } | null;
}

interface ProjectSignaturePageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSuccess?: () => void;
}

export function ProjectSignaturePage({ open, onOpenChange, project, onSuccess }: ProjectSignaturePageProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Initialize and resize canvas when dialog opens
  useEffect(() => {
    if (open && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      
      // Set canvas size based on container width
      const containerWidth = container.clientWidth;
      const canvasWidth = Math.min(containerWidth, 400);
      const canvasHeight = 120;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [open]);

  const signOnMutation = useMutation({
    mutationFn: async () => {
      if (!project || !user || !canvasRef.current) throw new Error("Missing required data");

      const signatureData = canvasRef.current.toDataURL("image/png");

      // First, check/create enrollment
      const { data: existingEnrollment } = await supabase
        .from("project_enrollments")
        .select("id")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingEnrollment) {
        const { error: enrollError } = await supabase
          .from("project_enrollments")
          .insert({
            project_id: project.id,
            user_id: user.id,
            status: "approved",
          });
        
        if (enrollError && !enrollError.message.includes("duplicate")) {
          throw enrollError;
        }
      }

      // Create sign-on record with signature
      const { error: signOnError } = await supabase
        .from("project_signons")
        .insert({
          project_id: project.id,
          user_id: user.id,
          signature_data: signatureData,
        });
      
      if (signOnError) throw signOnError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-signon"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      toast.success("Signed onto project successfully");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error("Sign on failed", { description: error.message });
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

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale coordinates to match canvas internal dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if ("touches" in e) {
      e.preventDefault();
    }

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineTo(x, y);
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

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Project Sign-On
          </DialogTitle>
          <DialogDescription>
            Sign on to {project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Info Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Project</p>
              <p className="font-semibold">{project.name}</p>
            </div>
            
            {project.clients?.name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{project.clients.name}</span>
              </div>
            )}

            {project.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{project.address}</span>
              </div>
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
                id="acknowledge-project"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
              />
              <Label htmlFor="acknowledge-project" className="text-sm leading-relaxed cursor-pointer">
                I confirm that I am signing onto this project site. I acknowledge that I have 
                read and understood all relevant safety documentation and will comply with 
                all site safety requirements.
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
            <div 
              ref={containerRef}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white"
            >
              <canvas
                ref={canvasRef}
                className="w-full h-[120px] touch-none cursor-crosshair"
                style={{ touchAction: "none" }}
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

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => signOnMutation.mutate()}
            disabled={!isValid || signOnMutation.isPending}
          >
            {signOnMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Signing On...
              </>
            ) : (
              <>
                <PenLine className="h-4 w-4 mr-1" />
                Sign On
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
