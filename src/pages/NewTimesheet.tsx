import { Header } from "@/components/layout/Header";
import { TimesheetForm } from "@/components/forms/TimesheetForm";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const NewTimesheet = () => {
  const { user, loading } = useAuth();

  if (loading) {
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
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/timesheets">
            <Button variant="ghost" size="icon" className="h-10 w-10 touch-target">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              New Timesheet Entry
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
              Fill in the details for your shift
            </p>
          </div>
        </div>

        <TimesheetForm />
      </main>
    </div>
  );
};

export default NewTimesheet;
