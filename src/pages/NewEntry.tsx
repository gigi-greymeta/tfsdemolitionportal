import { Header } from "@/components/layout/Header";
import { RunsheetForm } from "@/components/forms/RunsheetForm";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const NewEntry = () => {
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
      
      <main className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              New Runsheet Entry
            </h1>
            <p className="text-muted-foreground mt-1">
              Fill in the details for your trip
            </p>
          </div>
        </div>

        <RunsheetForm />
      </main>
    </div>
  );
};

export default NewEntry;
