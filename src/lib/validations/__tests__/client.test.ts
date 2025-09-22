import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { describe } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { describe } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { describe } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { describe } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { describe } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { describe } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { describe } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { describe } from 'vitest'
import { describe } from 'vitest'
import { validateClientData, validateContactPreferences, sanitizeClientData } from '../client'
import type { ClientInsert } from '@/types'

describe('validateClientData', () => {
  describe('name validation', () => {
    it('should require name', () => {
      const data: Partial<ClientInsert> = { name: '' }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'name', message: 'Name is required' })
    })

    it('should require name with whitespace only', () => {
      const data: Partial<ClientInsert> = { name: '   ' }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'name', message: 'Name is required' })
    })

    it('should require minimum length', () => {
      const data: Partial<ClientInsert> = { name: 'A' }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'name', message: 'Name must be at least 2 characters long' })
    })

    it('should enforce maximum length', () => {
      const data: Partial<ClientInsert> = { name: 'A'.repeat(101) }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'name', message: 'Name must be less than 100 characters' })
    })

    it('should accept valid name', () => {
      const data: Partial<ClientInsert> = { name: 'John Doe' }
      const errors = validateClientData(data)
      expect(errors.filter(e => e.field === 'name')).toHaveLength(0)
    })
  })

  describe('email validation', () => {
    it('should require email', () => {
      const data: Partial<ClientInsert> = { email: '' }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'email', message: 'Email is required' })
    })

    it('should validate email format', () => {
      const data: Partial<ClientInsert> = { email: 'invalid-email' }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'email', message: 'Invalid email format' })
    })

    it('should enforce maximum length', () => {
      const data: Partial<ClientInsert> = { email: 'a'.repeat(250) + '@example.com' }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'email', message: 'Email must be less than 255 characters' })
    })

    it('should accept valid email', () => {
      const data: Partial<ClientInsert> = { email: 'john@example.com' }
      const errors = validateClientData(data)
      expect(errors.filter(e => e.field === 'email')).toHaveLength(0)
    })
  })

  describe('phone validation', () => {
    it('should accept valid phone numbers', () => {
      const validPhones = [
        '555-123-4567',
        '(555) 123-4567',
        '+1 555 123 4567',
        '15551234567'
      ]

      validPhones.forEach(phone => {
        const data: Partial<ClientInsert> = { phone }
        const errors = validateClientData(data)
        expect(errors.filter(e => e.field === 'phone')).toHaveLength(0)
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'abc-def-ghij',
        '0000000000'  // Starts with 0
      ]

      invalidPhones.forEach(phone => {
        const data: Partial<ClientInsert> = { phone }
        const errors = validateClientData(data)
        expect(errors.filter(e => e.field === 'phone').length).toBeGreaterThan(0)
      })
    })

    it('should accept short valid phone numbers', () => {
      const data: Partial<ClientInsert> = { phone: '123' }
      const errors = validateClientData(data)
      expect(errors.filter(e => e.field === 'phone')).toHaveLength(0)
    })

    it('should enforce maximum length', () => {
      const data: Partial<ClientInsert> = { phone: '1'.repeat(25) }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'phone', message: 'Phone number is too long' })
    })

    it('should allow empty phone', () => {
      const data: Partial<ClientInsert> = { phone: '' }
      const errors = validateClientData(data)
      expect(errors.filter(e => e.field === 'phone')).toHaveLength(0)
    })
  })

  describe('client type validation', () => {
    it('should accept valid client types', () => {
      const validTypes = ['Lead', 'Prospect', 'Client', 'Closed'] as const

      validTypes.forEach(type => {
        const data: Partial<ClientInsert> = { type }
        const errors = validateClientData(data)
        expect(errors.filter(e => e.field === 'type')).toHaveLength(0)
      })
    })

    it('should reject invalid client type', () => {
      const data: Partial<ClientInsert> = { type: 'InvalidType' as any }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'type', message: 'Invalid client type' })
    })
  })

  describe('budget validation', () => {
    it('should validate budget range', () => {
      const data: Partial<ClientInsert> = { budget_min: 500000, budget_max: 100000 }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ 
        field: 'budget', 
        message: 'Minimum budget cannot be greater than maximum budget' 
      })
    })

    it('should reject negative budgets', () => {
      const data: Partial<ClientInsert> = { budget_min: -1000 }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'budget_min', message: 'Minimum budget cannot be negative' })
    })

    it('should reject extremely large budgets', () => {
      const data: Partial<ClientInsert> = { budget_max: 200000000 }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'budget_max', message: 'Maximum budget is too large' })
    })

    it('should accept valid budget range', () => {
      const data: Partial<ClientInsert> = { budget_min: 100000, budget_max: 500000 }
      const errors = validateClientData(data)
      expect(errors.filter(e => e.field.includes('budget'))).toHaveLength(0)
    })
  })

  describe('field length validation', () => {
    it('should enforce source length limit', () => {
      const data: Partial<ClientInsert> = { source: 'A'.repeat(101) }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'source', message: 'Source must be less than 100 characters' })
    })

    it('should enforce preferred area length limit', () => {
      const data: Partial<ClientInsert> = { preferred_area: 'A'.repeat(256) }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'preferred_area', message: 'Preferred area must be less than 255 characters' })
    })

    it('should enforce notes length limit', () => {
      const data: Partial<ClientInsert> = { notes: 'A'.repeat(5001) }
      const errors = validateClientData(data)
      expect(errors).toContainEqual({ field: 'notes', message: 'Notes must be less than 5000 characters' })
    })
  })
})

describe('validateContactPreferences', () => {
  it('should require at least one contact method', () => {
    const preferences = {
      email: false,
      phone: false,
      sms: false,
      preferred_time: 'business_hours',
      preferred_method: 'email' as const
    }
    const errors = validateContactPreferences(preferences)
    expect(errors).toContainEqual({ 
      field: 'contact_preferences', 
      message: 'At least one contact method must be enabled' 
    })
  })

  it('should validate preferred method is enabled - email', () => {
    const preferences = {
      email: false,
      phone: true,
      sms: false,
      preferred_time: 'business_hours',
      preferred_method: 'email' as const
    }
    const errors = validateContactPreferences(preferences)
    expect(errors).toContainEqual({ 
      field: 'preferred_method', 
      message: 'Email must be enabled if it is the preferred method' 
    })
  })

  it('should validate preferred method is enabled - phone', () => {
    const preferences = {
      email: true,
      phone: false,
      sms: false,
      preferred_time: 'business_hours',
      preferred_method: 'phone' as const
    }
    const errors = validateContactPreferences(preferences)
    expect(errors).toContainEqual({ 
      field: 'preferred_method', 
      message: 'Phone must be enabled if it is the preferred method' 
    })
  })

  it('should validate preferred method is enabled - sms', () => {
    const preferences = {
      email: true,
      phone: false,
      sms: false,
      preferred_time: 'business_hours',
      preferred_method: 'sms' as const
    }
    const errors = validateContactPreferences(preferences)
    expect(errors).toContainEqual({ 
      field: 'preferred_method', 
      message: 'SMS must be enabled if it is the preferred method' 
    })
  })

  it('should accept valid preferences', () => {
    const preferences = {
      email: true,
      phone: true,
      sms: false,
      preferred_time: 'business_hours',
      preferred_method: 'email' as const
    }
    const errors = validateContactPreferences(preferences)
    expect(errors).toHaveLength(0)
  })
})

describe('sanitizeClientData', () => {
  it('should trim and clean string fields', () => {
    const data: Partial<ClientInsert> = {
      name: '  John Doe  ',
      email: '  JOHN@EXAMPLE.COM  ',
      phone: '  555-123-4567  ',
      source: '  Website  ',
      preferred_area: '  Downtown  ',
      notes: '  Some notes  '
    }

    const sanitized = sanitizeClientData(data)

    expect(sanitized.name).toBe('John Doe')
    expect(sanitized.email).toBe('john@example.com')
    expect(sanitized.phone).toBe('555-123-4567')
    expect(sanitized.source).toBe('Website')
    expect(sanitized.preferred_area).toBe('Downtown')
    expect(sanitized.notes).toBe('Some notes')
  })

  it('should handle null and empty values', () => {
    const data: Partial<ClientInsert> = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '',
      source: null,
      budget_min: null,
      budget_max: 0
    }

    const sanitized = sanitizeClientData(data)

    expect(sanitized.name).toBe('John Doe')
    expect(sanitized.email).toBe('john@example.com')
    expect(sanitized.phone).toBe(null)
    expect(sanitized.source).toBe(null)
    expect(sanitized.budget_min).toBe(null)
    expect(sanitized.budget_max).toBe(null)
  })

  it('should preserve valid numeric values', () => {
    const data: Partial<ClientInsert> = {
      budget_min: 100000,
      budget_max: 500000
    }

    const sanitized = sanitizeClientData(data)

    expect(sanitized.budget_min).toBe(100000)
    expect(sanitized.budget_max).toBe(500000)
  })

  it('should handle undefined fields', () => {
    const data: Partial<ClientInsert> = {
      name: 'John Doe'
    }

    const sanitized = sanitizeClientData(data)

    expect(sanitized.name).toBe('John Doe')
    expect(sanitized.email).toBeUndefined()
    expect(sanitized.phone).toBeUndefined()
  })
})