import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import { format } from "date-fns";

interface SignOnReportDownloadProps {
  type: "project" | "document";
  id: string;
  name: string;
  projectNumber?: string;
}

export function SignOnReportDownload({ type, id, name, projectNumber }: SignOnReportDownloadProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    setLoading(true);

    try {
      let signOns: Array<{ signed_at: string; user_name: string }> = [];

      if (type === "project") {
        // Fetch project sign-ons
        const { data: signOnData, error: signOnError } = await supabase
          .from("project_signons")
          .select("signed_at, user_id")
          .eq("project_id", id)
          .order("signed_at", { ascending: false });

        if (signOnError) throw signOnError;

        // Get unique user IDs
        const userIds = [...new Set(signOnData?.map(r => r.user_id) || [])];
        
        // Fetch profiles for those users
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

        signOns = (signOnData || []).map((record) => ({
          signed_at: record.signed_at,
          user_name: profileMap.get(record.user_id) || "Unknown User",
        }));
      } else {
        // Fetch document signatures
        const { data: sigData, error: sigError } = await supabase
          .from("document_signatures")
          .select("signed_at, user_id")
          .eq("document_id", id)
          .order("signed_at", { ascending: false });

        if (sigError) throw sigError;

        // Get unique user IDs
        const userIds = [...new Set(sigData?.map(r => r.user_id) || [])];
        
        // Fetch profiles for those users
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

        signOns = (sigData || []).map((record) => ({
          signed_at: record.signed_at,
          user_name: profileMap.get(record.user_id) || "Unknown User",
        }));
      }

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Sign-On Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Subtitle
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(name, pageWidth / 2, yPos, { align: "center" });
      yPos += 6;

      if (projectNumber) {
        doc.setFontSize(10);
        doc.text(`Project #: ${projectNumber}`, pageWidth / 2, yPos, { align: "center" });
        yPos += 6;
      }

      // Report date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, h:mm a")}`, pageWidth / 2, yPos, { align: "center" });
      doc.setTextColor(0);
      yPos += 15;

      // Table header
      const tableStartX = 20;
      const colWidths = [90, 80];
      
      doc.setFillColor(240, 240, 240);
      doc.rect(tableStartX, yPos - 5, colWidths[0] + colWidths[1], 10, "F");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Name", tableStartX + 5, yPos);
      doc.text("Date & Time", tableStartX + colWidths[0] + 5, yPos);
      yPos += 10;

      // Table rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      if (signOns.length === 0) {
        doc.setTextColor(100);
        doc.text("No sign-ons recorded", pageWidth / 2, yPos, { align: "center" });
      } else {
        for (const record of signOns) {
          // Check if we need a new page
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          // Alternate row background
          if (signOns.indexOf(record) % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(tableStartX, yPos - 5, colWidths[0] + colWidths[1], 8, "F");
          }

          doc.setTextColor(0);
          doc.text(record.user_name, tableStartX + 5, yPos);
          doc.text(
            format(new Date(record.signed_at), "dd MMM yyyy, h:mm a"),
            tableStartX + colWidths[0] + 5,
            yPos
          );
          yPos += 8;
        }
      }

      // Footer
      yPos = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Total Sign-Ons: ${signOns.length}`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );

      // Save PDF
      doc.save(`${type}-signon-report-${name.replace(/\s+/g, "-").toLowerCase()}.pdf`);

      toast({
        title: "Report Downloaded",
        description: `Sign-on report for ${name} has been downloaded.`,
      });
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="gap-2"
      onClick={generateReport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Sign-On Report
    </Button>
  );
}
