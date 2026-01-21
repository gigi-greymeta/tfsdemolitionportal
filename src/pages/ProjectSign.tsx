import { useState, useEffect } from "react";
import { useSearchParams, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ProjectSign = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [signedOn, setSignedOn] = useState(false);

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
  const { data: todaySignOn, isLoading: signOnLoading } = useQuery({
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

  // Check enrollment status
  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", projectId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_enrollments")
        .select("*")
        .eq("project_id", projectId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!user,
  });

  // Auto-enroll and sign on mutation
  const signOnMutation = useMutation({
    mutationFn: async () => {
      // First, enroll if not already
      if (!enrollment) {
        const { error: enrollError } = await supabase
          .from("project_enrollments")
          .insert({
            project_id: projectId!,
            user_id: user!.id,
            status: "approved",
          });
        
        if (enrollError && !enrollError.message.includes("duplicate")) {
          throw enrollError;
        }
      }

      // Create sign-on record
      const { error: signOnError } = await supabase
        .from("project_signons")
        .insert({
          project_id: projectId!,
          user_id: user!.id,
        });
      
      if (signOnError) throw signOnError;
    },
    onSuccess: () => {
      setSignedOn(true);
      queryClient.invalidateQueries({ queryKey: ["today-signon"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      toast({
        title: "Signed On Successfully",
        description: `You are now signed onto ${project?.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sign On Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto sign-on when page loads (if not already signed on today)
  useEffect(() => {
    if (project && !todaySignOn && !signOnLoading && !signedOn) {
      signOnMutation.mutate();
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
    // Store the intended destination and redirect to auth
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

  const alreadySignedOn = todaySignOn || signedOn;

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
          {signOnMutation.isPending ? (
            <div className="text-center py-6">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Signing you on...</p>
            </div>
          ) : alreadySignedOn ? (
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
              <p className="text-lg font-medium">Sign On Failed</p>
              <Button 
                className="mt-4" 
                onClick={() => signOnMutation.mutate()}
              >
                Try Again
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
    </div>
  );
};

export default ProjectSign;
