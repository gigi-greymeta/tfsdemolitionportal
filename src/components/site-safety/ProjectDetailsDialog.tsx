import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CheckCircle2, Truck, AlertCircle, PenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentPDFDownload } from "./DocumentPDFDownload";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { SignOnReportDownload } from "./SignOnReportDownload";
import { SignaturePage } from "./SignaturePage";
interface Project {
  id: string;
  name: string;
  address: string | null;
  client_id: string | null;
  is_active: boolean;
  qr_code: string | null;
  project_number: string | null;
  created_at: string;
}

interface SiteDocument {
  id: string;
  document_type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  version: string | null;
  requires_signature: boolean;
}

interface DocumentSignature {
  id: string;
  document_id: string;
}

interface Asset {
  id: string;
  name: string;
  registration_number: string | null;
}

interface ProjectDetailsDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailsDialog({ project, open, onOpenChange }: ProjectDetailsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [signatureDocument, setSignatureDocument] = useState<{
    id: string;
    title: string;
    description: string | null;
    document_type: string;
    version: string | null;
    file_url: string | null;
    projects: { id: string; name: string };
  } | null>(null);

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["project-documents", project?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_documents")
        .select("*")
        .eq("project_id", project!.id)
        .eq("is_active", true)
        .order("document_type");
      
      if (error) throw error;
      return data as SiteDocument[];
    },
    enabled: !!project?.id,
  });

  const { data: signatures } = useQuery({
    queryKey: ["my-signatures", user?.id, project?.id],
    queryFn: async () => {
      const docIds = documents?.map(d => d.id) || [];
      if (!docIds.length) return [];
      
      const { data, error } = await supabase
        .from("document_signatures")
        .select("id, document_id")
        .eq("user_id", user!.id)
        .in("document_id", docIds);
      
      if (error) throw error;
      return data as DocumentSignature[];
    },
    enabled: !!user && !!documents?.length,
  });

  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, registration_number")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as Asset[];
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", project?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_enrollments")
        .select("*")
        .eq("project_id", project!.id)
        .eq("user_id", user!.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!project?.id && !!user,
  });

  const handleSignDocument = (doc: SiteDocument) => {
    if (!project) return;
    setSignatureDocument({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      document_type: doc.document_type,
      version: doc.version,
      file_url: doc.file_url,
      projects: { id: project.id, name: project.name },
    });
  };

  const updateAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from("project_enrollments")
        .update({ asset_id: assetId })
        .eq("project_id", project!.id)
        .eq("user_id", user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      toast({
        title: "Asset Updated",
        description: "Your assigned asset has been updated.",
      });
    },
  });

  const isSigned = (documentId: string) => {
    return signatures?.some(s => s.document_id === documentId);
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "SWMS": "bg-destructive/10 text-destructive",
      "JSEA": "bg-warning/10 text-warning",
      "Site Safety Plan": "bg-success/10 text-success",
      "Demolition Plan": "bg-primary/10 text-primary",
      "Induction Checklist": "bg-secondary/10 text-secondary-foreground",
      "Training Certificate": "bg-accent/10 text-accent-foreground",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project?.name}</DialogTitle>
          <DialogDescription>
            {project?.address || "View and sign project documents"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Admin Controls - QR Codes and Reports */}
          {isAdmin && project && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
              <div className="text-sm font-medium text-primary">Admin Controls</div>
              <div className="flex flex-wrap gap-2">
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
            </div>
          )}
          {/* Asset Selection */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4" />
              Assigned Asset
            </div>
            <Select 
              value={selectedAsset || enrollment?.asset_id || ""} 
              onValueChange={(value) => {
                setSelectedAsset(value);
                updateAssetMutation.mutate(value);
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select asset you're using" />
              </SelectTrigger>
              <SelectContent>
                {assets?.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name} {asset.registration_number ? `(${asset.registration_number})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents List */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Site Documents</h4>
            
            {docsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : !documents?.length ? (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents available for this project</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const signed = isSigned(doc.id);
                  
                  return (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        signed ? 'bg-success/5 border-success/30' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs ${getDocumentTypeColor(doc.document_type)}`}>
                              {doc.document_type}
                            </Badge>
                            {doc.version && (
                              <span className="text-xs text-muted-foreground">v{doc.version}</span>
                            )}
                          </div>
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {doc.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isAdmin && (
                            <>
                              <QRCodeDisplay 
                                type="document" 
                                id={doc.id} 
                                name={doc.title}
                              />
                              <SignOnReportDownload
                                type="document"
                                id={doc.id}
                                name={doc.title}
                              />
                            </>
                          )}
                          <DocumentPDFDownload
                            documentId={doc.id}
                            documentTitle={doc.title}
                            documentType={doc.document_type}
                            version={doc.version}
                            projectName={project?.name || "Unknown"}
                            projectNumber={project?.project_number || null}
                            description={doc.description}
                            size="icon"
                          />
                          {doc.requires_signature && (
                            signed ? (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Signed
                              </Badge>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSignDocument(doc)}
                              >
                                <PenLine className="h-3 w-3 mr-1" />
                                Sign
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Signature Page Dialog */}
      <SignaturePage
        open={!!signatureDocument}
        onOpenChange={(isOpen) => !isOpen && setSignatureDocument(null)}
        document={signatureDocument}
      />
    </Dialog>
  );
}
