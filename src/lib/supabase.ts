import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side supabase instance
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side supabase client factory
export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
}

// Database type definitions
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'SuperAdmin' | 'Admin' | 'Assistant'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'SuperAdmin' | 'Admin' | 'Assistant'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'SuperAdmin' | 'Admin' | 'Assistant'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          type: 'Lead' | 'Prospect' | 'Client' | 'Closed'
          source: string | null
          budget_min: number | null
          budget_max: number | null
          preferred_area: string | null
          notes: string | null
          assigned_agent: string | null
          last_contact: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          type?: 'Lead' | 'Prospect' | 'Client' | 'Closed'
          source?: string | null
          budget_min?: number | null
          budget_max?: number | null
          preferred_area?: string | null
          notes?: string | null
          assigned_agent?: string | null
          last_contact?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          type?: 'Lead' | 'Prospect' | 'Client' | 'Closed'
          source?: string | null
          budget_min?: number | null
          budget_max?: number | null
          preferred_area?: string | null
          notes?: string | null
          assigned_agent?: string | null
          last_contact?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          address: string
          client_id: string | null
          price: number
          commission_rate: number
          gross_commission: number | null
          net_commission: number | null
          broker_commission: number | null
          status: 'Active' | 'Pending' | 'Closed'
          closing_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          address: string
          client_id?: string | null
          price: number
          commission_rate: number
          gross_commission?: number | null
          net_commission?: number | null
          broker_commission?: number | null
          status?: 'Active' | 'Pending' | 'Closed'
          closing_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          address?: string
          client_id?: string | null
          price?: number
          commission_rate?: number
          gross_commission?: number | null
          net_commission?: number | null
          broker_commission?: number | null
          status?: 'Active' | 'Pending' | 'Closed'
          closing_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          client_id: string | null
          filename: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          filename: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          filename?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          title: string
          description: string | null
          client_id: string | null
          start_time: string
          end_time: string
          location: string | null
          type: 'Showing' | 'Meeting' | 'Call' | 'Deadline' | null
          status: 'Scheduled' | 'Completed' | 'Cancelled'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          client_id?: string | null
          start_time: string
          end_time: string
          location?: string | null
          type?: 'Showing' | 'Meeting' | 'Call' | 'Deadline' | null
          status?: 'Scheduled' | 'Completed' | 'Cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          client_id?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          type?: 'Showing' | 'Meeting' | 'Call' | 'Deadline' | null
          status?: 'Scheduled' | 'Completed' | 'Cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          read: boolean
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string | null
          type: 'client_created' | 'client_updated' | 'transaction_created' | 'transaction_updated' | 'appointment_created' | 'appointment_updated' | 'document_uploaded' | 'note_added'
          title: string
          description: string | null
          entity_type: 'client' | 'transaction' | 'appointment' | 'document' | null
          entity_id: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: 'client_created' | 'client_updated' | 'transaction_created' | 'transaction_updated' | 'appointment_created' | 'appointment_updated' | 'document_uploaded' | 'note_added'
          title: string
          description?: string | null
          entity_type?: 'client' | 'transaction' | 'appointment' | 'document' | null
          entity_id?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: 'client_created' | 'client_updated' | 'transaction_created' | 'transaction_updated' | 'appointment_created' | 'appointment_updated' | 'document_uploaded' | 'note_added'
          title?: string
          description?: string | null
          entity_type?: 'client' | 'transaction' | 'appointment' | 'document' | null
          entity_id?: string | null
          metadata?: any
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_super_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}