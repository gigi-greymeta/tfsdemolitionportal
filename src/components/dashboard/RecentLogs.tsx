import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Package } from "lucide-react";

interface LogEntry {
  id: string;
  date: string;
  client: string;
  asset: string;
  pickupAddress: string;
  dropoffAddress: string;
  loadType: string;
  startTime: string;
  finishTime: string;
  status: "completed" | "pending" | "in-progress";
}

const mockLogs: LogEntry[] = [
  {
    id: "1",
    date: "2024-01-15",
    client: "ABC Construction",
    asset: "Truck 001",
    pickupAddress: "123 Main St, Sydney",
    dropoffAddress: "456 Industrial Ave, Parramatta",
    loadType: "Concrete",
    startTime: "07:00",
    finishTime: "15:30",
    status: "completed",
  },
  {
    id: "2",
    date: "2024-01-15",
    client: "XYZ Builders",
    asset: "Truck 003",
    pickupAddress: "789 Site Rd, Blacktown",
    dropoffAddress: "321 Depot St, Penrith",
    loadType: "Mixed Waste",
    startTime: "06:30",
    finishTime: "14:00",
    status: "completed",
  },
  {
    id: "3",
    date: "2024-01-15",
    client: "Metro Demolition",
    asset: "Truck 002",
    pickupAddress: "555 Demo Lane, Liverpool",
    dropoffAddress: "888 Recycling Rd, Wetherill Park",
    loadType: "Steel",
    startTime: "08:00",
    finishTime: "",
    status: "in-progress",
  },
];

const statusStyles = {
  completed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  "in-progress": "bg-primary/10 text-primary border-primary/20",
};

export function RecentLogs() {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Today's Runsheet Entries</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {mockLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 hover:bg-muted/50 transition-colors animate-fade-in"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground truncate">
                      {log.client}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusStyles[log.status]}`}
                    >
                      {log.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{log.asset} • {log.loadType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{log.pickupAddress}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        {log.startTime} - {log.finishTime || "In Progress"}
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
