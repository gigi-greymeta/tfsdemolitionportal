-- Create helper function to check if user is a manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'manager'::app_role
  )
$$;

-- Create helper function to check if user is a contractor
CREATE OR REPLACE FUNCTION public.is_contractor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'contractor'::app_role
  )
$$;

-- Create helper function to check if user has management access (admin or manager)
CREATE OR REPLACE FUNCTION public.has_management_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'manager'::app_role)
  )
$$;

-- Update logs RLS policy to allow managers to view all logs
DROP POLICY IF EXISTS "Users can view own logs" ON public.logs;
DROP POLICY IF EXISTS "Users can view own logs or managers view all" ON public.logs;
CREATE POLICY "Users can view own logs or managers view all" 
ON public.logs FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR public.has_management_access());

-- Update dockets RLS policy to allow managers to view all dockets
DROP POLICY IF EXISTS "Users can view own dockets" ON public.dockets;
DROP POLICY IF EXISTS "Users can view own dockets or managers view all" ON public.dockets;
CREATE POLICY "Users can view own dockets or managers view all" 
ON public.dockets FOR SELECT TO authenticated 
USING (public.has_management_access() OR EXISTS (SELECT 1 FROM public.logs l WHERE l.id = dockets.log_id AND l.user_id = auth.uid()));

-- Allow managers to insert/update/delete clients (like admins)
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Management can insert clients" ON public.clients;
CREATE POLICY "Management can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.has_management_access());

DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Management can update clients" ON public.clients;
CREATE POLICY "Management can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.has_management_access());

DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Management can delete clients" ON public.clients;
CREATE POLICY "Management can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.has_management_access());

-- Allow managers to insert/update/delete assets (like admins)
DROP POLICY IF EXISTS "Admins can insert assets" ON public.assets;
DROP POLICY IF EXISTS "Management can insert assets" ON public.assets;
CREATE POLICY "Management can insert assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (public.has_management_access());

DROP POLICY IF EXISTS "Admins can update assets" ON public.assets;
DROP POLICY IF EXISTS "Management can update assets" ON public.assets;
CREATE POLICY "Management can update assets" ON public.assets FOR UPDATE TO authenticated USING (public.has_management_access());

DROP POLICY IF EXISTS "Admins can delete assets" ON public.assets;
DROP POLICY IF EXISTS "Management can delete assets" ON public.assets;
CREATE POLICY "Management can delete assets" ON public.assets FOR DELETE TO authenticated USING (public.has_management_access());

-- Allow managers to insert/update/delete jobs (like admins)
DROP POLICY IF EXISTS "Admins can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Management can insert jobs" ON public.jobs;
CREATE POLICY "Management can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.has_management_access());

DROP POLICY IF EXISTS "Admins can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Management can update jobs" ON public.jobs;
CREATE POLICY "Management can update jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.has_management_access());

DROP POLICY IF EXISTS "Admins can delete jobs" ON public.jobs;
DROP POLICY IF EXISTS "Management can delete jobs" ON public.jobs;
CREATE POLICY "Management can delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.has_management_access());

-- Allow managers to manage user roles
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Management can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_management_access());

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Management can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_management_access());

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Management can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_management_access());

-- Allow managers to manage dockets
DROP POLICY IF EXISTS "Admins can insert dockets" ON public.dockets;
CREATE POLICY "Management can insert dockets" ON public.dockets FOR INSERT TO authenticated WITH CHECK (public.has_management_access());

DROP POLICY IF EXISTS "Admins can update dockets" ON public.dockets;
CREATE POLICY "Management can update dockets" ON public.dockets FOR UPDATE TO authenticated USING (public.has_management_access());

DROP POLICY IF EXISTS "Admins can delete dockets" ON public.dockets;
CREATE POLICY "Management can delete dockets" ON public.dockets FOR DELETE TO authenticated USING (public.has_management_access());