-- Add recurring appointment support to appointments table
ALTER TABLE public.appointments 
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_rule TEXT, -- RRULE format for recurring patterns
ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Create index for recurring appointments
CREATE INDEX idx_appointments_recurring ON public.appointments(is_recurring);
CREATE INDEX idx_appointments_parent ON public.appointments(parent_appointment_id);

-- Add comments for clarity
COMMENT ON COLUMN public.appointments.is_recurring IS 'Whether this appointment is part of a recurring series';
COMMENT ON COLUMN public.appointments.recurrence_rule IS 'RRULE format string defining recurrence pattern (e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR)';
COMMENT ON COLUMN public.appointments.recurrence_end_date IS 'End date for recurring appointments';
COMMENT ON COLUMN public.appointments.parent_appointment_id IS 'Reference to the original appointment in a recurring series';