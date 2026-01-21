import { useState, useEffect } from "react";
import { useSearchParams, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignaturePage } from "@/components/site-safety/SignaturePage";
import { 
  FileText, 
  CheckCircle2, 
  Building2, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function DocumentSign() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const documentId = searchParams.get("doc");
  const [signingOpen, setSigningOpen] = useState(false);

  // Fetch document details
  const { data: document, isLoading: docLoading, error: docError } = useQuery({
    queryKey: ["document-for-sign", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_documents")
        .select(`
          id,
          title,
          description,
          document_type,
          version,
          file_url,
          requires_signature,
          project_id,
          projects (
            id,
            name
          )
        `)
        .eq("id", documentId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!documentId && !!user,
  });

  // Check if user is already enrolled in the project
  const { data: enrollment } = useQuery({
    queryKey: ["enrollment-check", document?.project_id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_enrollments")
        .select("id, status")
        .eq("project_id", document!.project_id)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!document?.project_id && !!user,
  });

  // Check if user already signed this document
  const { data: existingSignature } = useQuery({
    queryKey: ["existing-signature", documentId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_signatures")
        .select("id, signed_at")
        .eq("document_id", documentId!)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!documentId && !!user,
  });

  // Auto-enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("project_enrollments")
        .insert({
          project_id: document!.project_id,
          user_id: user!.id,
          status: "approved",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment-check"] });
      toast.success("You've been enrolled in this project");
    },
    onError: (error: Error) => {
      toast.error("Failed to enroll", { description: error.message });
    },
  });

  // Auto-enroll if not enrolled
  useEffect(() => {
    if (document && user && enrollment === null && !enrollMutation.isPending) {
      enrollMutation.mutate();
    }
  }, [document, user, enrollment]);

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to={`/auth?redirect=/document-sign?doc=${documentId}`} replace />;
  }

  // No document ID provided
  if (!documentId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium">Invalid Document Link</p>
              <p className="text-muted-foreground">No document ID was provided.</p>
              <Button className="mt-4" onClick={() => navigate("/")}>
                Go to Portal
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isLoading = docLoading || enrollMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-lg mx-auto">
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-10" />
            </CardContent>
          </Card>
        ) : docError ? (
          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium">Document Not Found</p>
              <p className="text-muted-foreground">
                This document may have been removed or you don't have access.
              </p>
              <Button className="mt-4" onClick={() => navigate("/")}>
                Go to Portal
              </Button>
            </CardContent>
          </Card>
        ) : existingSignature ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
              <p className="text-lg font-medium">Already Signed</p>
              <p className="text-muted-foreground">
                You signed this document on{" "}
                {new Date(existingSignature.signed_at).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <Button className="mt-4" onClick={() => navigate("/site-safety")}>
                View My Documents
              </Button>
            </CardContent>
          </Card>
        ) : document ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4" />
                  {document.projects?.name}
                </div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {document.title}
                </CardTitle>
                <CardDescription>
                  {document.document_type}
                  {document.version && ` • Version ${document.version}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {document.description && (
                  <p className="text-sm text-muted-foreground">
                    {document.description}
                  </p>
                )}

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    You've been invited to sign this document. By signing, you 
                    acknowledge that you have read and understood the contents.
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setSigningOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Review & Sign Document
                </Button>
              </CardContent>
            </Card>

            <SignaturePage
              open={signingOpen}
              onOpenChange={setSigningOpen}
              document={{
                id: document.id,
                title: document.title,
                description: document.description,
                document_type: document.document_type,
                version: document.version,
                file_url: document.file_url,
                projects: document.projects!,
              }}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
