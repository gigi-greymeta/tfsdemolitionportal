import { Header } from "@/components/layout/Header";
import { RunsheetForm } from "@/components/forms/RunsheetForm";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NewEntry = () => {
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
