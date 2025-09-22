import { render, screen, waitFor } from '@testing-library/react'
import { ClientStageHistory } from '../ClientStageHistory'
import { vi } from 'vitest'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock fetch
global.fetch = vi.fn()

const mockStageHistory = [
  {
    id: 'history-1',
    from_stage: null,
    to_stage: 'Lead',
    changed_by: 'user-1',
    changed_at: '2024-01-01T00:00:00.000Z',
    notes: null,
    deadline: null,
    changed_by_profile: {
      name: 'John Doe',
      avatar_url: null
    }
  },
  {
    id: 'history-2',
    from_stage: 'Lead',
    to_stage: 'Prospect',
    changed_by: 'user-1',
    changed_at: '2024-01-02T00:00:00.000Z',
    notes: 'Qualified lead after phone call',
    deadline: '2024-01-15T00:00:00.000Z',
    changed_by_profile: {
      name: 'John Doe',
      avatar_url: null
    }
  }
]

describe('ClientStageHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render stage history correctly', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockStageHistory })
    })

    render(<ClientStageHistory clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText('Stage History')).toBeInTheDocument()
      expect(screen.getByText('Created as Lead')).toBeInTheDocument()
      expect(screen.getByText('Moved from Lead to Prospect')).toBeInTheDocument()
    })
  })

  it('should show notes when present', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockStageHistory })
    })

    render(<ClientStageHistory clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText('Qualified lead after phone call')).toBeInTheDocument()
    })
  })

  it('should show deadline information when present', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockStageHistory })
    })

    render(<ClientStageHistory clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Deadline set for/)).toBeInTheDocument()
    })
  })

  it('should show changed by information', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockStageHistory })
    })

    render(<ClientStageHistory clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getAllByText('Changed by John Doe')).toHaveLength(2)
    })
  })

  it('should show loading state', () => {
    ;(fetch as any).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<ClientStageHistory clientId="client-1" />)

    // Check for loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should handle empty history', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] })
    })

    render(<ClientStageHistory clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText('No stage history available')).toBeInTheDocument()
    })
  })

  it('should handle fetch error', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch' })
    })

    render(<ClientStageHistory clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load stage history')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })
  })

  it('should format dates correctly', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockStageHistory })
    })

    render(<ClientStageHistory clientId="client-1" />)

    await waitFor(() => {
      // The first entry shows Dec 31, 2023 and the second shows Jan 1, 2024
      expect(screen.getByText('Dec 31, 2023')).toBeInTheDocument()
      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument()
    })
  })

  it('should show user initials when no avatar', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockStageHistory })
    })

    render(<ClientStageHistory clientId="client-1" />)

    await waitFor(() => {
      const avatars = screen.getAllByText('JD')
      expect(avatars.length).toBeGreaterThan(0)
    })
  })

  it('should show stage badges with correct colors', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockStageHistory })
    })

    render(<ClientStageHistory clientId="client-1" />)

    await waitFor(() => {
      const leadBadge = screen.getByText('Lead')
      const prospectBadge = screen.getByText('Prospect')
      
      expect(leadBadge).toHaveClass('text-yellow-600')
      expect(prospectBadge).toHaveClass('text-blue-600')
    })
  })
})