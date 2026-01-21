import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Loader2, FileText, Users } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DocumentType = Database["public"]["Enums"]["document_type"];

const DOCUMENT_TYPES: DocumentType[] = [
  "SWMS",
  "JSEA",
  "Site Safety Plan",
  "Demolition Plan",
  "Induction Checklist",
  "Training Certificate",
  "Other",
];

interface UserAssignment {
  userId: string;
  fullName: string;
  email: string | null;
  canSign: boolean;
  selected: boolean;
}

interface DocumentUploadDialogProps {
  projectId?: string;
  trigger?: React.ReactNode;
}

export function DocumentUploadDialog({ projectId: initialProjectId, trigger }: DocumentUploadDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    documentType: "" as DocumentType | "",
    requiresSignature: false,
  });
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);

  // Fetch all projects for selection
  const { data: projects } = useQuery({
    queryKey: ["projects-for-upload"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch all users for assignment
  const { data: allUsers } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Initialize user assignments when users load
  const initializeAssignments = () => {
    if (allUsers && userAssignments.length === 0) {
      setUserAssignments(
        allUsers.map((u) => ({
          userId: u.user_id,
          fullName: u.full_name,
          email: u.email,
          canSign: false,
          selected: false,
        }))
      );
    }
  };

  // Call this when dialog opens and users are loaded
  if (open && allUsers && userAssignments.length === 0) {
    initializeAssignments();
  }

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !user || !selectedProjectId) throw new Error("Missing required fields");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${selectedProjectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("site-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("site-documents")
        .getPublicUrl(fileName);

      // Create document record
      const { data: document, error: docError } = await supabase
        .from("site_documents")
        .insert({
          project_id: selectedProjectId,
          title: formData.title,
          description: formData.description || null,
          document_type: formData.documentType as DocumentType,
          file_url: urlData.publicUrl,
          requires_signature: formData.requiresSignature,
          is_active: true,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Create assignments for selected users
      const selectedUsers = userAssignments.filter((u) => u.selected);
      if (selectedUsers.length > 0) {
        const assignments = selectedUsers.map((u) => ({
          document_id: document.id,
          user_id: u.userId,
          can_sign: u.canSign,
          assigned_by: user.id,
        }));

        const { error: assignError } = await supabase
          .from("document_assignments")
          .insert(assignments);

        if (assignError) console.error("Assignment error:", assignError);
      }

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents"] });
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
      toast.success("Document uploaded successfully");
      setOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Failed to upload document", { description: error.message });
    },
  });

  const resetForm = () => {
    setFile(null);
    setFormData({
      title: "",
      description: "",
      documentType: "",
      requiresSignature: false,
    });
    setUserAssignments([]);
    if (!initialProjectId) setSelectedProjectId("");
  };

  const toggleUserSelection = (userId: string) => {
    setUserAssignments((prev) =>
      prev.map((u) =>
        u.userId === userId ? { ...u, selected: !u.selected } : u
      )
    );
  };

  const toggleCanSign = (userId: string) => {
    setUserAssignments((prev) =>
      prev.map((u) =>
        u.userId === userId ? { ...u, canSign: !u.canSign } : u
      )
    );
  };

  const selectAllUsers = () => {
    setUserAssignments((prev) => prev.map((u) => ({ ...u, selected: true })));
  };

  const deselectAllUsers = () => {
    setUserAssignments((prev) =>
      prev.map((u) => ({ ...u, selected: false, canSign: false }))
    );
  };

  const isValid =
    file && formData.title && formData.documentType && selectedProjectId;

  const selectedCount = userAssignments.filter((u) => u.selected).length;
  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload a document and assign it to employees
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Document File</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              placeholder="Document title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select
              value={formData.documentType}
              onValueChange={(value: DocumentType) =>
                setFormData({ ...formData, documentType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="doc-description">Description (Optional)</Label>
            <Textarea
              id="doc-description"
              placeholder="Brief description of the document"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Requires Signature */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="requires-signature"
              checked={formData.requiresSignature}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, requiresSignature: checked === true })
              }
            />
            <Label htmlFor="requires-signature" className="cursor-pointer">
              This document requires signatures
            </Label>
          </div>

          {/* User Assignments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assign to Employees ({selectedCount} selected)
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllUsers}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllUsers}
                >
                  Clear
                </Button>
              </div>
            </div>

            <ScrollArea className="h-48 rounded-md border p-3">
              <div className="space-y-2">
                {userAssignments.map((assignment) => (
                  <div
                    key={assignment.userId}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      assignment.selected ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={assignment.selected}
                        onCheckedChange={() =>
                          toggleUserSelection(assignment.userId)
                        }
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {assignment.fullName}
                        </p>
                        {assignment.email && (
                          <p className="text-xs text-muted-foreground">
                            {assignment.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {assignment.selected && formData.requiresSignature && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`sign-${assignment.userId}`}
                          checked={assignment.canSign}
                          onCheckedChange={() =>
                            toggleCanSign(assignment.userId)
                          }
                        />
                        <Label
                          htmlFor={`sign-${assignment.userId}`}
                          className="text-xs cursor-pointer"
                        >
                          Can Sign
                        </Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!isValid || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload & Assign
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
