import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Send } from "lucide-react";

const mockClients = ["ABC Construction", "XYZ Builders", "Metro Demolition", "City Council"];
const mockAssets = ["Truck 001", "Truck 002", "Truck 003", "Excavator 001"];
const loadTypes = ["Concrete", "Steel", "Mixed Waste", "Bricks", "Timber", "Asbestos", "Green Waste", "Soil"];

export function RunsheetForm() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    finishTime: "",
    breakDuration: "",
    asset: "",
    client: "",
    pickupAddress: "",
    dropoffAddress: "",
    jobDetails: "",
    loadType: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Runsheet entry submitted successfully!", {
      description: "A docket has been created for this entry.",
    });
  };

  const handleSaveDraft = () => {
    toast.info("Draft saved", {
      description: "Your entry has been saved as a draft.",
    });
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
                value={formData.breakDuration}
                onChange={(e) => updateField("breakDuration", e.target.value)}
              />
            </div>
          </div>

          {/* Asset and Client Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset">Asset</Label>
              <Select value={formData.asset} onValueChange={(v) => updateField("asset", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {mockAssets.map((asset) => (
                    <SelectItem key={asset} value={asset}>
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={formData.client} onValueChange={(v) => updateField("client", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {mockClients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
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
            <Button type="button" variant="outline" onClick={handleSaveDraft} className="flex-1 sm:flex-none">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none">
              <Send className="h-4 w-4" />
              Submit Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
