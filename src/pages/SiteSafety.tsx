import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { ProjectsList } from "@/components/site-safety/ProjectsList";
import { MyDocuments } from "@/components/site-safety/MyDocuments";
import { TrainingList } from "@/components/site-safety/TrainingList";

const SiteSafety = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("projects");

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
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Site Safety
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage site documents, inductions & training
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-11 sm:h-10">
            <TabsTrigger value="projects" className="text-xs sm:text-sm">Projects</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
            <TabsTrigger value="training" className="text-xs sm:text-sm">Training</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-4">
            <ProjectsList />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <MyDocuments />
          </TabsContent>

          <TabsContent value="training" className="mt-4">
            <TrainingList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SiteSafety;
