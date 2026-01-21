import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, CheckCircle2, Clock, Building2, Eye, PenLine, ExternalLink } from "lucide-react";
import { SignaturePage } from "./SignaturePage";

interface AssignedDocument {
  id: string;
  can_sign: boolean;
  assigned_at: string;
  site_documents: {
    id: string;
    title: string;
    description: string | null;
    document_type: string;
    version: string | null;
    file_url: string | null;
    requires_signature: boolean;
    projects: {
      id: string;
      name: string;
    };
  };
}

interface SignedDocument {
  id: string;
  signed_at: string;
  document_id: string;
}

export function MyDocuments() {
  const { user } = useAuth();
  const [viewingDoc, setViewingDoc] = useState<AssignedDocument | null>(null);
  const [signingDoc, setSigningDoc] = useState<AssignedDocument | null>(null);

  // Fetch assigned documents
  const { data: assignedDocs, isLoading: assignedLoading } = useQuery({
    queryKey: ["my-assigned-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_assignments")
        .select(`
          id,
          can_sign,
          assigned_at,
          site_documents (
            id,
            title,
            description,
            document_type,
            version,
            file_url,
            requires_signature,
            projects (
              id,
              name
            )
          )
        `)
        .eq("user_id", user!.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return data as AssignedDocument[];
    },
    enabled: !!user,
  });

  // Fetch user's signatures
  const { data: signatures } = useQuery({
    queryKey: ["my-signatures", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_signatures")
        .select("id, signed_at, document_id")
        .eq("user_id", user!.id);

      if (error) throw error;
      return data as SignedDocument[];
    },
    enabled: !!user,
  });


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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isDocumentSigned = (documentId: string) => {
    return signatures?.some((s) => s.document_id === documentId);
  };

  const getSignatureDate = (documentId: string) => {
    const sig = signatures?.find((s) => s.document_id === documentId);
    return sig ? formatDate(sig.signed_at) : null;
  };

  if (assignedLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  // Separate into pending and signed
  const pendingDocs = assignedDocs?.filter(
    (doc) => doc.site_documents?.requires_signature && doc.can_sign && !isDocumentSigned(doc.site_documents.id)
  ) || [];

  const signedDocs = assignedDocs?.filter(
    (doc) => isDocumentSigned(doc.site_documents?.id)
  ) || [];

  const viewOnlyDocs = assignedDocs?.filter(
    (doc) => !doc.can_sign || !doc.site_documents?.requires_signature
  ) || [];

  if (!assignedDocs?.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents assigned yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Documents will appear here when assigned by an admin
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by project
  const groupByProject = (docs: AssignedDocument[]) => {
    return docs.reduce((acc, doc) => {
      const projectName = doc.site_documents?.projects?.name || "Unknown Project";
      if (!acc[projectName]) acc[projectName] = [];
      acc[projectName].push(doc);
      return acc;
    }, {} as Record<string, AssignedDocument[]>);
  };

  const renderDocumentCard = (doc: AssignedDocument, showSignButton: boolean) => {
    const signed = isDocumentSigned(doc.site_documents?.id);
    const signedDate = getSignatureDate(doc.site_documents?.id);

    return (
      <div
        key={doc.id}
        className={`p-3 rounded-lg flex items-center justify-between gap-2 ${
          signed ? "bg-success/5 border border-success/20" : "bg-muted/50"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs ${getDocumentTypeColor(doc.site_documents.document_type)}`}
            >
              {doc.site_documents.document_type}
            </Badge>
            {doc.site_documents.version && (
              <span className="text-xs text-muted-foreground">
                v{doc.site_documents.version}
              </span>
            )}
            {signed && (
              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Signed
              </Badge>
            )}
          </div>
          <p className="font-medium text-sm truncate">{doc.site_documents.title}</p>
          {doc.site_documents.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {doc.site_documents.description}
            </p>
          )}
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {signed ? `Signed ${signedDate}` : `Assigned ${formatDate(doc.assigned_at)}`}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {doc.site_documents.file_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewingDoc(doc)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {showSignButton && !signed && doc.can_sign && (
            <Button size="sm" onClick={() => setSigningDoc(doc)}>
              <PenLine className="h-4 w-4 mr-1" />
              Sign
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingDocs.length > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingDocs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="signed">Signed</TabsTrigger>
          <TabsTrigger value="view-only">View Only</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingDocs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto text-success mb-3" />
                <p className="text-muted-foreground">All documents signed!</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupByProject(pendingDocs)).map(([projectName, docs]) => (
              <Card key={projectName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {projectName}
                  </CardTitle>
                  <CardDescription>
                    {docs.length} document{docs.length !== 1 ? "s" : ""} pending signature
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {docs.map((doc) => renderDocumentCard(doc, true))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="signed" className="space-y-4">
          {signedDocs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No signed documents yet</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupByProject(signedDocs)).map(([projectName, docs]) => (
              <Card key={projectName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {projectName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {docs.map((doc) => renderDocumentCard(doc, false))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="view-only" className="space-y-4">
          {viewOnlyDocs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No view-only documents</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupByProject(viewOnlyDocs)).map(([projectName, docs]) => (
              <Card key={projectName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {projectName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {docs.map((doc) => renderDocumentCard(doc, false))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* View Document Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.site_documents.title}</DialogTitle>
            <DialogDescription>
              {viewingDoc?.site_documents.document_type} • {viewingDoc?.site_documents.projects?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewingDoc?.site_documents.description && (
              <p className="text-sm text-muted-foreground">
                {viewingDoc.site_documents.description}
              </p>
            )}
            <Button asChild className="w-full">
              <a
                href={viewingDoc?.site_documents.file_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Document
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Document - Signature Page */}
      <SignaturePage
        open={!!signingDoc}
        onOpenChange={(open) => !open && setSigningDoc(null)}
        document={signingDoc?.site_documents || null}
      />
    </>
  );
}
