-- Performance optimization indexes for Real Estate CRM
-- This migration adds indexes to improve query performance

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_assigned_agent ON clients(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON clients(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(last_contact DESC);

-- Full-text search index for clients
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients 
USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(notes, '')));

-- Composite index for common client queries
CREATE INDEX IF NOT EXISTS idx_clients_agent_type ON clients(assigned_agent, type);
CREATE INDEX IF NOT EXISTS idx_clients_type_created ON clients(type, created_at DESC);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_closing_date ON transactions(closing_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_price ON transactions(price DESC);

-- Composite indexes for transaction analytics
CREATE INDEX IF NOT EXISTS idx_transactions_status_date ON transactions(status, closing_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_client_status ON transactions(client_id, status);

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(type);

-- Composite indexes for calendar queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(created_by, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_type_date ON appointments(type, start_time DESC);

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_mime_type ON documents(mime_type);

-- Full-text search index for documents
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents 
USING gin(to_tsvector('english', filename));

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Composite indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, created_at DESC);

-- Activities table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity_id ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Composite index for activity feed
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, created_at DESC);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at DESC);

-- Add partial indexes for common filtered queries
-- Only index active/non-deleted records
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(assigned_agent, created_at DESC) 
WHERE type != 'Closed';

CREATE INDEX IF NOT EXISTS idx_transactions_active ON transactions(client_id, created_at DESC) 
WHERE status != 'Closed';

CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments(created_by, start_time) 
WHERE status = 'Scheduled' AND start_time > NOW();

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC) 
WHERE read = false;

-- Add indexes for foreign key constraints to improve join performance
-- These should already exist if foreign keys are properly defined, but adding explicitly
CREATE INDEX IF NOT EXISTS idx_transactions_client_fk ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_fk ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_fk ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_fk ON appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_user_fk ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_fk ON notifications(user_id);

-- Add expression indexes for common calculations
CREATE INDEX IF NOT EXISTS idx_transactions_commission ON transactions((price * commission_rate / 100));

-- Add indexes for date range queries
CREATE INDEX IF NOT EXISTS idx_transactions_date_range ON transactions(closing_date) 
WHERE closing_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_date_range ON appointments(start_time, end_time);

-- Performance monitoring table (optional)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('duration', 'count', 'size')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);

-- Add comments for documentation
COMMENT ON INDEX idx_clients_search IS 'Full-text search index for client names, emails, and notes';
COMMENT ON INDEX idx_clients_agent_type IS 'Composite index for filtering clients by agent and type';
COMMENT ON INDEX idx_transactions_status_date IS 'Composite index for transaction analytics by status and date';
COMMENT ON INDEX idx_appointments_user_date IS 'Composite index for user calendar queries';
COMMENT ON INDEX idx_notifications_user_read IS 'Composite index for unread notification counts';

-- Analyze tables to update statistics after creating indexes
ANALYZE clients;
ANALYZE transactions;
ANALYZE appointments;
ANALYZE documents;
ANALYZE notifications;
ANALYZE profiles;