'use client'

import { useState, useEffect } from 'react'
import { Save, X, User, Mail, Phone, MapPin, DollarSign, FileText, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { validateClientData, sanitizeClientData } from '@/lib/validations/client'
import type { Client, ClientInsert, ClientUpdate, ClientType, Profile } from '@/types'

interface ClientFormProps {
  client?: Client | null
  onSave: (data: ClientInsert | ClientUpdate) => Promise<void>
  onCancel: () => void
  className?: string
  mode?: 'create' | 'edit'
}

interface FormData {
  name: string
  email: string
  phone: string
  type: ClientType
  source: string
  budget_min: string
  budget_max: string
  preferred_area: string
  notes: string
  assigned_agent: string
  contact_preferences: {
    email: boolean
    phone: boolean
    sms: boolean
    preferred_time: string
    preferred_method: 'email' | 'phone' | 'sms'
  }
}

interface ValidationErrors {
  [key: string]: string
}

const CLIENT_TYPES: { value: ClientType; label: string; description: string }[] = [
  { value: 'Lead', label: 'Lead', description: 'Initial contact or inquiry' },
  { value: 'Prospect', label: 'Prospect', description: 'Qualified and engaged' },
  { value: 'Client', label: 'Client', description: 'Active client with agreement' },
  { value: 'Closed', label: 'Closed', description: 'Transaction completed' }
]

const CONTACT_SOURCES = [
  'Website',
  'Referral',
  'Social Media',
  'Cold Call',
  'Walk-in',
  'Advertisement',
  'Open House',
  'Previous Client',
  'Other'
]

export function ClientForm({ client, onSave, onCancel, className, mode = 'create' }: ClientFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    type: 'Lead',
    source: '',
    budget_min: '',
    budget_max: '',
    preferred_area: '',
    notes: '',
    assigned_agent: '',
    contact_preferences: {
      email: true,
      phone: true,
      sms: false,
      preferred_time: 'business_hours',
      preferred_method: 'email'
    }
  })

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [agents, setAgents] = useState<Profile[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)

  // Load form data from existing client
  useEffect(() => {
    if (client && mode === 'edit') {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        type: client.type || 'Lead',
        source: client.source || '',
        budget_min: client.budget_min?.toString() || '',
        budget_max: client.budget_max?.toString() || '',
        preferred_area: client.preferred_area || '',
        notes: client.notes || '',
        assigned_agent: client.assigned_agent || '',
        contact_preferences: {
          email: true,
          phone: true,
          sms: false,
          preferred_time: 'business_hours',
          preferred_method: 'email'
        }
      })
    }
  }, [client, mode])

  // Load available agents
  useEffect(() => {
    const loadAgents = async () => {
      setLoadingAgents(true)
      try {
        const response = await fetch('/api/profiles?role=Admin,SuperAdmin')
        if (response.ok) {
          const data = await response.json()
          setAgents(data.data || [])
        }
      } catch (error) {
        console.error('Error loading agents:', error)
      } finally {
        setLoadingAgents(false)
      }
    }

    loadAgents()
  }, [])

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setIsDirty(true)

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleContactPreferenceChange = (field: keyof FormData['contact_preferences'], value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      contact_preferences: {
        ...prev.contact_preferences,
        [field]: value
      }
    }))
    setIsDirty(true)
  }

  const validateForm = (): boolean => {
    const clientData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      type: formData.type,
      source: formData.source || undefined,
      budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
      budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
      preferred_area: formData.preferred_area || undefined,
      notes: formData.notes || undefined,
      assigned_agent: formData.assigned_agent || undefined
    }

    const errors = validateClientData(clientData)
    const errorMap: ValidationErrors = {}

    errors.forEach(error => {
      errorMap[error.field] = error.message
    })

    // Additional form-specific validations
    if (formData.budget_min && formData.budget_max) {
      const minBudget = Number(formData.budget_min)
      const maxBudget = Number(formData.budget_max)
      if (minBudget > maxBudget) {
        errorMap.budget = 'Minimum budget cannot be greater than maximum budget'
      }
    }

    setValidationErrors(errorMap)
    return Object.keys(errorMap).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const clientData = sanitizeClientData({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        type: formData.type,
        source: formData.source || null,
        budget_min: formData.budget_min ? Number(formData.budget_min) : null,
        budget_max: formData.budget_max ? Number(formData.budget_max) : null,
        preferred_area: formData.preferred_area || null,
        notes: formData.notes || null,
        assigned_agent: formData.assigned_agent || null
      })

      await onSave(clientData)
      setIsDirty(false)
    } catch (error) {
      console.error('Error saving client:', error)
      // Handle error - could show a toast notification
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?')
      if (!confirmed) return
    }
    onCancel()
  }

  return (
    <Card className={cn('max-w-4xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {mode === 'create' ? 'Add New Client' : `Edit Client: ${client?.name}`}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                    validationErrors.name ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="Enter client's full name"
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="client@example.com"
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                    validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="(555) 123-4567"
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Type
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CLIENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Preferences & Details
              </h3>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source
                </label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select source...</option>
                  {CONTACT_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="preferred_area" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Area
                </label>
                <input
                  type="text"
                  id="preferred_area"
                  value={formData.preferred_area}
                  onChange={(e) => handleInputChange('preferred_area', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Downtown, Suburbs, Waterfront"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="budget_min" className="block text-sm font-medium text-gray-700 mb-1">
                    Min Budget
                  </label>
                  <input
                    type="number"
                    id="budget_min"
                    value={formData.budget_min}
                    onChange={(e) => handleInputChange('budget_min', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                      validationErrors.budget ? 'border-red-300' : 'border-gray-300'
                    )}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Budget
                  </label>
                  <input
                    type="number"
                    id="budget_max"
                    value={formData.budget_max}
                    onChange={(e) => handleInputChange('budget_max', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                      validationErrors.budget ? 'border-red-300' : 'border-gray-300'
                    )}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              {validationErrors.budget && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.budget}
                </p>
              )}

              <div>
                <label htmlFor="assigned_agent" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Agent
                </label>
                <select
                  id="assigned_agent"
                  value={formData.assigned_agent}
                  onChange={(e) => handleInputChange('assigned_agent', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingAgents}
                >
                  <option value="">Select agent...</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Methods
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.contact_preferences.email}
                      onChange={(e) => handleContactPreferenceChange('email', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Email</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.contact_preferences.phone}
                      onChange={(e) => handleContactPreferenceChange('phone', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Phone Call</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.contact_preferences.sms}
                      onChange={(e) => handleContactPreferenceChange('sms', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SMS/Text</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <label htmlFor="preferred_method" className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Contact Method
                  </label>
                  <select
                    id="preferred_method"
                    value={formData.contact_preferences.preferred_method}
                    onChange={(e) => handleContactPreferenceChange('preferred_method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="preferred_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Best Time to Contact
                  </label>
                  <select
                    id="preferred_time"
                    value={formData.contact_preferences.preferred_time}
                    onChange={(e) => handleContactPreferenceChange('preferred_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="business_hours">Business Hours (9 AM - 5 PM)</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 8 PM)</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes & Additional Information
            </h3>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional notes about this client..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              <X className="h-4 w-4 inline mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(validationErrors).length > 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 inline mr-2" />
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Save Changes'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}