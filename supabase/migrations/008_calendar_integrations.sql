-- Create calendar integrations table
CREATE TABLE public.calendar_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT CHECK (provider IN ('google', 'outlook')) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, calendar_id)
);

-- Create public calendars table for sharing
CREATE TABLE public.public_calendars (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Google Calendar integration fields to appointments table
ALTER TABLE public.appointments 
ADD COLUMN google_event_id TEXT,
ADD COLUMN google_calendar_id TEXT,
ADD COLUMN outlook_event_id TEXT,
ADD COLUMN outlook_calendar_id TEXT;

-- Create indexes for performance
CREATE INDEX idx_calendar_integrations_user ON public.calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON public.calendar_integrations(provider);
CREATE INDEX idx_public_calendars_user ON public.public_calendars(user_id);
CREATE INDEX idx_appointments_google_event ON public.appointments(google_event_id);
CREATE INDEX idx_appointments_outlook_event ON public.appointments(outlook_event_id);

-- Enable RLS on new tables
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_calendars ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_integrations
CREATE POLICY "Users can view their own calendar integrations" ON public.calendar_integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own calendar integrations" ON public.calendar_integrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own calendar integrations" ON public.calendar_integrations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own calendar integrations" ON public.calendar_integrations
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for public_calendars
CREATE POLICY "Users can view their own public calendars" ON public.public_calendars
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own public calendars" ON public.public_calendars
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own public calendars" ON public.public_calendars
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own public calendars" ON public.public_calendars
  FOR DELETE USING (user_id = auth.uid());

-- Allow public access to public calendars for sharing
CREATE POLICY "Public calendars are viewable by anyone" ON public.public_calendars
  FOR SELECT USING (is_active = true);

-- Add comments for clarity
COMMENT ON TABLE public.calendar_integrations IS 'External calendar integrations (Google, Outlook, etc.)';
COMMENT ON TABLE public.public_calendars IS 'Public calendar sharing configurations';
COMMENT ON COLUMN public.appointments.google_event_id IS 'Google Calendar event ID for synced appointments';
COMMENT ON COLUMN public.appointments.google_calendar_id IS 'Google Calendar ID where the event is stored';
COMMENT ON COLUMN public.appointments.outlook_event_id IS 'Outlook Calendar event ID for synced appointments';
COMMENT ON COLUMN public.appointments.outlook_calendar_id IS 'Outlook Calendar ID where the event is stored';