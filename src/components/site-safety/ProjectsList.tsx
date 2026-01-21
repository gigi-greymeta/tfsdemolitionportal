import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, FileText, CheckCircle2, Clock, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SearchInput } from "@/components/ui/search-input";
import { ProjectDetailsDialog } from "./ProjectDetailsDialog";
import { AddProjectDialog } from "./AddProjectDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { SignOnReportDownload } from "./SignOnReportDownload";

interface Project {
  id: string;
  name: string;
  address: string | null;
  client_id: string | null;
  is_active: boolean;
  qr_code: string | null;
  project_number: string | null;
  created_at: string;
  clients?: { name: string } | null;
}

interface Enrollment {
  id: string;
  project_id: string;
  status: string;
  asset_id: string | null;
}

export function ProjectsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user has management access
  const { data: isAdmin } = useQuery({
    queryKey: ["has-management-access", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .in("role", ["admin", "manager"]);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`*, clients(name)`)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as Project[];
    },
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_enrollments")
        .select("*")
        .eq("user_id", user!.id);
      
      if (error) throw error;
      return data as Enrollment[];
    },
    enabled: !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async (projectId: string) => {
      // Create enrollment
      const { error: enrollError } = await supabase
        .from("project_enrollments")
        .insert({
          project_id: projectId,
          user_id: user!.id,
          status: "approved",
        });
      
      if (enrollError) throw enrollError;

      // Send notification to admins
      const { error: notifError } = await supabase
        .from("admin_notifications")
        .insert({
          type: "enrollment",
          title: "New Project Enrollment",
          message: `A user has enrolled in a project`,
          user_id: user!.id,
          related_id: projectId,
        });

      if (notifError) console.error("Failed to create notification:", notifError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in the project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getEnrollmentStatus = (projectId: string) => {
    return enrollments?.find(e => e.project_id === projectId);
  };

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;
    
    const query = searchQuery.toLowerCase();
    return projects.filter(project => 
      project.name?.toLowerCase().includes(query) ||
      project.project_number?.toLowerCase().includes(query) ||
      project.address?.toLowerCase().includes(query) ||
      project.clients?.name?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const isLoading = projectsLoading || enrollmentsLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="space-y-4">
        {isAdmin && (
          <div className="flex justify-end">
            <AddProjectDialog />
          </div>
        )}
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No active projects available</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground mt-2">Click "Add Project" to create your first project</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search projects..."
          className="w-full sm:max-w-xs"
        />
        {isAdmin && <AddProjectDialog />}
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No projects match your search" : "No active projects available"}
            </p>
            {isAdmin && !searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">Click "Add Project" to create your first project</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredProjects.map((project) => {
            const enrollment = getEnrollmentStatus(project.id);
            const isEnrolled = enrollment?.status === "approved";

            return (
              <Card 
                key={project.id} 
                className={`transition-all ${isEnrolled ? 'border-success/30 bg-success/5' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate">
                        {project.name}
                      </CardTitle>
                      {project.clients?.name && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{project.clients.name}</span>
                        </CardDescription>
                      )}
                    </div>
                    {isEnrolled && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30 flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Enrolled
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{project.address}</span>
                    </div>
                  )}

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2 pb-2">
                      <EditProjectDialog project={project} />
                      <QRCodeDisplay 
                        type="project" 
                        id={project.id} 
                        name={project.name}
                      />
                      <SignOnReportDownload
                        type="project"
                        id={project.id}
                        name={project.name}
                        projectNumber={project.project_number || undefined}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isEnrolled ? (
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedProject(project)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Documents
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => enrollMutation.mutate(project.id)}
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending ? (
                          <>
                            <Clock className="h-4 w-4 mr-1 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          "Enrol in Project"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProjectDetailsDialog 
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      />
    </>
  );
}
