import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTimesheets } from "@/components/dashboard/RecentTimesheets";
import { Button } from "@/components/ui/button";
import { Clock, ClipboardList, Plus, ArrowLeft, Briefcase } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Timesheets = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["timesheet-stats", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      // Today's entries
      const { data: todayLogs, error: todayErr } = await supabase
        .from("timesheet_logs")
        .select("id, status, total_hours")
        .eq("date", today);

      if (todayErr) throw todayErr;

      const todayEntries = todayLogs?.length || 0;
      const completedToday = todayLogs?.filter((l) => l.status === "completed").length || 0;
      const inProgress = todayLogs?.filter((l) => l.status === "in-progress").length || 0;

      const todayHours = (todayLogs || [])
        .reduce((sum, l) => sum + (l.total_hours || 0), 0);

      // Week hours
      const { data: weekLogs, error: weekErr } = await supabase
        .from("timesheet_logs")
        .select("total_hours")
        .gte("date", weekStart.toISOString().split("T")[0]);

      if (weekErr) throw weekErr;

      const weekHours = (weekLogs || [])
        .reduce((sum, l) => sum + (l.total_hours || 0), 0);

      // Jobs this week (distinct job_id)
      const { data: weekJobs } = await supabase
        .from("timesheet_logs")
        .select("job_id")
        .gte("date", weekStart.toISOString().split("T")[0]);

      const uniqueJobs = new Set((weekJobs || []).map((x) => x.job_id).filter(Boolean));

      return {
        todayEntries,
        completedToday,
        inProgress,
        todayHours: todayHours.toFixed(2),
        weekHours: weekHours.toFixed(1),
        jobsThisWeek: uniqueJobs.size,
      };
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-4 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6 safe-area-bottom">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Timesheets
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
                Track shifts, hours, and job work
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link to="/new-timesheet" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 sm:h-11 text-base touch-target">
                <Plus className="h-5 w-5" />
                New Entry
              </Button>
            </Link>

            <Link to="/timesheet-logs" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 sm:h-11 text-base touch-target">
                <ClipboardList className="h-5 w-5" />
                View Logs
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 sm:h-32 rounded-lg" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Today's Entries"
                value={stats?.todayEntries || 0}
                subtitle={`${stats?.completedToday || 0} completed, ${stats?.inProgress || 0} in progress`}
                icon={ClipboardList}
              />
              <StatsCard
                title="Hours Today"
                value={stats?.todayHours || "0"}
                subtitle={`This week: ${stats?.weekHours || "0"} hours`}
                icon={Clock}
              />
              <StatsCard
                title="Jobs This Week"
                value={stats?.jobsThisWeek || 0}
                subtitle="Unique job IDs"
                icon={Briefcase}
              />
              <StatsCard
                title="Week Hours"
                value={stats?.weekHours || "0"}
                subtitle="Rolling 7 days"
                icon={Clock}
              />
            </>
          )}
        </div>

        {/* Recent */}
        <RecentTimesheets />
      </main>
    </div>
  );
};

export default Timesheets;
