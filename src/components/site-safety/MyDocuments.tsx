import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle2, Clock, Building2 } from "lucide-react";

interface SignedDocument {
  id: string;
  signed_at: string;
  site_documents: {
    id: string;
    title: string;
    document_type: string;
    version: string | null;
    projects: {
      id: string;
      name: string;
    };
  };
}

export function MyDocuments() {
  const { user } = useAuth();

  const { data: signedDocs, isLoading } = useQuery({
    queryKey: ["my-signed-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_signatures")
        .select(`
          id,
          signed_at,
          site_documents (
            id,
            title,
            document_type,
            version,
            projects (
              id,
              name
            )
          )
        `)
        .eq("user_id", user!.id)
        .order("signed_at", { ascending: false });
      
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!signedDocs?.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No signed documents yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Enrol in a project to access and sign documents
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by project
  const groupedByProject = signedDocs.reduce((acc, doc) => {
    const projectName = doc.site_documents?.projects?.name || "Unknown Project";
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(doc);
    return acc;
  }, {} as Record<string, SignedDocument[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedByProject).map(([projectName, docs]) => (
        <Card key={projectName}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {projectName}
            </CardTitle>
            <CardDescription>
              {docs.length} document{docs.length !== 1 ? 's' : ''} signed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-lg bg-muted/50 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-xs ${getDocumentTypeColor(doc.site_documents.document_type)}`}>
                      {doc.site_documents.document_type}
                    </Badge>
                    {doc.site_documents.version && (
                      <span className="text-xs text-muted-foreground">
                        v{doc.site_documents.version}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{doc.site_documents.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Signed {formatDate(doc.signed_at)}
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
