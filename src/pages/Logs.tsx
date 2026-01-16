import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Package, Search, Filter, FileText } from "lucide-react";
import { useState } from "react";

interface LogEntry {
  id: string;
  docketNumber: string;
  date: string;
  client: string;
  asset: string;
  pickupAddress: string;
  dropoffAddress: string;
  loadType: string;
  startTime: string;
  finishTime: string;
  breakDuration: number;
  status: "completed" | "pending" | "in-progress";
  jobDetails: string;
}

const mockLogs: LogEntry[] = [
  {
    id: "1",
    docketNumber: "TFS-2024-0001",
    date: "2024-01-15",
    client: "ABC Construction",
    asset: "Truck 001",
    pickupAddress: "123 Main St, Sydney NSW 2000",
    dropoffAddress: "456 Industrial Ave, Parramatta NSW 2150",
    loadType: "Concrete",
    startTime: "07:00",
    finishTime: "15:30",
    breakDuration: 30,
    status: "completed",
    jobDetails: "Demolition waste from site clearance",
  },
  {
    id: "2",
    docketNumber: "TFS-2024-0002",
    date: "2024-01-15",
    client: "XYZ Builders",
    asset: "Truck 003",
    pickupAddress: "789 Site Rd, Blacktown NSW 2148",
    dropoffAddress: "321 Depot St, Penrith NSW 2750",
    loadType: "Mixed Waste",
    startTime: "06:30",
    finishTime: "14:00",
    breakDuration: 45,
    status: "completed",
    jobDetails: "General construction waste removal",
  },
  {
    id: "3",
    docketNumber: "TFS-2024-0003",
    date: "2024-01-15",
    client: "Metro Demolition",
    asset: "Truck 002",
    pickupAddress: "555 Demo Lane, Liverpool NSW 2170",
    dropoffAddress: "888 Recycling Rd, Wetherill Park NSW 2164",
    loadType: "Steel",
    startTime: "08:00",
    finishTime: "",
    breakDuration: 0,
    status: "in-progress",
    jobDetails: "Steel beam collection from demolished warehouse",
  },
  {
    id: "4",
    docketNumber: "TFS-2024-0004",
    date: "2024-01-14",
    client: "City Council",
    asset: "Truck 001",
    pickupAddress: "100 Council St, Bankstown NSW 2200",
    dropoffAddress: "200 Waste Rd, Chullora NSW 2190",
    loadType: "Green Waste",
    startTime: "07:30",
    finishTime: "16:00",
    breakDuration: 60,
    status: "completed",
    jobDetails: "Park maintenance waste collection",
  },
];

const statusStyles = {
  completed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  "in-progress": "bg-primary/10 text-primary border-primary/20",
};

const calculateHours = (start: string, finish: string, breakMins: number): string => {
  if (!finish) return "In Progress";
  const [startH, startM] = start.split(":").map(Number);
  const [finishH, finishM] = finish.split(":").map(Number);
  const totalMins = (finishH * 60 + finishM) - (startH * 60 + startM) - breakMins;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins}m`;
};

const Logs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch = 
      log.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.docketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.asset.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Runsheet Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your runsheet entries
          </p>
        </div>

        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client, docket number, or asset..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="shadow-card hover:shadow-elevated transition-shadow animate-fade-in">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm font-semibold text-primary">
                          {log.docketNumber}
                        </span>
                      </div>
                      <Badge variant="outline" className={statusStyles[log.status]}>
                        {log.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.date}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <h3 className="text-lg font-semibold text-foreground">
                        {log.client}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        {log.asset} • {log.loadType}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                        <span><strong>Pick up:</strong> {log.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
                        <span><strong>Drop off:</strong> {log.dropoffAddress}</span>
                      </div>
                    </div>

                    {log.jobDetails && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {log.jobDetails}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 lg:text-right lg:min-w-[120px]">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground lg:order-2" />
                      <span className="font-medium">
                        {log.startTime} - {log.finishTime || "Now"}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {calculateHours(log.startTime, log.finishTime, log.breakDuration)}
                    </div>
                    {log.breakDuration > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({log.breakDuration}m break)
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No logs found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Logs;
