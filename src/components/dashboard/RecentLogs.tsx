import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/integrations/supabase/types";

type Log = Tables<"logs"> & {
  clients: { name: string } | null;
  assets: { name: string } | null;
};

const statusStyles = {
  completed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  "in-progress": "bg-primary/10 text-primary border-primary/20",
};

export function RecentLogs() {
  const { user } = useAuth();
  
  const { data: logs, isLoading } = useQuery({
    queryKey: ["recent-logs", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("logs")
        .select(`
          *,
          clients (name),
          assets (name)
        `)
        .eq("date", today)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as Log[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Today's Runsheet Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Today's Runsheet Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No entries for today yet. Create your first runsheet entry!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Today's Runsheet Entries</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 hover:bg-muted/50 transition-colors animate-fade-in"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground truncate">
                      {log.clients?.name || "No Client"}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusStyles[log.status as keyof typeof statusStyles] || statusStyles.pending}`}
                    >
                      {log.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{log.assets?.name || "No Asset"} • {log.load_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{log.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        {log.start_time} - {log.finish_time || "In Progress"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
