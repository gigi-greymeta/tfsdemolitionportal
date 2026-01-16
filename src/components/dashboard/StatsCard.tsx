import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function StatsCard({ title, value, subtitle, icon: Icon }: StatsCardProps) {
  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow duration-200">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{subtitle}</p>
            )}
          </div>
          <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
