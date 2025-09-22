-- Create activities table for activity feed
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('client_created', 'client_updated', 'transaction_created', 'transaction_updated', 'appointment_created', 'appointment_updated', 'document_uploaded', 'note_added')),
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT CHECK (entity_type IN ('client', 'transaction', 'appointment', 'document')),
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_type ON public.activities(type);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_activities_entity ON public.activities(entity_type, entity_id);

-- Create function to automatically create activity records
CREATE OR REPLACE FUNCTION create_activity(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activities (user_id, type, title, description, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_type, p_title, p_description, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically log activities
CREATE OR REPLACE FUNCTION log_client_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_activity(
      NEW.assigned_agent,
      'client_created',
      'New client added: ' || NEW.name,
      'Client ' || NEW.name || ' was added as a ' || NEW.type,
      'client',
      NEW.id,
      jsonb_build_object('client_name', NEW.name, 'client_type', NEW.type)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log type changes
    IF OLD.type != NEW.type THEN
      PERFORM create_activity(
        NEW.assigned_agent,
        'client_updated',
        'Client stage updated: ' || NEW.name,
        'Client ' || NEW.name || ' moved from ' || OLD.type || ' to ' || NEW.type,
        'client',
        NEW.id,
        jsonb_build_object('client_name', NEW.name, 'old_type', OLD.type, 'new_type', NEW.type)
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_transaction_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_activity(
      (SELECT assigned_agent FROM public.clients WHERE id = NEW.client_id),
      'transaction_created',
      'New transaction: ' || NEW.address,
      'Transaction created for ' || NEW.address || ' - $' || NEW.price::text,
      'transaction',
      NEW.id,
      jsonb_build_object('address', NEW.address, 'price', NEW.price, 'status', NEW.status)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      PERFORM create_activity(
        (SELECT assigned_agent FROM public.clients WHERE id = NEW.client_id),
        'transaction_updated',
        'Transaction status updated: ' || NEW.address,
        'Transaction for ' || NEW.address || ' changed from ' || OLD.status || ' to ' || NEW.status,
        'transaction',
        NEW.id,
        jsonb_build_object('address', NEW.address, 'old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_appointment_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_activity(
      NEW.created_by,
      'appointment_created',
      'New appointment: ' || NEW.title,
      'Appointment scheduled for ' || NEW.start_time::date::text,
      'appointment',
      NEW.id,
      jsonb_build_object('title', NEW.title, 'type', NEW.type, 'start_time', NEW.start_time)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      PERFORM create_activity(
        NEW.created_by,
        'appointment_updated',
        'Appointment updated: ' || NEW.title,
        'Appointment ' || NEW.title || ' status changed to ' || NEW.status,
        'appointment',
        NEW.id,
        jsonb_build_object('title', NEW.title, 'old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_document_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_activity(
      NEW.uploaded_by,
      'document_uploaded',
      'Document uploaded: ' || NEW.filename,
      'Document ' || NEW.filename || ' was uploaded',
      'document',
      NEW.id,
      jsonb_build_object('filename', NEW.filename, 'file_size', NEW.file_size)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER client_activity_trigger
  AFTER INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION log_client_activity();

CREATE TRIGGER transaction_activity_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION log_transaction_activity();

CREATE TRIGGER appointment_activity_trigger
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION log_appointment_activity();

CREATE TRIGGER document_activity_trigger
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION log_document_activity();-- 
Enable Row Level Security on activities table
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Activities table policies
CREATE POLICY "Users can view their own activities" ON public.activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert activities for users" ON public.activities
  FOR INSERT WITH CHECK (true); -- Allow system triggers to create activities

CREATE POLICY "Users can insert their own activities" ON public.activities
  FOR INSERT WITH CHECK (user_id = auth.uid());