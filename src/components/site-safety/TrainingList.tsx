import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, CheckCircle2, Clock, AlertTriangle, Calendar } from "lucide-react";

interface TrainingRecord {
  id: string;
  title: string;
  description: string | null;
  completed_at: string | null;
  expires_at: string | null;
  certificate_url: string | null;
  is_mandatory: boolean;
}

export function TrainingList() {
  const { user } = useAuth();

  const { data: training, isLoading } = useQuery({
    queryKey: ["my-training", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_records")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_mandatory", { ascending: false })
        .order("title");
      
      if (error) throw error;
      return data as TrainingRecord[];
    },
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(expiresAt) < thirtyDaysFromNow && !isExpired(expiresAt);
  };

  const completedCount = training?.filter(t => t.completed_at).length || 0;
  const totalCount = training?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Training Progress
          </CardTitle>
          <CardDescription>
            {completedCount} of {totalCount} training modules completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{Math.round(progress)}% complete</span>
            <span>{totalCount - completedCount} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Training List */}
      {!training?.length ? (
        <Card>
          <CardContent className="py-10 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No training records</p>
            <p className="text-sm text-muted-foreground mt-1">
              Training modules will appear here when assigned
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {training.map((record) => {
            const completed = !!record.completed_at;
            const expired = isExpired(record.expires_at);
            const expiringSoon = isExpiringSoon(record.expires_at);

            return (
              <Card
                key={record.id}
                className={`transition-colors ${
                  expired ? 'border-destructive/30 bg-destructive/5' :
                  expiringSoon ? 'border-warning/30 bg-warning/5' :
                  completed ? 'border-success/30 bg-success/5' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {record.is_mandatory && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                            Required
                          </Badge>
                        )}
                        {expired && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        )}
                        {expiringSoon && !expired && (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">{record.title}</p>
                      {record.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {record.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {record.completed_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            Completed {formatDate(record.completed_at)}
                          </span>
                        )}
                        {record.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires {formatDate(record.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    {completed && !expired && (
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    )}
                    {!completed && (
                      <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
