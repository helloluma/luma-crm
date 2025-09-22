import { describe, it, expect } from 'vitest'
import {
  transactionSchema,
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
  commissionCalculationSchema,
  csvTransactionSchema,
} from '../transaction'

describe('Transaction Validation', () => {
  describe('transactionSchema', () => {
    it('should validate a complete transaction object', () => {
      const validTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        address: '123 Main St, City, State 12345',
        client_id: '123e4567-e89b-12d3-a456-426614174001',
        price: 250000,
        commission_rate: 3.0,
        net_commission: 6000,
        broker_commission: 1500,
        status: 'Active' as const,
        closing_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const result = transactionSchema.parse(validTransaction)
      expect(result).toEqual(validTransaction)
    })

    it('should require address', () => {
      const invalidTransaction = {
        client_id: '123e4567-e89b-12d3-a456-426614174001',
        price: 250000,
        commission_rate: 3.0,
      }

      expect(() => transactionSchema.parse(invalidTransaction)).toThrow()
    })

    it('should require valid client_id UUID', () => {
      const invalidTransaction = {
        address: '123 Main St',
        client_id: 'invalid-uuid',
        price: 250000,
        commission_rate: 3.0,
      }

      expect(() => transactionSchema.parse(invalidTransaction)).toThrow('Invalid client ID')
    })

    it('should require positive price', () => {
      const invalidTransaction = {
        address: '123 Main St',
        client_id: '123e4567-e89b-12d3-a456-426614174001',
        price: -1000,
        commission_rate: 3.0,
      }

      expect(() => transactionSchema.parse(invalidTransaction)).toThrow('Price must be positive')
    })

    it('should validate commission rate range', () => {
      const invalidTransaction = {
        address: '123 Main St',
        client_id: '123e4567-e89b-12d3-a456-426614174001',
        price: 250000,
        commission_rate: 150,
      }

      expect(() => transactionSchema.parse(invalidTransaction)).toThrow('Commission rate cannot exceed 100%')
    })

    it('should validate status enum', () => {
      const invalidTransaction = {
        address: '123 Main St',
        client_id: '123e4567-e89b-12d3-a456-426614174001',
        price: 250000,
        commission_rate: 3.0,
        status: 'InvalidStatus',
      }

      expect(() => transactionSchema.parse(invalidTransaction)).toThrow()
    })

    it('should default status to Active', () => {
      const transaction = {
        address: '123 Main St',
        client_id: '123e4567-e89b-12d3-a456-426614174001',
        price: 250000,
        commission_rate: 3.0,
      }

      const result = transactionSchema.parse(transaction)
      expect(result.status).toBe('Active')
    })
  })

  describe('createTransactionSchema', () => {
    it('should validate transaction creation data', () => {
      const validData = {
        address: '123 Main St, City, State 12345',
        client_id: '123e4567-e89b-12d3-a456-426614174001',
        price: 250000,
        commission_rate: 3.0,
        status: 'Active' as const,
      }

      const result = createTransactionSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should not allow id in creation data', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        address: '123 Main St',
        client_id: '123e4567-e89b-12d3-a456-426614174001',
        price: 250000,
        commission_rate: 3.0,
      }

      const result = createTransactionSchema.parse(invalidData)
      expect(result).not.toHaveProperty('id')
    })
  })

  describe('updateTransactionSchema', () => {
    it('should allow partial updates', () => {
      const validUpdate = {
        price: 275000,
        status: 'Pending' as const,
      }

      const result = updateTransactionSchema.parse(validUpdate)
      expect(result).toEqual(validUpdate)
    })

    it('should allow empty updates', () => {
      const result = updateTransactionSchema.parse({})
      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('transactionFiltersSchema', () => {
    it('should validate filter parameters', () => {
      const validFilters = {
        status: ['Active', 'Pending'],
        price_min: 100000,
        price_max: 500000,
        search: 'Main St',
        page: 2,
        limit: 20,
        sort_by: 'price' as const,
        sort_order: 'asc' as const,
      }

      const result = transactionFiltersSchema.parse(validFilters)
      expect(result).toEqual(validFilters)
    })

    it('should apply default values', () => {
      const result = transactionFiltersSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.sort_by).toBe('created_at')
      expect(result.sort_order).toBe('desc')
    })

    it('should limit maximum page size', () => {
      const filters = { limit: 200 }
      expect(() => transactionFiltersSchema.parse(filters)).toThrow()
    })
  })

  describe('commissionCalculationSchema', () => {
    it('should validate commission calculation parameters', () => {
      const validCalculation = {
        price: 250000,
        commission_rate: 3.0,
        broker_split: 25,
      }

      const result = commissionCalculationSchema.parse(validCalculation)
      expect(result).toEqual(validCalculation)
    })

    it('should default broker split to 20%', () => {
      const calculation = {
        price: 250000,
        commission_rate: 3.0,
      }

      const result = commissionCalculationSchema.parse(calculation)
      expect(result.broker_split).toBe(20)
    })

    it('should validate broker split range', () => {
      const invalidCalculation = {
        price: 250000,
        commission_rate: 3.0,
        broker_split: 150,
      }

      expect(() => commissionCalculationSchema.parse(invalidCalculation)).toThrow()
    })
  })

  describe('csvTransactionSchema', () => {
    it('should parse CSV transaction data', () => {
      const csvData = {
        address: '123 Main St',
        client_name: 'John Doe',
        source: 'Instagram',
        side: 'buyer' as const,
        price: '$250,000.00',
        commission_rate: '3.0%',
        gross_commission: '$7,500.00',
        net_commission: '$6,000.00',
        broker_commission: '$1,500.00',
        status: 'Active',
        closing_date: '2024-12-31',
      }

      const result = csvTransactionSchema.parse(csvData)
      expect(result.price).toBe(250000)
      expect(result.commission_rate).toBe(3.0)
      expect(result.gross_commission).toBe(7500)
      expect(result.net_commission).toBe(6000)
      expect(result.broker_commission).toBe(1500)
      expect(result.status).toBe('Active')
    })

    it('should handle price format variations', () => {
      const testCases = [
        { input: '$250,000.00', expected: 250000 },
        { input: '250000', expected: 250000 },
        { input: '250,000', expected: 250000 },
        { input: '$250000', expected: 250000 },
      ]

      testCases.forEach(({ input, expected }) => {
        const result = csvTransactionSchema.parse({
          address: '123 Main St',
          client_name: 'John Doe',
          price: input,
          commission_rate: '3.0',
        })
        expect(result.price).toBe(expected)
      })
    })

    it('should handle commission rate format variations', () => {
      const testCases = [
        { input: '3.0%', expected: 3.0 },
        { input: '3.0', expected: 3.0 },
        { input: '2.5%', expected: 2.5 },
        { input: '4', expected: 4 },
      ]

      testCases.forEach(({ input, expected }) => {
        const result = csvTransactionSchema.parse({
          address: '123 Main St',
          client_name: 'John Doe',
          price: '250000',
          commission_rate: input,
        })
        expect(result.commission_rate).toBe(expected)
      })
    })

    it('should handle empty optional fields', () => {
      const csvData = {
        address: '123 Main St',
        client_name: 'John Doe',
        price: '250000',
        commission_rate: '3.0',
        gross_commission: '',
        net_commission: '',
        broker_commission: '',
      }

      const result = csvTransactionSchema.parse(csvData)
      expect(result.gross_commission).toBeNull()
      expect(result.net_commission).toBeNull()
      expect(result.broker_commission).toBeNull()
    })

    it('should normalize status values', () => {
      const testCases = [
        { input: 'ACTIVE', expected: 'Active' },
        { input: 'pending', expected: 'Pending' },
        { input: 'CLOSED', expected: 'Closed' },
        { input: 'sold', expected: 'Closed' },
        { input: 'unknown', expected: 'Active' },
        { input: '', expected: 'Active' },
      ]

      testCases.forEach(({ input, expected }) => {
        const result = csvTransactionSchema.parse({
          address: '123 Main St',
          client_name: 'John Doe',
          price: '250000',
          commission_rate: '3.0',
          status: input,
        })
        expect(result.status).toBe(expected)
      })
    })

    it('should throw error for invalid price format', () => {
      const csvData = {
        address: '123 Main St',
        client_name: 'John Doe',
        price: 'invalid-price',
        commission_rate: '3.0',
      }

      expect(() => csvTransactionSchema.parse(csvData)).toThrow('Invalid price format')
    })

    it('should throw error for invalid commission rate format', () => {
      const csvData = {
        address: '123 Main St',
        client_name: 'John Doe',
        price: '250000',
        commission_rate: 'invalid-rate',
      }

      expect(() => csvTransactionSchema.parse(csvData)).toThrow('Invalid commission rate format')
    })
  })
})