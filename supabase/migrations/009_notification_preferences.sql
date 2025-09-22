-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Email preferences
  email_new_leads BOOLEAN DEFAULT true,
  email_appointment_reminders BOOLEAN DEFAULT true,
  email_deadline_alerts BOOLEAN DEFAULT true,
  email_transaction_updates BOOLEAN DEFAULT true,
  email_client_messages BOOLEAN DEFAULT true,
  email_system_notifications BOOLEAN DEFAULT false,
  
  -- SMS preferences
  sms_urgent_deadlines BOOLEAN DEFAULT true,
  sms_appointment_reminders BOOLEAN DEFAULT true,
  sms_emergency_alerts BOOLEAN DEFAULT true,
  
  -- In-app preferences
  inapp_all_notifications BOOLEAN DEFAULT true,
  
  -- Contact information
  phone_number TEXT,
  
  -- Notification frequency settings
  email_frequency TEXT CHECK (email_frequency IN ('immediate', 'hourly', 'daily', 'weekly')) DEFAULT 'immediate',
  sms_frequency TEXT CHECK (sms_frequency IN ('immediate', 'urgent_only')) DEFAULT 'urgent_only',
  
  -- Quiet hours (24-hour format)
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  quiet_hours_enabled BOOLEAN DEFAULT true,
  
  -- Timezone
  timezone TEXT DEFAULT 'UTC',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notification preferences" ON public.notification_preferences
  FOR DELETE USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON public.notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get or create notification preferences for a user
CREATE OR REPLACE FUNCTION get_or_create_notification_preferences(p_user_id UUID)
RETURNS public.notification_preferences AS $$
DECLARE
  preferences public.notification_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO preferences 
  FROM public.notification_preferences 
  WHERE user_id = p_user_id;
  
  -- If no preferences exist, create default ones
  IF NOT FOUND THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO preferences;
  END IF;
  
  RETURN preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;