import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Package, Search, Filter, FileText } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/integrations/supabase/types";

type Log = Tables<"logs"> & {
  clients: { name: string } | null;
  assets: { name: string } | null;
  dockets: { docket_number: string }[];
};

const statusStyles = {
  completed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  "in-progress": "bg-primary/10 text-primary border-primary/20",
};

const calculateHours = (start: string, finish: string | null, breakMins: number | null): string => {
  if (!finish) return "In Progress";
  const [startH, startM] = start.split(":").map(Number);
  const [finishH, finishM] = finish.split(":").map(Number);
  const totalMins = (finishH * 60 + finishM) - (startH * 60 + startM) - (breakMins || 0);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins}m`;
};

const Logs = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("logs")
        .select(`
          *,
          clients (name),
          assets (name),
          dockets (docket_number)
        `)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Log[];
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch = 
      (log.clients?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.dockets?.[0]?.docket_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.assets?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-4 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6 safe-area-bottom">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            Runsheet Logs
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            View and manage all your runsheet entries
          </p>
        </div>

        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search client, docket, asset..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-11 sm:h-10 text-base sm:text-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-base sm:text-sm">All Status</SelectItem>
                  <SelectItem value="completed" className="text-base sm:text-sm">Completed</SelectItem>
                  <SelectItem value="in-progress" className="text-base sm:text-sm">In Progress</SelectItem>
                  <SelectItem value="pending" className="text-base sm:text-sm">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="shadow-card hover:shadow-elevated active:shadow-elevated transition-shadow animate-fade-in">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        <span className="font-mono text-xs sm:text-sm font-semibold text-primary">
                          {log.dockets?.[0]?.docket_number || "No Docket"}
                        </span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 sm:px-2 ${statusStyles[log.status as keyof typeof statusStyles] || statusStyles.pending}`}>
                        {log.status}
                      </Badge>
                      <span className="text-xs sm:text-sm text-muted-foreground ml-auto">
                        {log.date}
                      </span>
                    </div>

                    {/* Client and asset */}
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        {log.clients?.name || "No Client"}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {log.assets?.name || "No Asset"} • {log.load_type}
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 text-success" />
                        <span className="line-clamp-2"><strong>Pick up:</strong> {log.pickup_address}</span>
                      </div>
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 text-destructive" />
                        <span className="line-clamp-2"><strong>Drop off:</strong> {log.dropoff_address}</span>
                      </div>
                    </div>

                    {log.job_details && (
                      <p className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-2 sm:p-3 rounded-lg line-clamp-3">
                        {log.job_details}
                      </p>
                    )}

                    {/* Time info */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {log.start_time} - {log.finish_time || "Now"}
                        </span>
                        {(log.break_duration || 0) > 0 && (
                          <span className="text-muted-foreground">
                            ({log.break_duration}m break)
                          </span>
                        )}
                      </div>
                      <div className="text-base sm:text-lg font-bold text-foreground">
                        {calculateHours(log.start_time, log.finish_time, log.break_duration)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredLogs.length === 0 && (
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
