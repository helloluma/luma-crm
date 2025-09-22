-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "SuperAdmins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SuperAdmin'
    )
  );

CREATE POLICY "SuperAdmins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SuperAdmin'
    )
  );

-- Clients table policies
CREATE POLICY "Users can view clients assigned to them" ON public.clients
  FOR SELECT USING (
    assigned_agent = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
    )
  );

CREATE POLICY "Users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (
    assigned_agent = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
    )
  );

CREATE POLICY "Users can update their assigned clients" ON public.clients
  FOR UPDATE USING (
    assigned_agent = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
    )
  );

CREATE POLICY "SuperAdmins and Admins can delete clients" ON public.clients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
    )
  );

-- Transactions table policies
CREATE POLICY "Users can view transactions for their clients" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = transactions.client_id 
      AND (assigned_agent = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.profiles 
             WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
           ))
    )
  );

CREATE POLICY "Users can insert transactions for their clients" ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = transactions.client_id 
      AND (assigned_agent = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.profiles 
             WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
           ))
    )
  );

CREATE POLICY "Users can update transactions for their clients" ON public.transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = transactions.client_id 
      AND (assigned_agent = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.profiles 
             WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
           ))
    )
  );

CREATE POLICY "SuperAdmins and Admins can delete transactions" ON public.transactions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
    )
  );

-- Documents table policies
CREATE POLICY "Users can view documents for their clients" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = documents.client_id 
      AND (assigned_agent = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.profiles 
             WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
           ))
    )
  );

CREATE POLICY "Users can insert documents for their clients" ON public.documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = documents.client_id 
      AND (assigned_agent = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.profiles 
             WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
           ))
    )
  );

CREATE POLICY "Users can delete their uploaded documents" ON public.documents
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
    )
  );

-- Appointments table policies
CREATE POLICY "Users can view appointments for their clients" ON public.appointments
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = appointments.client_id 
      AND (assigned_agent = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.profiles 
             WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
           ))
    )
  );

CREATE POLICY "Users can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    (client_id IS NULL OR
     EXISTS (
       SELECT 1 FROM public.clients 
       WHERE id = appointments.client_id 
       AND (assigned_agent = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
            ))
     ))
  );

CREATE POLICY "Users can update their appointments" ON public.appointments
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
    )
  );

CREATE POLICY "Users can delete their appointments" ON public.appointments
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Admin')
    )
  );

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications for users" ON public.notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());-- Activiti
es table policies (to be added when activities table is created)
-- These will be applied after running migration 004_activities_table.sql
-- ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view their own activities" ON public.activities
--   FOR SELECT USING (user_id = auth.uid());
-- 
-- CREATE POLICY "System can insert activities for users" ON public.activities
--   FOR INSERT WITH CHECK (true); -- Allow system triggers to create activities
-- 
-- CREATE POLICY "Users can insert their own activities" ON public.activities
--   FOR INSERT WITH CHECK (user_id = auth.uid());