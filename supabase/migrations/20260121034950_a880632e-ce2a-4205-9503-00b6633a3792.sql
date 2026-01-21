-- Create payslips table
CREATE TABLE public.payslips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- Users can view their own payslips
CREATE POLICY "Users can view own payslips"
ON public.payslips FOR SELECT
USING (user_id = auth.uid() OR has_management_access());

-- Management can insert payslips
CREATE POLICY "Management can insert payslips"
ON public.payslips FOR INSERT
WITH CHECK (has_management_access());

-- Management can update payslips
CREATE POLICY "Management can update payslips"
ON public.payslips FOR UPDATE
USING (has_management_access());

-- Management can delete payslips
CREATE POLICY "Management can delete payslips"
ON public.payslips FOR DELETE
USING (has_management_access());

-- Create trigger for updated_at
CREATE TRIGGER update_payslips_updated_at
BEFORE UPDATE ON public.payslips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for payslips
INSERT INTO storage.buckets (id, name, public)
VALUES ('payslips', 'payslips', false);

-- Users can view their own payslips in storage
CREATE POLICY "Users can view own payslip files"
ON storage.objects FOR SELECT
USING (bucket_id = 'payslips' AND auth.uid() IS NOT NULL);

-- Management can upload payslips
CREATE POLICY "Management can upload payslips"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payslips' AND has_management_access());

-- Management can update payslip files
CREATE POLICY "Management can update payslips"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payslips' AND has_management_access());

-- Management can delete payslip files
CREATE POLICY "Management can delete payslips"
ON storage.objects FOR DELETE
USING (bucket_id = 'payslips' AND has_management_access());