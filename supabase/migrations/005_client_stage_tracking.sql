-- Add stage tracking fields to clients table
ALTER TABLE public.clients 
ADD COLUMN stage_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN stage_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN stage_notes TEXT,
ADD COLUMN previous_stage TEXT;

-- Create client_stage_history table for tracking stage changes
CREATE TABLE public.client_stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  deadline TIMESTAMP WITH TIME ZONE
);

-- Create client_stage_deadlines table for deadline tracking
CREATE TABLE public.client_stage_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_client_stage_history_client_id ON public.client_stage_history(client_id);
CREATE INDEX idx_client_stage_history_changed_at ON public.client_stage_history(changed_at);
CREATE INDEX idx_client_stage_deadlines_client_id ON public.client_stage_deadlines(client_id);
CREATE INDEX idx_client_stage_deadlines_deadline ON public.client_stage_deadlines(deadline);
CREATE INDEX idx_client_stage_deadlines_alert_sent ON public.client_stage_deadlines(alert_sent);

-- Add updated_at trigger for deadlines table
CREATE TRIGGER update_client_stage_deadlines_updated_at 
  BEFORE UPDATE ON public.client_stage_deadlines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically track stage changes
CREATE OR REPLACE FUNCTION track_client_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if stage actually changed
  IF OLD.type IS DISTINCT FROM NEW.type THEN
    -- Insert into stage history
    INSERT INTO public.client_stage_history (
      client_id,
      from_stage,
      to_stage,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.type,
      NEW.type,
      NEW.assigned_agent, -- Assuming the assigned agent made the change
      NEW.stage_notes
    );
    
    -- Update stage tracking fields
    NEW.stage_changed_at = NOW();
    NEW.previous_stage = OLD.type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stage tracking
CREATE TRIGGER track_client_stage_change_trigger
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION track_client_stage_change();

-- Function to check for upcoming deadlines and create notifications
CREATE OR REPLACE FUNCTION check_stage_deadlines()
RETURNS void AS $$
DECLARE
  deadline_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Check for deadlines within the next 24 hours that haven't been alerted
  FOR deadline_record IN
    SELECT 
      csd.*,
      c.name as client_name,
      c.assigned_agent
    FROM public.client_stage_deadlines csd
    JOIN public.clients c ON c.id = csd.client_id
    WHERE csd.deadline <= NOW() + INTERVAL '24 hours'
      AND csd.deadline > NOW()
      AND csd.alert_sent = FALSE
  LOOP
    -- Create notification title and message
    notification_title := 'Stage Deadline Approaching';
    notification_message := 'Client ' || deadline_record.client_name || 
                           ' has a ' || deadline_record.stage || 
                           ' stage deadline approaching on ' || 
                           TO_CHAR(deadline_record.deadline, 'MM/DD/YYYY at HH:MI AM');
    
    -- Insert notification for assigned agent
    IF deadline_record.assigned_agent IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        action_url
      ) VALUES (
        deadline_record.assigned_agent,
        notification_title,
        notification_message,
        'warning',
        '/clients/' || deadline_record.client_id
      );
    END IF;
    
    -- Mark alert as sent
    UPDATE public.client_stage_deadlines 
    SET alert_sent = TRUE, alert_sent_at = NOW()
    WHERE id = deadline_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to set default stage deadlines based on stage
CREATE OR REPLACE FUNCTION set_default_stage_deadline(
  p_client_id UUID,
  p_stage TEXT,
  p_created_by UUID
)
RETURNS void AS $$
DECLARE
  default_days INTEGER;
  deadline_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set default deadline days based on stage
  CASE p_stage
    WHEN 'Lead' THEN default_days := 7;      -- 1 week to follow up
    WHEN 'Prospect' THEN default_days := 14;  -- 2 weeks to convert
    WHEN 'Client' THEN default_days := 30;    -- 1 month to close
    WHEN 'Closed' THEN default_days := NULL;  -- No deadline for closed
    ELSE default_days := 7;                   -- Default 1 week
  END CASE;
  
  -- Only create deadline if default_days is set
  IF default_days IS NOT NULL THEN
    deadline_date := NOW() + (default_days || ' days')::INTERVAL;
    
    -- Insert or update deadline
    INSERT INTO public.client_stage_deadlines (
      client_id,
      stage,
      deadline,
      created_by
    ) VALUES (
      p_client_id,
      p_stage,
      deadline_date,
      p_created_by
    )
    ON CONFLICT (client_id, stage) 
    DO UPDATE SET 
      deadline = deadline_date,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;