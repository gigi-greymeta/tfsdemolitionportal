import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLES: { value: AppRole; label: string }[] = [
  { value: "driver", label: "Driver" },
  { value: "contractor", label: "Contractor" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

interface User {
  user_id: string;
  full_name: string;
  email: string | null;
  role: AppRole;
}

interface EditUserDialogProps {
  user: User;
  trigger?: React.ReactNode;
}

export function EditUserDialog({ user, trigger }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user.email || "");
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState<AppRole>(user.role);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setEmail(user.email || "");
      setFullName(user.full_name);
      setRole(user.role);
    }
  }, [open, user]);

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, email, fullName }: { userId: string; email: string; fullName: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-update-user", {
        body: { userId, email, fullName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update user details if changed
    if (email !== user.email || fullName !== user.full_name) {
      await updateUserMutation.mutateAsync({ 
        userId: user.user_id, 
        email: email.trim(), 
        fullName: fullName.trim() 
      });
    }

    // Update role if changed
    if (role !== user.role) {
      await updateRoleMutation.mutateAsync({ userId: user.user_id, role });
    }

    setOpen(false);
  };

  const isPending = updateUserMutation.isPending || updateRoleMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-fullName">Full Name</Label>
            <Input
              id="edit-fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
