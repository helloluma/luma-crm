import type { ClientInsert, ClientUpdate } from '@/types'

export interface ValidationError {
  field: string
  message: string
}

export interface ContactPreferences {
  email: boolean
  phone: boolean
  sms: boolean
  preferred_time: string
  preferred_method: 'email' | 'phone' | 'sms'
}

export function validateClientData(data: Partial<ClientInsert>): ValidationError[] {
  const errors: ValidationError[] = []

  // Validate name
  if (data.name !== undefined) {
    if (!data.name || !data.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' })
    } else if (data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters long' })
    } else if (data.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name must be less than 100 characters' })
    }
  }

  // Validate email
  if (data.email !== undefined) {
    if (!data.email || !data.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' })
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' })
      } else if (data.email.length > 255) {
        errors.push({ field: 'email', message: 'Email must be less than 255 characters' })
      }
    }
  }

  // Validate client type
  if (data.type !== undefined) {
    const validTypes = ['Lead', 'Prospect', 'Client', 'Closed']
    if (!validTypes.includes(data.type)) {
      errors.push({ field: 'type', message: 'Invalid client type' })
    }
  }

  // Validate budget range
  if (data.budget_min !== undefined && data.budget_max !== undefined) {
    if (data.budget_min && data.budget_max && data.budget_min > data.budget_max) {
      errors.push({ 
        field: 'budget', 
        message: 'Minimum budget cannot be greater than maximum budget' 
      })
    }
  }

  // Validate individual budget values
  if (data.budget_min !== undefined && data.budget_min !== null) {
    if (data.budget_min < 0) {
      errors.push({ field: 'budget_min', message: 'Minimum budget cannot be negative' })
    } else if (data.budget_min > 100000000) {
      errors.push({ field: 'budget_min', message: 'Minimum budget is too large' })
    }
  }

  if (data.budget_max !== undefined && data.budget_max !== null) {
    if (data.budget_max < 0) {
      errors.push({ field: 'budget_max', message: 'Maximum budget cannot be negative' })
    } else if (data.budget_max > 100000000) {
      errors.push({ field: 'budget_max', message: 'Maximum budget is too large' })
    }
  }

  // Validate phone format (optional but if provided should be reasonable)
  if (data.phone !== undefined && data.phone) {
    const cleanPhone = data.phone.replace(/[\s\-\(\)\.]/g, '')
    
    if (cleanPhone.length > 20) {
      errors.push({ field: 'phone', message: 'Phone number is too long' })
    } else if (cleanPhone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(cleanPhone)) {
        errors.push({ field: 'phone', message: 'Invalid phone number format' })
      }
    }
  }

  // Validate source
  if (data.source !== undefined && data.source && data.source.length > 100) {
    errors.push({ field: 'source', message: 'Source must be less than 100 characters' })
  }

  // Validate preferred area
  if (data.preferred_area !== undefined && data.preferred_area && data.preferred_area.length > 255) {
    errors.push({ field: 'preferred_area', message: 'Preferred area must be less than 255 characters' })
  }

  // Validate notes
  if (data.notes !== undefined && data.notes && data.notes.length > 5000) {
    errors.push({ field: 'notes', message: 'Notes must be less than 5000 characters' })
  }

  return errors
}

export function validateContactPreferences(preferences: ContactPreferences): ValidationError[] {
  const errors: ValidationError[] = []

  // At least one contact method should be enabled
  if (!preferences.email && !preferences.phone && !preferences.sms) {
    errors.push({ 
      field: 'contact_preferences', 
      message: 'At least one contact method must be enabled' 
    })
  }

  // Validate preferred method is enabled
  if (preferences.preferred_method === 'email' && !preferences.email) {
    errors.push({ 
      field: 'preferred_method', 
      message: 'Email must be enabled if it is the preferred method' 
    })
  }

  if (preferences.preferred_method === 'phone' && !preferences.phone) {
    errors.push({ 
      field: 'preferred_method', 
      message: 'Phone must be enabled if it is the preferred method' 
    })
  }

  if (preferences.preferred_method === 'sms' && !preferences.sms) {
    errors.push({ 
      field: 'preferred_method', 
      message: 'SMS must be enabled if it is the preferred method' 
    })
  }

  return errors
}

export function sanitizeClientData(data: Partial<ClientInsert>): Partial<ClientInsert> {
  const sanitized: Partial<ClientInsert> = {}

  if (data.name !== undefined) {
    sanitized.name = data.name.trim()
  }

  if (data.email !== undefined) {
    sanitized.email = data.email.toLowerCase().trim()
  }

  if (data.phone !== undefined) {
    sanitized.phone = data.phone?.trim() || null
  }

  if (data.type !== undefined) {
    sanitized.type = data.type
  }

  if (data.source !== undefined) {
    sanitized.source = data.source?.trim() || null
  }

  if (data.budget_min !== undefined) {
    sanitized.budget_min = data.budget_min || null
  }

  if (data.budget_max !== undefined) {
    sanitized.budget_max = data.budget_max || null
  }

  if (data.preferred_area !== undefined) {
    sanitized.preferred_area = data.preferred_area?.trim() || null
  }

  if (data.notes !== undefined) {
    sanitized.notes = data.notes?.trim() || null
  }

  if (data.assigned_agent !== undefined) {
    sanitized.assigned_agent = data.assigned_agent
  }

  if (data.last_contact !== undefined) {
    sanitized.last_contact = data.last_contact
  }

  return sanitized
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}