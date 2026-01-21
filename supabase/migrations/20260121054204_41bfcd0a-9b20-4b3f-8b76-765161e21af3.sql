-- Add signature_data column to project_signons for storing hand-drawn signatures
ALTER TABLE public.project_signons 
ADD COLUMN signature_data TEXT;