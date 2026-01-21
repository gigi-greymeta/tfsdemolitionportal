import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface PayslipUploadDialogProps {
  trigger?: React.ReactNode;
}

export function PayslipUploadDialog({ trigger }: PayslipUploadDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");

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
    enabled: !!user && open,
  });

  // Fetch all profiles for assignment
  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: open && isAdmin,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !selectedUserId || !payPeriodStart || !payPeriodEnd) {
        throw new Error("Please fill in all required fields");
      }

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${selectedUserId}/${Date.now()}-${title.replace(/\s+/g, "-")}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payslips")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the file URL
      const { data: urlData } = supabase.storage
        .from("payslips")
        .getPublicUrl(fileName);

      // Create payslip record
      const { error: insertError } = await supabase.from("payslips").insert({
        user_id: selectedUserId,
        title: title || `Payslip - ${payPeriodEnd}`,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        file_url: urlData.publicUrl,
        uploaded_by: user?.id,
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Payslip uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["my-payslips"] });
      queryClient.invalidateQueries({ queryKey: ["all-payslips"] });
      resetForm();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload payslip");
    },
  });

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setSelectedUserId("");
    setPayPeriodStart("");
    setPayPeriodEnd("");
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Payslip
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Payslip</DialogTitle>
          <DialogDescription>
            Upload a payslip and assign it to an employee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label>Assign to Employee *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map((profile) => (
                  <SelectItem key={profile.user_id} value={profile.user_id}>
                    {profile.full_name} {profile.email && `(${profile.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="e.g., Weekly Pay - Week 12"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Pay Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pay Period Start *</Label>
              <Input
                type="date"
                value={payPeriodStart}
                onChange={(e) => setPayPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Pay Period End *</Label>
              <Input
                type="date"
                value={payPeriodEnd}
                onChange={(e) => setPayPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Payslip File (PDF) *</Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending || !file || !selectedUserId || !payPeriodStart || !payPeriodEnd}
            className="w-full gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Payslip
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
