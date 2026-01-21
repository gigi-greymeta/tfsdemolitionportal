-- Create storage bucket for site documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-documents', 'site-documents', true);

-- Allow authenticated users to view documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-documents' AND auth.uid() IS NOT NULL);

-- Allow management to upload documents
CREATE POLICY "Management can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-documents' AND has_management_access());

-- Allow management to update documents
CREATE POLICY "Management can update documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-documents' AND has_management_access());

-- Allow management to delete documents
CREATE POLICY "Management can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-documents' AND has_management_access());