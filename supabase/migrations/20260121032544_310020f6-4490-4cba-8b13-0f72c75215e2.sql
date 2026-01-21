-- Create table to track project sign-ons (daily attendance via QR scan)
CREATE TABLE public.project_signons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_signons ENABLE ROW LEVEL SECURITY;

-- Users can view sign-ons for projects they're enrolled in or management can view all
CREATE POLICY "Users can view project signons" 
ON public.project_signons 
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  has_management_access() OR
  EXISTS (
    SELECT 1 FROM project_enrollments pe 
    WHERE pe.project_id = project_signons.project_id 
    AND pe.user_id = auth.uid() 
    AND pe.status = 'approved'
  )
);

-- Authenticated users can sign onto projects
CREATE POLICY "Users can sign onto projects" 
ON public.project_signons 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_project_signons_project_id ON public.project_signons(project_id);
CREATE INDEX idx_project_signons_user_id ON public.project_signons(user_id);
CREATE INDEX idx_project_signons_signed_at ON public.project_signons(signed_at DESC);