import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CalendarIntegration from '../CalendarIntegration'

// Mock fetch
import { vi } from 'vitest'

global.fetch = vi.fn()

const mockFetch = vi.mocked(fetch)

describe('CalendarIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    )

    render(<CalendarIntegration />)
    
    expect(screen.getByText('Calendar Integration')).toBeInTheDocument()
    // Check for loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should display integrations when loaded', async () => {
    const mockIntegrations = {
      integrations: {
        google: {
          id: 'integration-1',
          user_id: 'user-1',
          provider: 'google',
          calendar_name: 'Primary Calendar',
          sync_enabled: true,
          last_sync: '2024-01-15T10:00:00Z',
          created_at: '2024-01-01T00:00:00Z'
        },
        outlook: null
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIntegrations
    } as Response)

    render(<CalendarIntegration />)

    await waitFor(() => {
      expect(screen.getByText('Connected: Primary Calendar')).toBeInTheDocument()
      expect(screen.getByText('Not connected (Coming Soon)')).toBeInTheDocument()
    })

    expect(screen.getByText('Sync')).toBeInTheDocument()
    expect(screen.getByText('Disconnect')).toBeInTheDocument()
  })

  it('should handle Google Calendar connection', async () => {
    const mockIntegrations = {
      integrations: { google: null, outlook: null }
    }

    const mockAuthResponse = {
      authUrl: 'https://accounts.google.com/oauth/authorize?...'
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIntegrations
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse
      } as Response)

    // Mock window.location.href
    delete (window as any).location
    window.location = { href: '' } as any

    render(<CalendarIntegration />)

    await waitFor(() => {
      expect(screen.getByText('Connect')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Connect'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/calendar/google/auth')
      expect(window.location.href).toBe(mockAuthResponse.authUrl)
    })
  })

  it('should handle calendar sync', async () => {
    const mockIntegrations = {
      integrations: {
        google: {
          id: 'integration-1',
          user_id: 'user-1',
          provider: 'google',
          calendar_name: 'Primary Calendar',
          sync_enabled: true,
          last_sync: '2024-01-15T10:00:00Z',
          created_at: '2024-01-01T00:00:00Z'
        },
        outlook: null
      }
    }

    const mockSyncResponse = {
      message: 'Calendar sync completed',
      results: {
        imported: 3,
        exported: 2,
        errors: []
      }
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIntegrations
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSyncResponse
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIntegrations
      } as Response)

    render(<CalendarIntegration />)

    await waitFor(() => {
      expect(screen.getByText('Sync')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Sync'))

    await waitFor(() => {
      expect(screen.getByText('Syncing...')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Sync Completed')).toBeInTheDocument()
      expect(screen.getByText('Imported: 3 events')).toBeInTheDocument()
      expect(screen.getByText('Exported: 2 appointments')).toBeInTheDocument()
    })
  })

  it('should handle disconnect confirmation', async () => {
    const mockIntegrations = {
      integrations: {
        google: {
          id: 'integration-1',
          user_id: 'user-1',
          provider: 'google',
          calendar_name: 'Primary Calendar',
          sync_enabled: true,
          last_sync: '2024-01-15T10:00:00Z',
          created_at: '2024-01-01T00:00:00Z'
        },
        outlook: null
      }
    }

    // Mock window.confirm
    window.confirm = vi.fn().mockReturnValue(true)

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIntegrations
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Disconnected successfully' })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ integrations: { google: null, outlook: null } })
      } as Response)

    render(<CalendarIntegration />)

    await waitFor(() => {
      expect(screen.getByText('Disconnect')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Disconnect'))

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to disconnect google Calendar?')

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/calendar/integrations?provider=google', {
        method: 'DELETE'
      })
    })
  })

  it('should create public calendar', async () => {
    const mockIntegrations = {
      integrations: { google: null, outlook: null }
    }

    const mockPublicResponse = {
      message: 'Public calendar created successfully',
      publicUrl: 'http://localhost:3000/calendar/public/public-user-1-123456'
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIntegrations
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPublicResponse
      } as Response)

    render(<CalendarIntegration />)

    await waitFor(() => {
      expect(screen.getByText('Create Public Calendar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Create Public Calendar'))

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockPublicResponse.publicUrl)).toBeInTheDocument()
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })
  })

  it('should handle errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<CalendarIntegration />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load calendar integrations')).toBeInTheDocument()
    })
  })
})