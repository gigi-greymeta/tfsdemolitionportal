import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ArrowLeft,
  Users,
  Building2,
  FileText,
  FolderKanban,
  DollarSign,
  ClipboardList,
  GraduationCap,
  Clock,
  Upload,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

import { UserManagement } from "@/components/admin/UserManagement";
import { AdminPayslipsList } from "@/components/employment/AdminPayslipsList";
import { PayslipUploadDialog } from "@/components/employment/PayslipUploadDialog";
import { DocumentUploadDialog } from "@/components/admin/DocumentUploadDialog";

// Expecting you have this (from your earlier work)
// If your path is different, update this import.
import { ClientManagement } from "@/components/admin/ClientManagement";

import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;
type SiteDocument = Tables<"site_documents">;

export default function AdminControl () {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"user" | "client" | "document" | "project">("user");

  // Sub tabs
  const [userSubTab, setUserSubTab] = useState<
    "users" | "payslips" | "runsheets" | "training" | "timesheets"
  >("users");

  const [clientSubTab, setClientSubTab] = useState<"clients">("clients");

  const [documentSubTab, setDocumentSubTab] = useState<"documents">("documents");
  const [projectSubTab, setProjectSubTab] = useState<"projects" | "documents">("projects");

  // Project filters
  const [docsProjectFilter, setDocsProjectFilter] = useState<string>("all");
  const [projectDocsFilter, setProjectDocsFilter] = useState<string>("all");

  // Role gate: admin OR manager
  const { data: hasManagementAccess, isLoading: roleLoading } = useQuery({
    queryKey: ["has-management-access", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .in("role", ["admin", "manager"]);

      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasManagementAccess) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-4 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6 safe-area-bottom">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Admin Control
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage users, clients, documents and projects
              </p>
            </div>
          </div>
        </div>

        {/* Top Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-11 sm:h-10">
            <TabsTrigger value="user" className="text-xs sm:text-sm gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="client" className="text-xs sm:text-sm gap-2">
              <Building2 className="h-4 w-4" />
              Client Management
            </TabsTrigger>
            <TabsTrigger value="document" className="text-xs sm:text-sm gap-2">
              <FileText className="h-4 w-4" />
              Document Management
            </TabsTrigger>
            <TabsTrigger value="project" className="text-xs sm:text-sm gap-2">
              <FolderKanban className="h-4 w-4" />
              Project Management
            </TabsTrigger>
          </TabsList>

          {/* USER MANAGEMENT */}
          <TabsContent value="user" className="mt-4 space-y-4">
            <Tabs value={userSubTab} onValueChange={(v) => setUserSubTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto md:h-10">
                <TabsTrigger value="users" className="text-xs sm:text-sm gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="payslips" className="text-xs sm:text-sm gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payslips
                </TabsTrigger>
                <TabsTrigger value="runsheets" className="text-xs sm:text-sm gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Run Sheets
                </TabsTrigger>
                <TabsTrigger value="training" className="text-xs sm:text-sm gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Training
                </TabsTrigger>
                <TabsTrigger value="timesheets" className="text-xs sm:text-sm gap-2">
                  <Clock className="h-4 w-4" />
                  Timesheets
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4">
                <UserManagement />
              </TabsContent>

              <TabsContent value="payslips" className="mt-4 space-y-4">
                <div className="flex justify-end">
                  <PayslipUploadDialog />
                </div>
                <AdminPayslipsList />
              </TabsContent>

              <TabsContent value="runsheets" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Run Sheets
                    </CardTitle>
                    <CardDescription>
                      View runsheets, logs and docket details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-2">
                    <Link to="/runsheets" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Open Run Sheets
                      </Button>
                    </Link>
                    <Link to="/logs" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto gap-2">
                        <FileText className="h-4 w-4" />
                        View Logs
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="training" className="mt-4 space-y-4">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Deploy Training Modules
                    </CardTitle>
                    <CardDescription>
                      Deploy training modules to users via email (UI scaffold).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="training-title">Title</Label>
                        <Input id="training-title" placeholder="e.g. Site Induction" disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="training-expiry">Expiry date (optional)</Label>
                        <Input id="training-expiry" type="date" disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="training-desc">Description</Label>
                      <Input id="training-desc" placeholder="Short description..." disabled />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Mandatory</p>
                        <p className="text-xs text-muted-foreground">
                          Mark as required training for recipients
                        </p>
                      </div>
                      <Switch disabled />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" disabled>
                        Preview Email
                      </Button>
                      <Button disabled className="gap-2">
                        <Upload className="h-4 w-4" />
                        Send to Users
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Note: wiring “send email + create training_records” typically needs a Supabase
                      Edge Function or server endpoint. This panel is ready for that hook-up.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timesheets" className="mt-4">
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Timesheets</h3>
                    <p className="text-muted-foreground text-sm">
                      Timesheet management UI coming soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* CLIENT MANAGEMENT */}
          <TabsContent value="client" className="mt-4 space-y-4">
            <Tabs value={clientSubTab} onValueChange={(v) => setClientSubTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-1 h-10">
                <TabsTrigger value="clients" className="text-xs sm:text-sm gap-2">
                  <Building2 className="h-4 w-4" />
                  Clients
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clients" className="mt-4">
                <ClientManagement />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* DOCUMENT MANAGEMENT */}
          <TabsContent value="document" className="mt-4 space-y-4">
            <Tabs
              value={documentSubTab}
              onValueChange={(v) => setDocumentSubTab(v as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-1 h-10">
                <TabsTrigger value="documents" className="text-xs sm:text-sm gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="mt-4 space-y-4">
                <AdminDocumentsPanel
                  projectFilter={docsProjectFilter}
                  setProjectFilter={setDocsProjectFilter}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* PROJECT MANAGEMENT */}
          <TabsContent value="project" className="mt-4 space-y-4">
            <Tabs value={projectSubTab} onValueChange={(v) => setProjectSubTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="projects" className="text-xs sm:text-sm gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Projects
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs sm:text-sm gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="mt-4">
                <ProjectsManagement />
              </TabsContent>

              <TabsContent value="documents" className="mt-4 space-y-4">
                <ProjectDocumentsPanel
                  projectFilter={projectDocsFilter}
                  setProjectFilter={setProjectDocsFilter}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

/* ----------------------------- Document Management ----------------------------- */

function AdminDocumentsPanel({
  projectFilter,
  setProjectFilter,
}: {
  projectFilter: string;
  setProjectFilter: (v: string) => void;
}) {
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["admin-projects-for-docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Pick<Project, "id" | "name">[];
    },
  });

  const { data: docs, isLoading } = useQuery({
    queryKey: ["admin-documents", projectFilter],
    queryFn: async () => {
      let q = supabase
        .from("site_documents")
        .select("id, title, document_type, project_id, is_active, requires_signature, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (projectFilter !== "all") q = q.eq("project_id", projectFilter);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SiteDocument[];
    },
  });

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    (projects ?? []).forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects]);

  const updateDocMutation = useMutation({
    mutationFn: async (payload: { id: string; update: Partial<SiteDocument> }) => {
      const { error } = await supabase.from("site_documents").update(payload.update).eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document updated");
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    },
    onError: (e: any) => {
      toast.error(e?.message || "Failed to update document");
    },
  });

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">All Documents</CardTitle>
            <CardDescription>
              Filter by project and manage permissions/switches.
            </CardDescription>
          </div>

          <DocumentUploadDialog
            trigger={
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            }
          />
        </div>

        <div className="max-w-sm">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {(projects ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading documents...</div>
        ) : !docs?.length ? (
          <div className="py-8 text-center text-muted-foreground">No documents found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Requires Signature</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell className="text-muted-foreground">{d.document_type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {projectNameById.get(d.project_id) ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={d.requires_signature}
                        onCheckedChange={(checked) =>
                          updateDocMutation.mutate({ id: d.id, update: { requires_signature: checked } })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={d.is_active}
                        onCheckedChange={(checked) =>
                          updateDocMutation.mutate({ id: d.id, update: { is_active: checked } })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <p className="mt-3 text-xs text-muted-foreground">
              Assigning per-user permission levels typically uses `document_assignments` (e.g. `can_sign`) —
              you can add an “Assign Users” action here next.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Project Management ----------------------------- */

function ProjectsManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, address, project_number, is_active, created_at, updated_at")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects ?? [];
    return (projects ?? []).filter((p) =>
      [p.name, p.project_number ?? "", p.address ?? ""].join(" ").toLowerCase().includes(q)
    );
  }, [projects, search]);

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; project_number?: string | null; address?: string | null }) => {
      const { error } = await supabase.from("projects").insert({
        name: payload.name,
        project_number: payload.project_number ?? null,
        address: payload.address ?? null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projects-for-docs"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create project"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; update: Partial<Project> }) => {
      const { error } = await supabase.from("projects").update(payload.update).eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project updated");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projects-for-docs"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update project"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projects-for-docs"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete project"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">Add, edit and delete projects.</p>
        </div>

        <CreateProjectDialog
          onCreate={(payload) => createMutation.mutate(payload)}
          isPending={createMutation.isPending}
        />
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search projects..."
        className="max-w-md"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Projects</CardTitle>
          <CardDescription>{filtered.length} projects</CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading projects...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No projects found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Project #</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.project_number || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.address || "—"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={p.is_active}
                          onCheckedChange={(checked) =>
                            updateMutation.mutate({ id: p.id, update: { is_active: checked } })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <EditProjectDialog
                            project={p}
                            onSave={(update) => updateMutation.mutate({ id: p.id, update })}
                            isPending={updateMutation.isPending}
                          />

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Delete project">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete <strong>{p.name}</strong>? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteMutation.mutate(p.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectDocumentsPanel({
  projectFilter,
  setProjectFilter,
}: {
  projectFilter: string;
  setProjectFilter: (v: string) => void;
}) {
  const { data: projects } = useQuery({
    queryKey: ["admin-projects-for-project-docs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as Pick<Project, "id" | "name">[];
    },
  });

  const { data: docs, isLoading } = useQuery({
    queryKey: ["admin-project-documents", projectFilter],
    queryFn: async () => {
      let q = supabase
        .from("site_documents")
        .select("id, title, document_type, project_id, is_active, requires_signature, created_at")
        .order("created_at", { ascending: false });

      if (projectFilter !== "all") q = q.eq("project_id", projectFilter);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SiteDocument[];
    },
  });

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    (projects ?? []).forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Documents by Project</CardTitle>
            <CardDescription>Upload and assign documents to a project.</CardDescription>
          </div>

          <DocumentUploadDialog
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Document
              </Button>
            }
          />
        </div>

        <div className="max-w-sm">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {(projects ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading documents...</div>
        ) : !docs?.length ? (
          <div className="py-8 text-center text-muted-foreground">No documents found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Requires Signature</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell className="text-muted-foreground">{d.document_type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {projectNameById.get(d.project_id) ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.requires_signature ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Project Dialogs ----------------------------- */

function CreateProjectDialog({
  onCreate,
  isPending,
}: {
  onCreate: (payload: { name: string; project_number?: string | null; address?: string | null }) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [address, setAddress] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    onCreate({
      name: name.trim(),
      project_number: projectNumber.trim() ? projectNumber.trim() : null,
      address: address.trim() ? address.trim() : null,
    });
    setOpen(false);
    setName("");
    setProjectNumber("");
    setAddress("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Add a new project.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cp-name">Name *</Label>
            <Input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-number">Project Number</Label>
            <Input id="cp-number" value={projectNumber} onChange={(e) => setProjectNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-address">Address</Label>
            <Input id="cp-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditProjectDialog({
  project,
  onSave,
  isPending,
}: {
  project: Project;
  onSave: (update: Partial<Project>) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [projectNumber, setProjectNumber] = useState(project.project_number ?? "");
  const [address, setAddress] = useState(project.address ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    onSave({
      name: name.trim(),
      project_number: projectNumber.trim() ? projectNumber.trim() : null,
      address: address.trim() ? address.trim() : null,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit project">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update the project details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ep-name">Name *</Label>
            <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-number">Project Number</Label>
            <Input id="ep-number" value={projectNumber} onChange={(e) => setProjectNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-address">Address</Label>
            <Input id="ep-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
