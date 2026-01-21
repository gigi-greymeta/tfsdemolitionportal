-- Add project_number column to projects table
ALTER TABLE public.projects 
ADD COLUMN project_number text UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_projects_project_number ON public.projects(project_number);