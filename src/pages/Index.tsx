import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentLogs } from "@/components/dashboard/RecentLogs";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, Truck, Users, Plus } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date();
      monthStart.setDate(1);

      // Today's entries
      const { data: todayLogs } = await supabase
        .from("logs")
        .select("id, status, start_time, finish_time, break_duration")
        .eq("date", today);

      const todayEntries = todayLogs?.length || 0;
      const completedToday = todayLogs?.filter(l => l.status === "completed").length || 0;
      const inProgress = todayLogs?.filter(l => l.status === "in-progress").length || 0;

      // Calculate hours for today
      let todayHours = 0;
      todayLogs?.forEach(log => {
        if (log.finish_time) {
          const [startH, startM] = log.start_time.split(":").map(Number);
          const [finishH, finishM] = log.finish_time.split(":").map(Number);
          const mins = (finishH * 60 + finishM) - (startH * 60 + startM) - (log.break_duration || 0);
          todayHours += mins / 60;
        }
      });

      // Week hours
      const { data: weekLogs } = await supabase
        .from("logs")
        .select("start_time, finish_time, break_duration")
        .gte("date", weekStart.toISOString().split("T")[0]);

      let weekHours = 0;
      weekLogs?.forEach(log => {
        if (log.finish_time) {
          const [startH, startM] = log.start_time.split(":").map(Number);
          const [finishH, finishM] = log.finish_time.split(":").map(Number);
          const mins = (finishH * 60 + finishM) - (startH * 60 + startM) - (log.break_duration || 0);
          weekHours += mins / 60;
        }
      });

      // Active assets
      const { count: activeAssets } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Clients this month
      const { data: monthLogs } = await supabase
        .from("logs")
        .select("client_id")
        .gte("date", monthStart.toISOString().split("T")[0]);

      const uniqueClients = new Set(monthLogs?.map(l => l.client_id).filter(Boolean));

      return {
        todayEntries,
        completedToday,
        inProgress,
        todayHours: todayHours.toFixed(1),
        weekHours: weekHours.toFixed(0),
        activeAssets: activeAssets || 0,
        clientsServed: uniqueClients.size,
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
      
      <main className="container py-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your overview for today.
            </p>
          </div>
          <Link to="/new-entry">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5" />
              New Entry
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
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
                subtitle={`This week: ${stats?.weekHours || 0} hours`}
                icon={Clock}
              />
              <StatsCard
                title="Active Assets"
                value={stats?.activeAssets || 0}
                subtitle="All operational"
                icon={Truck}
              />
              <StatsCard
                title="Clients Served"
                value={stats?.clientsServed || 0}
                subtitle="This month"
                icon={Users}
              />
            </>
          )}
        </div>

        {/* Recent Logs */}
        <RecentLogs />
      </main>
    </div>
  );
};

export default Index;
