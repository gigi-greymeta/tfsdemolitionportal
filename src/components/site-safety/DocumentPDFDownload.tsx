import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateDocumentPDF } from "@/lib/pdf-generator";
import { toast } from "sonner";

interface DocumentPDFDownloadProps {
  documentId: string;
  documentTitle: string;
  documentType: string;
  version: string | null;
  projectName: string;
  projectNumber: string | null;
  description: string | null;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DocumentPDFDownload({
  documentId,
  documentTitle,
  documentType,
  version,
  projectName,
  projectNumber,
  description,
  variant = "outline",
  size = "sm",
}: DocumentPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch all signatures for this document with user names
  const { data: signatures } = useQuery({
    queryKey: ["document-signatures-for-pdf", documentId],
    queryFn: async () => {
      // First get signatures
      const { data: sigs, error } = await supabase
        .from("document_signatures")
        .select("id, signed_at, signature_data, user_id")
        .eq("document_id", documentId)
        .order("signed_at", { ascending: true });

      if (error) throw error;
      if (!sigs?.length) return [];

      // Get user profiles for all signers
      const userIds = sigs.map((s) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      // Merge data
      return sigs.map((sig) => ({
        ...sig,
        full_name: profiles?.find((p) => p.user_id === sig.user_id)?.full_name || "Unknown",
      }));

    },
  });

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const baseUrl = window.location.origin + "/tfsapp";

      const pdfBlob = await generateDocumentPDF({
        documentId,
        title: documentTitle,
        documentType,
        version,
        projectName,
        projectNumber,
        description,
        baseUrl,
        signatures: (signatures || []).map((sig) => ({
          name: sig.full_name,
          signatureData: sig.signature_data,
          signedAt: sig.signed_at,
        })),
      });

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${documentTitle.replace(/[^a-z0-9]/gi, "_")}_SignOnSheet.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {size !== "icon" && <span className="ml-1">PDF</span>}
    </Button>
  );
}
