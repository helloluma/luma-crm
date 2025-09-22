import { z } from 'zod'

// Transaction status enum
export const transactionStatusSchema = z.enum(['Active', 'Pending', 'Closed'])

// Base transaction schema
export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  address: z.string().min(1, 'Address is required').max(255, 'Address must be less than 255 characters'),
  client_id: z.string().uuid('Invalid client ID'),
  price: z.number().positive('Price must be positive'),
  commission_rate: z.number().min(0, 'Commission rate cannot be negative').max(100, 'Commission rate cannot exceed 100%'),
  net_commission: z.number().optional().nullable(),
  broker_commission: z.number().optional().nullable(),
  status: transactionStatusSchema.default('Active'),
  closing_date: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

// Schema for creating a new transaction
export const createTransactionSchema = transactionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

// Schema for updating a transaction
export const updateTransactionSchema = z.object({
  address: z.string().min(1, 'Address is required').max(255, 'Address must be less than 255 characters').optional(),
  client_id: z.string().uuid('Invalid client ID').optional(),
  price: z.number().positive('Price must be positive').optional(),
  commission_rate: z.number().min(0, 'Commission rate cannot be negative').max(100, 'Commission rate cannot exceed 100%').optional(),
  net_commission: z.number().optional().nullable(),
  broker_commission: z.number().optional().nullable(),
  status: transactionStatusSchema.optional(),
  closing_date: z.string().optional().nullable(),
})

// Schema for transaction filters
export const transactionFiltersSchema = z.object({
  status: z.array(transactionStatusSchema).optional(),
  client_id: z.string().uuid().optional(),
  price_min: z.number().positive().optional(),
  price_max: z.number().positive().optional(),
  closing_date_from: z.string().optional(),
  closing_date_to: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sort_by: z.enum(['address', 'price', 'commission_rate', 'status', 'closing_date', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// Commission calculation schema
export const commissionCalculationSchema = z.object({
  price: z.number().positive('Price must be positive'),
  commission_rate: z.number().min(0, 'Commission rate cannot be negative').max(100, 'Commission rate cannot exceed 100%'),
  broker_split: z.number().min(0, 'Broker split cannot be negative').max(100, 'Broker split cannot exceed 100%').default(20),
})

// CSV import schema for transactions
export const csvTransactionSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  client_name: z.string().min(1, 'Client name is required'),
  source: z.string().optional(),
  side: z.enum(['seller', 'buyer', 'both']).optional(),
  price: z.string().transform((val) => {
    // Remove currency symbols and commas, then parse as number
    const cleaned = val.replace(/[$,]/g, '')
    const parsed = parseFloat(cleaned)
    if (isNaN(parsed)) throw new Error('Invalid price format')
    return parsed
  }),
  commission_rate: z.string().transform((val) => {
    // Handle percentage format (e.g., "3.0%" or "3.0")
    const cleaned = val.replace(/%/g, '')
    const parsed = parseFloat(cleaned)
    if (isNaN(parsed)) throw new Error('Invalid commission rate format')
    return parsed
  }),
  gross_commission: z.string().optional().transform((val) => {
    if (!val || val === '') return null
    const cleaned = val.replace(/[$,]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }),
  net_commission: z.string().optional().transform((val) => {
    if (!val || val === '') return null
    const cleaned = val.replace(/[$,]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }),
  broker_commission: z.string().optional().transform((val) => {
    if (!val || val === '') return null
    const cleaned = val.replace(/[$,]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }),
  status: z.string().optional().transform((val) => {
    if (!val) return 'Active'
    const normalized = val.toLowerCase()
    if (normalized.includes('active')) return 'Active'
    if (normalized.includes('pending')) return 'Pending'
    if (normalized.includes('closed') || normalized.includes('sold')) return 'Closed'
    return 'Active'
  }),
  closing_date: z.string().optional().nullable(),
})

// Type exports
export type TransactionStatus = z.infer<typeof transactionStatusSchema>
export type Transaction = z.infer<typeof transactionSchema>
export type CreateTransaction = z.infer<typeof createTransactionSchema>
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>
export type CommissionCalculation = z.infer<typeof commissionCalculationSchema>
export type CSVTransaction = z.infer<typeof csvTransactionSchema>