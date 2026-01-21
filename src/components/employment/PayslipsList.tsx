import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function PayslipsList() {
  const { user } = useAuth();

  const { data: payslips, isLoading } = useQuery({
    queryKey: ["my-payslips", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslips")
        .select("*")
        .order("pay_period_end", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      // Extract the path from the URL
      const urlParts = fileUrl.split("/storage/v1/object/public/payslips/");
      if (urlParts.length < 2) {
        // Try signed URL approach for private bucket
        const pathMatch = fileUrl.match(/payslips\/(.+)$/);
        if (pathMatch) {
          const { data, error } = await supabase.storage
            .from("payslips")
            .createSignedUrl(pathMatch[1], 60);
          
          if (error) throw error;
          if (data?.signedUrl) {
            window.open(data.signedUrl, "_blank");
            return;
          }
        }
      }
      window.open(fileUrl, "_blank");
    } catch (error) {
      console.error("Error downloading payslip:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payslips || payslips.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Payslips</h3>
          <p className="text-muted-foreground text-sm">
            You don't have any payslips yet. They will appear here once uploaded by admin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {payslips.map((payslip) => (
        <Card key={payslip.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{payslip.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(payslip.pay_period_start), "MMM d")} - {format(new Date(payslip.pay_period_end), "MMM d, yyyy")}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {format(new Date(payslip.created_at), "MMM d, yyyy")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleDownload(payslip.file_url, payslip.title)}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
