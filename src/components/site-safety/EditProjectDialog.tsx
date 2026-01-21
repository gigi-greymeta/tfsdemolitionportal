import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Users, Settings, Loader2, UserMinus, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  address: string | null;
  client_id: string | null;
  project_number: string | null;
}

interface EditProjectDialogProps {
  project: Project;
  trigger?: React.ReactNode;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string | null;
}

interface Enrollment {
  id: string;
  user_id: string;
  status: string;
  profiles: UserProfile;
}

export function EditProjectDialog({ project, trigger }: EditProjectDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [formData, setFormData] = useState({
    name: project.name,
    address: project.address || "",
    clientId: project.client_id || "",
    projectNumber: project.project_number?.replace("TFS-", "") || "",
  });

  // Reset form when project changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: project.name,
        address: project.address || "",
        clientId: project.client_id || "",
        projectNumber: project.project_number?.replace("TFS-", "") || "",
      });
    }
  }, [project, open]);

  // Fetch clients
  const { data: clients } = useQuery({
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

  // Fetch enrolled users
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["project-enrollments", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_enrollments")
        .select(`
          id,
          user_id,
          status
        `)
        .eq("project_id", project.id);
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch all users for assignment
  const { data: allUsers } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: open,
  });

  // Combine enrollments with profile data
  const enrolledUsers = enrollments?.map(enrollment => {
    const profile = allUsers?.find(u => u.user_id === enrollment.user_id);
    return {
      ...enrollment,
      profiles: profile || { user_id: enrollment.user_id, full_name: "Unknown User", email: null }
    };
  }) || [];

  // Get users not enrolled
  const unenrolledUsers = allUsers?.filter(
    user => !enrollments?.some(e => e.user_id === user.user_id)
  ) || [];

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      const fullProjectNumber = formData.projectNumber 
        ? `TFS-${formData.projectNumber}` 
        : null;

      const { error } = await supabase
        .from("projects")
        .update({
          name: formData.name,
          address: formData.address || null,
          client_id: formData.clientId || null,
          project_number: fullProjectNumber,
        })
        .eq("id", project.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project Updated",
        description: "Project details have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add user to project
  const addUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("project_enrollments")
        .insert({
          project_id: project.id,
          user_id: userId,
          status: "approved",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-enrollments", project.id] });
      toast({
        title: "User Added",
        description: "User has been added to the project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add User",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove user from project
  const removeUserMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from("project_enrollments")
        .delete()
        .eq("id", enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-enrollments", project.id] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast({
        title: "User Removed",
        description: "User has been removed from the project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Remove User",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isValid = formData.name.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Project
          </DialogTitle>
          <DialogDescription>
            Update project details and manage assigned users
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="gap-2">
              <Settings className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              {/* Project Number */}
              <div className="space-y-2">
                <Label htmlFor="edit-project-number">Project Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    TFS-
                  </span>
                  <Input
                    id="edit-project-number"
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
                <Label htmlFor="edit-project-name">Project Name *</Label>
                <Input
                  id="edit-project-name"
                  placeholder="Enter project name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  placeholder="Enter project address"
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
              </div>

              <Button
                onClick={() => updateProjectMutation.mutate()}
                disabled={!isValid || updateProjectMutation.isPending}
                className="w-full"
              >
                {updateProjectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="users" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Enrolled Users */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Label className="mb-2">Enrolled Users ({enrolledUsers.length})</Label>
                <ScrollArea className="flex-1 border rounded-md max-h-40">
                  <div className="p-2 space-y-1">
                    {enrollmentsLoading ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : !enrolledUsers.length ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No users enrolled yet
                      </div>
                    ) : (
                      enrolledUsers.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {enrollment.profiles.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {enrollment.profiles.email}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeUserMutation.mutate(enrollment.id)}
                            disabled={removeUserMutation.isPending}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Add Users */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Label className="mb-2">Add Users ({unenrolledUsers.length} available)</Label>
                <ScrollArea className="flex-1 border rounded-md max-h-40">
                  <div className="p-2 space-y-1">
                    {!unenrolledUsers.length ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        All users are enrolled
                      </div>
                    ) : (
                      unenrolledUsers.map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {user.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                            onClick={() => addUserMutation.mutate(user.user_id)}
                            disabled={addUserMutation.isPending}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
