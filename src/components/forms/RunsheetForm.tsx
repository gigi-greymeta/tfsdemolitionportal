import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Send, Loader2 } from "lucide-react";
import { Tables, Constants } from "@/integrations/supabase/types";

type Client = Tables<"clients">;
type Asset = Tables<"assets">;
type LoadType = typeof Constants.public.Enums.load_type[number];

const loadTypes = Constants.public.Enums.load_type;

export function RunsheetForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    finishTime: "",
    breakDuration: "",
    assetId: "",
    clientId: "",
    pickupAddress: "",
    dropoffAddress: "",
    jobDetails: "",
    loadType: "" as LoadType | "",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Asset[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (status: "in-progress" | "completed") => {
      if (!user) throw new Error("Not authenticated");
      if (!formData.loadType) throw new Error("Load type is required");
      
      // Validate break duration
      const breakDuration = formData.breakDuration ? parseInt(formData.breakDuration, 10) : 0;
      if (isNaN(breakDuration) || breakDuration < 0 || breakDuration > 480) {
        throw new Error("Break duration must be between 0 and 480 minutes");
      }
      
      const { error } = await supabase.from("logs").insert({
        user_id: user.id,
        date: formData.date,
        start_time: formData.startTime,
        finish_time: formData.finishTime || null,
        break_duration: breakDuration,
        asset_id: formData.assetId || null,
        client_id: formData.clientId || null,
        pickup_address: formData.pickupAddress,
        dropoff_address: formData.dropoffAddress,
        load_type: formData.loadType as LoadType,
        job_details: formData.jobDetails || null,
        status,
      });
      
      if (error) throw error;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["recent-logs"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      
      if (status === "completed") {
        toast.success("Runsheet entry submitted!", {
          description: "A docket has been created for this entry.",
        });
      } else {
        toast.success("Entry saved as in-progress", {
          description: "You can complete it later.",
        });
      }
      navigate("/");
    },
    onError: (error) => {
      toast.error("Failed to save entry", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate("completed");
  };

  const handleSaveDraft = () => {
    submitMutation.mutate("in-progress");
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="shadow-card animate-slide-up">
      <CardHeader>
        <CardTitle className="text-xl font-bold">New Runsheet Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finishTime">Finish Time</Label>
              <Input
                id="finishTime"
                type="time"
                value={formData.finishTime}
                onChange={(e) => updateField("finishTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakDuration">Break Duration (mins)</Label>
              <Input
                id="breakDuration"
                type="number"
                placeholder="30"
                min="0"
                max="480"
                step="1"
                value={formData.breakDuration}
                onChange={(e) => updateField("breakDuration", e.target.value)}
              />
            </div>
          </div>

          {/* Asset and Client Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset">Asset</Label>
              <Select value={formData.assetId} onValueChange={(v) => updateField("assetId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets?.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} {asset.registration_number && `(${asset.registration_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={formData.clientId} onValueChange={(v) => updateField("clientId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
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
          </div>

          {/* Addresses Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupAddress">Pick Up Address</Label>
              <Input
                id="pickupAddress"
                placeholder="Enter pick up location"
                value={formData.pickupAddress}
                onChange={(e) => updateField("pickupAddress", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dropoffAddress">Drop Off Address</Label>
              <Input
                id="dropoffAddress"
                placeholder="Enter drop off location"
                value={formData.dropoffAddress}
                onChange={(e) => updateField("dropoffAddress", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Load Type and Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loadType">Load Type / Material</Label>
              <Select value={formData.loadType} onValueChange={(v) => updateField("loadType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select load type" />
                </SelectTrigger>
                <SelectContent>
                  {loadTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDetails">Job Details</Label>
            <Textarea
              id="jobDetails"
              placeholder="Enter any additional job details or notes..."
              value={formData.jobDetails}
              onChange={(e) => updateField("jobDetails", e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSaveDraft} 
              className="flex-1 sm:flex-none"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save In Progress
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Completed
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
