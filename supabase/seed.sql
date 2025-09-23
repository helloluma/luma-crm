-- Seed data for development environment
-- Note: This should only be run in development environments

-- Insert sample profiles (these would normally be created via auth signup)
-- For development, we'll create some sample data assuming users exist
-- Note: SuperAdmin is hardcoded and not available for registration
-- All signups are Realtors; Assistants are added by Realtors via dashboard
INSERT INTO public.profiles (id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@realestate.com', 'Admin User', 'SuperAdmin'),
  ('00000000-0000-0000-0000-000000000002', 'agent1@realestate.com', 'John Smith', 'Realtor'),
  ('00000000-0000-0000-0000-000000000003', 'agent2@realestate.com', 'Sarah Johnson', 'Realtor')
ON CONFLICT (id) DO NOTHING;

-- Insert sample clients
INSERT INTO public.clients (id, name, email, phone, type, source, budget_min, budget_max, preferred_area, notes, assigned_agent) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Michael Brown', 'michael.brown@email.com', '+1-555-0101', 'Lead', 'Website', 300000, 450000, 'Downtown', 'Interested in modern condos', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002', 'Emily Davis', 'emily.davis@email.com', '+1-555-0102', 'Prospect', 'Referral', 500000, 750000, 'Suburbs', 'Looking for family home with good schools', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003', 'Robert Wilson', 'robert.wilson@email.com', '+1-555-0103', 'Client', 'Cold Call', 200000, 300000, 'East Side', 'First-time buyer, needs guidance', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000004', 'Lisa Anderson', 'lisa.anderson@email.com', '+1-555-0104', 'Closed', 'Website', 400000, 600000, 'West End', 'Successfully closed on dream home', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000005', 'David Martinez', 'david.martinez@email.com', '+1-555-0105', 'Lead', 'Social Media', 350000, 500000, 'North District', 'Interested in investment properties', '00000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO public.transactions (id, address, client_id, price, commission_rate, net_commission, broker_commission, status, closing_date) VALUES
  ('20000000-0000-0000-0000-000000000001', '123 Main St, Downtown', '10000000-0000-0000-0000-000000000004', 550000, 3.0, 13200, 3300, 'Closed', '2024-01-15'),
  ('20000000-0000-0000-0000-000000000002', '456 Oak Ave, Suburbs', '10000000-0000-0000-0000-000000000002', 675000, 2.5, 13500, 3375, 'Pending', '2024-02-28'),
  ('20000000-0000-0000-0000-000000000003', '789 Pine Rd, East Side', '10000000-0000-0000-0000-000000000003', 285000, 3.5, 7980, 1995, 'Active', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample appointments
INSERT INTO public.appointments (id, title, description, client_id, start_time, end_time, location, type, status, created_by) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Property Showing - Downtown Condo', 'Show modern condo units to Michael', '10000000-0000-0000-0000-000000000001', '2024-02-15 14:00:00+00', '2024-02-15 15:00:00+00', '123 Main St', 'Showing', 'Scheduled', '00000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000002', 'Client Meeting - Emily Davis', 'Discuss financing options and preferences', '10000000-0000-0000-0000-000000000002', '2024-02-16 10:00:00+00', '2024-02-16 11:00:00+00', 'Office', 'Meeting', 'Scheduled', '00000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003', 'Closing Deadline', 'Final paperwork deadline for Robert Wilson', '10000000-0000-0000-0000-000000000003', '2024-02-20 16:00:00+00', '2024-02-20 17:00:00+00', 'Title Company', 'Deadline', 'Scheduled', '00000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Insert sample notifications
INSERT INTO public.notifications (id, user_id, title, message, type, read) VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'New Lead Assigned', 'Michael Brown has been assigned to you as a new lead', 'info', false),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Appointment Reminder', 'Property showing with Michael Brown tomorrow at 2:00 PM', 'warning', false),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Deadline Alert', 'Closing deadline for Robert Wilson is in 3 days', 'error', false),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Transaction Update', 'Emily Davis transaction moved to Pending status', 'success', true)
ON CONFLICT (id) DO NOTHING;