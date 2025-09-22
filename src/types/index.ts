// Global type definitions for the Real Estate CRM application
import type { Database } from '@/lib/supabase'

// Database table types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']

// Insert types for forms
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type ActivityInsert = Database['public']['Tables']['activities']['Insert']

// Update types for forms
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']
export type ActivityUpdate = Database['public']['Tables']['activities']['Update']

// Enum types
export type UserRole = Profile['role']
export type ClientType = Client['type']
export type TransactionStatus = Transaction['status']
export type AppointmentType = Appointment['type']
export type AppointmentStatus = Appointment['status']
export type NotificationType = Notification['type']
export type ActivityType = Activity['type']

// Extended types with relationships
export interface ActivityWithUser extends Activity {
  user?: Profile
}

export interface ClientWithAgent extends Client {
  assigned_agent_profile?: Profile
}

export interface TransactionWithClient extends Transaction {
  client?: Client
}

export interface AppointmentWithClient extends Appointment {
  client?: Client
  created_by_profile?: Profile
}

export interface DocumentWithClient extends Document {
  client?: Client
  uploaded_by_profile?: Profile
}

// Form validation types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  name: string
  role: UserRole
}

export interface ForgotPasswordForm {
  email: string
}

export interface ResetPasswordForm {
  password: string
  confirmPassword: string
}

export interface ClientForm {
  name: string
  email: string
  phone?: string
  type: ClientType
  source?: string
  budget_min?: number
  budget_max?: number
  preferred_area?: string
  notes?: string
}

export interface TransactionForm {
  address: string
  client_id: string
  price: number
  commission_rate: number
  net_commission?: number
  broker_commission?: number
  status: TransactionStatus
  closing_date?: string
}

export interface CSVTransaction {
  address: string
  client_name: string
  client_id?: string
  source?: string
  side?: 'seller' | 'buyer' | 'both'
  price: number
  commission_rate: number
  gross_commission?: number | null
  net_commission?: number | null
  broker_commission?: number | null
  status?: TransactionStatus
  closing_date?: string | null
}

export interface AppointmentForm {
  title: string
  description?: string
  client_id?: string
  start_time: string
  end_time: string
  location?: string
  type?: AppointmentType
  is_recurring?: boolean
  recurrence_rule?: string
  recurrence_end_date?: string
  parent_appointment_id?: string
}

export interface RecurringAppointmentForm extends AppointmentForm {
  is_recurring: true
  recurringPattern?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    interval?: number
    byweekday?: number[]
    bymonthday?: number[]
    bymonth?: number[]
    count?: number
    until?: string
  }
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}

// Dashboard types
export interface DashboardMetrics {
  totalClients: number
  activeDeals: number
  monthlyRevenue: number
  conversionRate: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string | null
  timestamp: string
  user?: Profile
  entity_type?: string | null
  entity_id?: string | null
  metadata?: any
}

// Chart data types
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

// Filter and search types
export interface ClientFilters {
  type?: ClientType[]
  assignedAgent?: string[]
  source?: string[]
  budgetRange?: [number, number]
  search?: string
}

export interface TransactionFilters {
  status?: TransactionStatus[]
  dateRange?: [string, string]
  priceRange?: [number, number]
  search?: string
}

// Notification preferences
export interface NotificationPreferences {
  email: {
    newLeads: boolean
    appointmentReminders: boolean
    deadlineAlerts: boolean
    transactionUpdates: boolean
  }
  sms: {
    urgentDeadlines: boolean
    appointmentReminders: boolean
  }
  inApp: {
    allNotifications: boolean
  }
}