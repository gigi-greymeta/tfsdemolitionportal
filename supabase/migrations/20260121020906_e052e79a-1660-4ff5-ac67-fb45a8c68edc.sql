-- Create document assignments table first
CREATE TABLE public.document_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.site_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  can_sign BOOLEAN NOT NULL DEFAULT false,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- Enable RLS on document_assignments
ALTER TABLE public.document_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_assignments
CREATE POLICY "Users can view own assignments"
ON public.document_assignments FOR SELECT
USING (user_id = auth.uid() OR has_management_access());

CREATE POLICY "Management can insert assignments"
ON public.document_assignments FOR INSERT
WITH CHECK (has_management_access());

CREATE POLICY "Management can update assignments"
ON public.document_assignments FOR UPDATE
USING (has_management_access());

CREATE POLICY "Management can delete assignments"
ON public.document_assignments FOR DELETE
USING (has_management_access());

-- Now create storage policy that references the table
CREATE POLICY "Users can view assigned documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'site-documents'
  AND (
    has_management_access()
    OR EXISTS (
      SELECT 1 FROM public.document_assignments da
      JOIN public.site_documents sd ON sd.id = da.document_id
      WHERE sd.file_url LIKE '%' || storage.objects.name
        AND da.user_id = auth.uid()
    )
  )
);