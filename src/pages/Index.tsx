import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentLogs } from "@/components/dashboard/RecentLogs";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, Truck, Users, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
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
          <StatsCard
            title="Today's Entries"
            value={3}
            subtitle="2 completed, 1 in progress"
            icon={ClipboardList}
          />
          <StatsCard
            title="Hours Logged"
            value="7.5"
            subtitle="This week: 32 hours"
            icon={Clock}
          />
          <StatsCard
            title="Active Assets"
            value={4}
            subtitle="All operational"
            icon={Truck}
          />
          <StatsCard
            title="Clients Served"
            value={8}
            subtitle="This month"
            icon={Users}
          />
        </div>

        {/* Recent Logs */}
        <RecentLogs />
      </main>
    </div>
  );
};

export default Index;
