import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Trash2, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Payslip {
  id: string;
  user_id: string;
  title: string;
  pay_period_start: string;
  pay_period_end: string;
  file_url: string;
  created_at: string;
}

export function AdminPayslipsList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check admin status
  const { data: isAdmin } = useQuery({
    queryKey: ["has-management-access", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .in("role", ["admin", "manager"]);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

  // Fetch all payslips with profile info
  const { data: payslips, isLoading } = useQuery({
    queryKey: ["all-payslips"],
    queryFn: async () => {
      const { data: payslipsData, error } = await supabase
        .from("payslips")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each payslip
      const userIds = [...new Set(payslipsData.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

      return payslipsData.map((payslip) => ({
        ...payslip,
        profile: profileMap.get(payslip.user_id),
      }));
    },
    enabled: !!user && isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (payslip: Payslip) => {
      // Delete from storage
      const pathMatch = payslip.file_url.match(/payslips\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("payslips").remove([pathMatch[1]]);
      }

      // Delete from database
      const { error } = await supabase.from("payslips").delete().eq("id", payslip.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payslip deleted");
      queryClient.invalidateQueries({ queryKey: ["all-payslips"] });
      queryClient.invalidateQueries({ queryKey: ["my-payslips"] });
    },
    onError: () => {
      toast.error("Failed to delete payslip");
    },
  });

  const handleDownload = async (fileUrl: string) => {
    try {
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
      window.open(fileUrl, "_blank");
    } catch (error) {
      console.error("Error downloading payslip:", error);
    }
  };

  if (!isAdmin) return null;

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
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Payslips Uploaded</h3>
          <p className="text-muted-foreground text-sm">
            Use the "Upload Payslip" button to add payslips for employees.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          All Payslips
        </CardTitle>
        <CardDescription>
          Manage payslips for all employees
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Pay Period</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">
                    {payslip.profile?.full_name || "Unknown"}
                    {payslip.profile?.email && (
                      <span className="block text-xs text-muted-foreground">
                        {payslip.profile.email}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{payslip.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {format(new Date(payslip.pay_period_start), "MMM d")} -{" "}
                      {format(new Date(payslip.pay_period_end), "MMM d, yyyy")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(payslip.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(payslip.file_url)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Payslip</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this payslip? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(payslip)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
