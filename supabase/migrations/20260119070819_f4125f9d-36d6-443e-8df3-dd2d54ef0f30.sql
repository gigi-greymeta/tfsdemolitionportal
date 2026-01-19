-- Create document types enum
CREATE TYPE public.document_type AS ENUM (
  'SWMS', 
  'JSEA', 
  'Site Safety Plan', 
  'Demolition Plan', 
  'Induction Checklist',
  'Training Certificate',
  'Other'
);

-- Create enrollment status enum
CREATE TYPE public.enrollment_status AS ENUM ('pending', 'approved', 'rejected');

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  client_id UUID REFERENCES public.clients(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site safety documents table
CREATE TABLE public.site_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_signature BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project enrollments table
CREATE TABLE public.project_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  asset_id UUID REFERENCES public.assets(id),
  status enrollment_status NOT NULL DEFAULT 'approved',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create document signatures table
CREATE TABLE public.document_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.site_documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signature_data TEXT,
  UNIQUE(document_id, user_id)
);

-- Create training records table
CREATE TABLE public.training_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin notifications table
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  user_id UUID NOT NULL,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Authenticated users can view active projects" ON public.projects
  FOR SELECT USING (is_active = true);

CREATE POLICY "Management can insert projects" ON public.projects
  FOR INSERT WITH CHECK (has_management_access());

CREATE POLICY "Management can update projects" ON public.projects
  FOR UPDATE USING (has_management_access());

CREATE POLICY "Management can delete projects" ON public.projects
  FOR DELETE USING (has_management_access());

-- Site documents policies
CREATE POLICY "Enrolled users can view project documents" ON public.site_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_enrollments pe
      WHERE pe.project_id = site_documents.project_id
      AND pe.user_id = auth.uid()
      AND pe.status = 'approved'
    ) OR has_management_access()
  );

CREATE POLICY "Management can manage documents" ON public.site_documents
  FOR ALL USING (has_management_access());

-- Project enrollments policies
CREATE POLICY "Users can view own enrollments" ON public.project_enrollments
  FOR SELECT USING (user_id = auth.uid() OR has_management_access());

CREATE POLICY "Users can enroll themselves" ON public.project_enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Management can update enrollments" ON public.project_enrollments
  FOR UPDATE USING (has_management_access());

CREATE POLICY "Management can delete enrollments" ON public.project_enrollments
  FOR DELETE USING (has_management_access());

-- Document signatures policies
CREATE POLICY "Users can view own signatures" ON public.document_signatures
  FOR SELECT USING (user_id = auth.uid() OR has_management_access());

CREATE POLICY "Users can sign documents" ON public.document_signatures
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Training records policies
CREATE POLICY "Users can view own training" ON public.training_records
  FOR SELECT USING (user_id = auth.uid() OR has_management_access());

CREATE POLICY "Management can manage training" ON public.training_records
  FOR ALL USING (has_management_access());

-- Admin notifications policies
CREATE POLICY "Management can view notifications" ON public.admin_notifications
  FOR SELECT USING (has_management_access());

CREATE POLICY "Authenticated users can create notifications" ON public.admin_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Management can update notifications" ON public.admin_notifications
  FOR UPDATE USING (has_management_access());

-- Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_documents_updated_at
  BEFORE UPDATE ON public.site_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_records_updated_at
  BEFORE UPDATE ON public.training_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();