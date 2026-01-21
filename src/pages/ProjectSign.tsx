import { useState, useEffect } from "react";
import { useSearchParams, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ProjectSignaturePage } from "@/components/site-safety/ProjectSignaturePage";

const ProjectSign = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showSignature, setShowSignature] = useState(false);

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .eq("id", projectId!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!user,
  });

  // Check if already signed on today
  const { data: todaySignOn, isLoading: signOnLoading, refetch: refetchSignOn } = useQuery({
    queryKey: ["today-signon", projectId, user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("project_signons")
        .select("*")
        .eq("project_id", projectId!)
        .eq("user_id", user!.id)
        .gte("signed_at", today.toISOString())
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!user,
  });

  // Auto-open signature dialog when page loads (if not already signed today)
  useEffect(() => {
    if (project && !todaySignOn && !signOnLoading) {
      setShowSignature(true);
    }
  }, [project, todaySignOn, signOnLoading]);

  if (!projectId) {
    return <Navigate to="/site-safety" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    sessionStorage.setItem("redirectAfterAuth", `/project-sign?project=${projectId}`);
    return <Navigate to="/auth" replace />;
  }

  const isLoading = projectLoading || signOnLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-lg font-medium">Project Not Found</p>
            <p className="text-sm text-muted-foreground mt-2">
              This project may have been removed or is no longer active.
            </p>
            <Button className="mt-6" onClick={() => navigate("/site-safety")}>
              Go to Site Safety
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const alreadySignedOn = !!todaySignOn;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{project.name}</CardTitle>
          {project.clients?.name && (
            <CardDescription>{project.clients.name}</CardDescription>
          )}
          {project.address && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
              <MapPin className="h-4 w-4" />
              <span>{project.address}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {alreadySignedOn ? (
            <div className="text-center py-6">
              <div className="h-16 w-16 mx-auto bg-success/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <p className="text-lg font-medium text-success">Signed On</p>
              <p className="text-sm text-muted-foreground mt-2">
                {format(new Date(todaySignOn?.signed_at || new Date()), "EEEE, d MMMM yyyy 'at' h:mm a")}
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 mx-auto text-warning mb-4" />
              <p className="text-lg font-medium">Sign On Required</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please sign on to this project
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setShowSignature(true)}
              >
                Sign On Now
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate("/site-safety")}
            >
              View Site Safety
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate("/")}
            >
              Go to Portal
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProjectSignaturePage
        open={showSignature}
        onOpenChange={setShowSignature}
        project={project}
        onSuccess={() => refetchSignOn()}
      />
    </div>
  );
};

export default ProjectSign;
