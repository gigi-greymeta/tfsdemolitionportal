-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('driver', 'admin');

-- Create enum for load types
CREATE TYPE public.load_type AS ENUM ('Concrete', 'Steel', 'Mixed Waste', 'Bricks', 'Timber', 'Asbestos', 'Green Waste', 'Soil', 'Other');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'driver',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assets table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  asset_type TEXT,
  registration_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create logs table (runsheet entries)
CREATE TABLE public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME NOT NULL,
  finish_time TIME,
  break_duration INTEGER DEFAULT 0,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  load_type load_type NOT NULL,
  job_details TEXT,
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dockets table for invoicing
CREATE TABLE public.dockets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  docket_number TEXT NOT NULL UNIQUE,
  log_id UUID NOT NULL REFERENCES public.logs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dockets ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Function to generate docket number
CREATE OR REPLACE FUNCTION public.generate_docket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := 'TFS-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-';
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(docket_number FROM 10) AS INTEGER)), 0) + 1
  INTO new_number
  FROM public.dockets
  WHERE docket_number LIKE year_prefix || '%';
  
  RETURN year_prefix || LPAD(new_number::TEXT, 4, '0');
END;
$$;

-- Trigger function to create docket when log is completed
CREATE OR REPLACE FUNCTION public.create_docket_on_log_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create docket when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.dockets (docket_number, log_id, client_id)
    VALUES (public.generate_docket_number(), NEW.id, NEW.client_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating dockets
CREATE TRIGGER on_log_completed
  AFTER INSERT OR UPDATE ON public.logs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_docket_on_log_complete();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New Driver'), NEW.email);
  
  -- Default role is driver
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'driver');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile and role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function for automatic updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create update triggers for tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON public.logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_roles (read-only for users, admins can manage)
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());

-- RLS Policies for clients (all authenticated can read, admins can modify)
CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.is_admin());

-- RLS Policies for assets (all authenticated can read, admins can modify)
CREATE POLICY "Authenticated users can view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update assets" ON public.assets FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete assets" ON public.assets FOR DELETE TO authenticated USING (public.is_admin());

-- RLS Policies for jobs (all authenticated can read, admins can modify)
CREATE POLICY "Authenticated users can view jobs" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.is_admin());

-- RLS Policies for logs (drivers can manage own, admins can view all)
CREATE POLICY "Users can view own logs" ON public.logs FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own logs" ON public.logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for dockets (drivers can view own, admins can manage all)
CREATE POLICY "Users can view own dockets" ON public.dockets FOR SELECT TO authenticated 
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.logs l WHERE l.id = dockets.log_id AND l.user_id = auth.uid()));
CREATE POLICY "Admins can insert dockets" ON public.dockets FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update dockets" ON public.dockets FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete dockets" ON public.dockets FOR DELETE TO authenticated USING (public.is_admin());

-- Insert some sample data for clients
INSERT INTO public.clients (name, address, contact_person, contact_email) VALUES
  ('ABC Construction', '123 Builder St, Sydney NSW 2000', 'John Smith', 'john@abcconstruction.com.au'),
  ('XYZ Builders', '456 Trade Ave, Parramatta NSW 2150', 'Sarah Jones', 'sarah@xyzbuilders.com.au'),
  ('Metro Demolition', '789 Demo Lane, Liverpool NSW 2170', 'Mike Brown', 'mike@metrodemo.com.au'),
  ('City Council', '100 Council St, Bankstown NSW 2200', 'Lisa Green', 'lisa.green@council.nsw.gov.au');

-- Insert some sample assets
INSERT INTO public.assets (name, asset_type, registration_number) VALUES
  ('Truck 001', 'Tipper Truck', 'ABC-001'),
  ('Truck 002', 'Tipper Truck', 'ABC-002'),
  ('Truck 003', 'Semi Trailer', 'ABC-003'),
  ('Excavator 001', 'Excavator', 'EXC-001');

-- Insert some sample jobs
INSERT INTO public.jobs (name, description) VALUES
  ('Site Clearance', 'General site clearance and debris removal'),
  ('Demolition Waste', 'Waste removal from demolition projects'),
  ('Material Transport', 'Transport of construction materials'),
  ('Recycling Run', 'Transport to recycling facilities');