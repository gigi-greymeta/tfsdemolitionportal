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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, MapPin, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type LoadType = Database["public"]["Enums"]["load_type"];

const LOAD_TYPES: LoadType[] = [
  "Concrete",
  "Steel",
  "Mixed Waste",
  "Bricks",
  "Timber",
  "Asbestos",
  "Green Waste",
  "Soil",
  "Other",
];

interface QuickProjectDialogProps {
  trigger?: React.ReactNode;
}

export function QuickProjectDialog({ trigger }: QuickProjectDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    fromLocation: "",
    toLocation: "",
    jobType: "" as LoadType | "",
    clientId: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

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
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const projectName = `${formData.fromLocation} → ${formData.toLocation}`;
      const projectAddress = `From: ${formData.fromLocation} | To: ${formData.toLocation}`;
      
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: projectName,
          address: projectAddress,
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

      // Create a log entry for this quick project
      if (formData.startDate && formData.jobType) {
        const { error: logError } = await supabase
          .from("logs")
          .insert({
            user_id: user.id,
            pickup_address: formData.fromLocation,
            dropoff_address: formData.toLocation,
            load_type: formData.jobType,
            client_id: formData.clientId || null,
            date: format(formData.startDate, "yyyy-MM-dd"),
            start_time: "08:00",
            status: "in-progress",
          });

        if (logError) console.error("Log creation failed:", logError);
      }

      // Notify admins
      await supabase
        .from("admin_notifications")
        .insert({
          type: "new_project",
          title: "New Quick Project Created",
          message: `New project: ${projectName}`,
          user_id: user.id,
          related_id: project.id,
        });

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      
      toast({
        title: "Project Created",
        description: "Your quick project has been created successfully.",
      });
      
      setOpen(false);
      setFormData({
        fromLocation: "",
        toLocation: "",
        jobType: "",
        clientId: "",
        startDate: undefined,
        endDate: undefined,
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

  const isValid = formData.fromLocation && formData.toLocation && formData.jobType && formData.startDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Quick Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Quick Project
          </DialogTitle>
          <DialogDescription>
            Create a new project with job details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* From Location */}
          <div className="space-y-2">
            <Label htmlFor="from-location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              From Location
            </Label>
            <Input
              id="from-location"
              placeholder="Enter pickup address"
              value={formData.fromLocation}
              onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
            />
          </div>

          {/* To Location */}
          <div className="space-y-2">
            <Label htmlFor="to-location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              To Location
            </Label>
            <Input
              id="to-location"
              placeholder="Enter dropoff address"
              value={formData.toLocation}
              onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
            />
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <Label>Job Type</Label>
            <Select
              value={formData.jobType}
              onValueChange={(value: LoadType) => setFormData({ ...formData, jobType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {LOAD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "MMM d") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData({ ...formData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "MMM d") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData({ ...formData, endDate: date })}
                    disabled={(date) => formData.startDate ? date < formData.startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
