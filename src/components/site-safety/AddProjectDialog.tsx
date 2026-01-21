import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, FolderPlus, Building2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddProjectDialogProps {
  trigger?: React.ReactNode;
}

export function AddProjectDialog({ trigger }: AddProjectDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  const [formData, setFormData] = useState({
    projectNumber: "",
    name: "",
    address: "",
    clientId: "",
  });

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
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

  const { data: clients, refetch: refetchClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const createClientMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      refetchClients();
      setFormData({ ...formData, clientId: data.id });
      setNewClientName("");
      setShowAddClient(false);
      toast({
        title: "Client Created",
        description: `${data.name} has been added.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const fullProjectNumber = `TFS-${formData.projectNumber}`;

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          project_number: fullProjectNumber,
          name: formData.name,
          address: formData.address || null,
          client_id: formData.clientId || null,
          is_active: true,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Auto-enroll the user who created it
      const { error: enrollError } = await supabase
        .from("project_enrollments")
        .insert({
          project_id: project.id,
          user_id: user.id,
          status: "approved",
        });

      if (enrollError) console.error("Auto-enrollment failed:", enrollError);

      // Notify admins
      await supabase.from("admin_notifications").insert({
        type: "new_project",
        title: "New Project Created",
        message: `New project: ${fullProjectNumber} - ${formData.name}`,
        user_id: user.id,
        related_id: project.id,
      });

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });

      toast({
        title: "Project Created",
        description: "The project has been created successfully.",
      });

      setOpen(false);
      setFormData({
        projectNumber: "",
        name: "",
        address: "",
        clientId: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isValid = formData.projectNumber.trim() && formData.name.trim();

  const handleAddClient = () => {
    if (newClientName.trim()) {
      createClientMutation.mutate(newClientName.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Add New Project
          </DialogTitle>
          <DialogDescription>
            Create a new site safety project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Number */}
          <div className="space-y-2">
            <Label htmlFor="project-number">Project Number</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                TFS-
              </span>
              <Input
                id="project-number"
                placeholder="Enter project number"
                className="rounded-l-none"
                value={formData.projectNumber}
                onChange={(e) =>
                  setFormData({ ...formData, projectNumber: e.target.value })
                }
              />
            </div>
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Enter project address (optional)"
              rows={2}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData({ ...formData, clientId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client (optional)" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add Client - Admin Only */}
            {isAdmin && !showAddClient && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 gap-2 w-full"
                onClick={() => setShowAddClient(true)}
              >
                <Building2 className="h-4 w-4" />
                Add New Client
              </Button>
            )}

            {/* Inline Add Client Form */}
            {isAdmin && showAddClient && (
              <div className="mt-2 p-3 border rounded-md bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">New Client</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setShowAddClient(false);
                      setNewClientName("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Enter client name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={handleAddClient}
                  disabled={!newClientName.trim() || createClientMutation.isPending}
                >
                  {createClientMutation.isPending ? "Adding..." : "Add Client"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createProjectMutation.mutate()}
            disabled={!isValid || createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
