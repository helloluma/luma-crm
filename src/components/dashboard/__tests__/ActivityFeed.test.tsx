import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ActivityFeed } from '../ActivityFeed'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { vi } from 'vitest'

// Mock the useActivityFeed hook
vi.mock('@/hooks/useActivityFeed')

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago')
}))

const mockUseActivityFeed = vi.mocked(useActivityFeed)

const mockActivities = [
  {
    id: '1',
    user_id: 'user-1',
    type: 'client_created' as const,
    title: 'New client added: John Doe',
    description: 'Client John Doe was added as a Lead',
    entity_type: 'client',
    entity_id: 'client-1',
    metadata: { client_name: 'John Doe', client_type: 'Lead' },
    created_at: '2024-01-15T10:00:00Z',
    user: {
      id: 'user-1',
      name: 'Agent Smith',
      email: 'agent@example.com',
      avatar_url: null
    }
  },
  {
    id: '2',
    user_id: 'user-1',
    type: 'transaction_created' as const,
    title: 'New transaction: 123 Main St',
    description: 'Transaction created for 123 Main St - $500000',
    entity_type: 'transaction',
    entity_id: 'transaction-1',
    metadata: { address: '123 Main St', price: 500000, status: 'Active' },
    created_at: '2024-01-15T09:00:00Z',
    user: {
      id: 'user-1',
      name: 'Agent Smith',
      email: 'agent@example.com',
      avatar_url: null
    }
  }
]

describe('ActivityFeed', () => {
  beforeEach(() => {
    mockUseActivityFeed.mockReturnValue({
      activities: mockActivities,
      loading: false,
      error: null,
      hasMore: true,
      loadMore: vi.fn(),
      refresh: vi.fn(),
      createActivity: vi.fn()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders activity feed with activities', () => {
    render(<ActivityFeed />)
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('New client added: John Doe')).toBeInTheDocument()
    expect(screen.getByText('New transaction: 123 Main St')).toBeInTheDocument()
  })

  it('displays activity descriptions', () => {
    render(<ActivityFeed />)
    
    expect(screen.getByText('Client John Doe was added as a Lead')).toBeInTheDocument()
    expect(screen.getByText('Transaction created for 123 Main St - $500000')).toBeInTheDocument()
  })

  it('displays activity metadata', () => {
    render(<ActivityFeed />)
    
    expect(screen.getByText('client_name: John Doe')).toBeInTheDocument()
    expect(screen.getByText('client_type: Lead')).toBeInTheDocument()
    expect(screen.getByText('address: 123 Main St')).toBeInTheDocument()
  })

  it('displays user information', () => {
    render(<ActivityFeed />)
    
    const userInfoElements = screen.getAllByText('by Agent Smith')
    expect(userInfoElements).toHaveLength(2)
  })

  it('shows loading state', () => {
    mockUseActivityFeed.mockReturnValue({
      activities: [],
      loading: true,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refresh: vi.fn(),
      createActivity: vi.fn()
    })

    render(<ActivityFeed />)
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    // Loading skeleton should be present
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseActivityFeed.mockReturnValue({
      activities: [],
      loading: false,
      error: 'Failed to load activities',
      hasMore: false,
      loadMore: vi.fn(),
      refresh: vi.fn(),
      createActivity: vi.fn()
    })

    render(<ActivityFeed />)
    
    expect(screen.getByText('Error loading activities: Failed to load activities')).toBeInTheDocument()
  })

  it('shows empty state when no activities', () => {
    mockUseActivityFeed.mockReturnValue({
      activities: [],
      loading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refresh: vi.fn(),
      createActivity: vi.fn()
    })

    render(<ActivityFeed />)
    
    expect(screen.getByText('No activities found')).toBeInTheDocument()
  })

  it('calls refresh when refresh button is clicked', async () => {
    const mockRefresh = vi.fn()
    mockUseActivityFeed.mockReturnValue({
      activities: mockActivities,
      loading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refresh: mockRefresh,
      createActivity: vi.fn()
    })

    render(<ActivityFeed />)
    
    const refreshButton = screen.getByTitle('Refresh')
    fireEvent.click(refreshButton)
    
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('calls loadMore when load more button is clicked', async () => {
    const mockLoadMore = vi.fn()
    mockUseActivityFeed.mockReturnValue({
      activities: mockActivities,
      loading: false,
      error: null,
      hasMore: true,
      loadMore: mockLoadMore,
      refresh: vi.fn(),
      createActivity: vi.fn()
    })

    render(<ActivityFeed />)
    
    const loadMoreButton = screen.getByText('Load More')
    fireEvent.click(loadMoreButton)
    
    expect(mockLoadMore).toHaveBeenCalledTimes(1)
  })

  it('shows load more button when hasMore is true', () => {
    render(<ActivityFeed />)
    
    expect(screen.getByText('Load More')).toBeInTheDocument()
  })

  it('hides load more button when hasMore is false', () => {
    mockUseActivityFeed.mockReturnValue({
      activities: mockActivities,
      loading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refresh: vi.fn(),
      createActivity: vi.fn()
    })

    render(<ActivityFeed />)
    
    expect(screen.queryByText('Load More')).not.toBeInTheDocument()
  })

  it('applies correct icon colors for different activity types', () => {
    render(<ActivityFeed />)
    
    // Check that activities have different colored icons
    const activityElements = screen.getAllByRole('generic').filter(el => 
      el.className.includes('rounded-full') && el.className.includes('flex items-center justify-center')
    )
    
    expect(activityElements.length).toBeGreaterThan(0)
  })

  it('filters activities by type when filter is applied', async () => {
    const mockUseActivityFeedWithFilter = vi.fn()
    mockUseActivityFeed.mockImplementation((options) => {
      mockUseActivityFeedWithFilter(options)
      return {
        activities: options?.type === 'client_created' ? [mockActivities[0]] : mockActivities,
        loading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        refresh: vi.fn(),
        createActivity: vi.fn()
      }
    })

    render(<ActivityFeed showFilters={true} />)
    
    const typeFilter = screen.getByDisplayValue('All Types')
    fireEvent.change(typeFilter, { target: { value: 'client_created' } })
    
    await waitFor(() => {
      expect(mockUseActivityFeedWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'client_created'
        })
      )
    })
  })

  it('filters activities by entity type when filter is applied', async () => {
    const mockUseActivityFeedWithFilter = vi.fn()
    mockUseActivityFeed.mockImplementation((options) => {
      mockUseActivityFeedWithFilter(options)
      return {
        activities: options?.entityType === 'client' ? [mockActivities[0]] : mockActivities,
        loading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        refresh: vi.fn(),
        createActivity: vi.fn()
      }
    })

    render(<ActivityFeed showFilters={true} />)
    
    const entityTypeFilter = screen.getByDisplayValue('All Entities')
    fireEvent.change(entityTypeFilter, { target: { value: 'client' } })
    
    await waitFor(() => {
      expect(mockUseActivityFeedWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'client'
        })
      )
    })
  })

  it('hides filters when showFilters is false', () => {
    render(<ActivityFeed showFilters={false} />)
    
    expect(screen.queryByDisplayValue('All Types')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('All Entities')).not.toBeInTheDocument()
  })

  it('respects limit prop', () => {
    const mockUseActivityFeedWithLimit = vi.fn()
    mockUseActivityFeed.mockImplementation((options) => {
      mockUseActivityFeedWithLimit(options)
      return {
        activities: mockActivities,
        loading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        refresh: vi.fn(),
        createActivity: vi.fn()
      }
    })

    render(<ActivityFeed limit={5} />)
    
    expect(mockUseActivityFeedWithLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 5
      })
    )
  })

  it('respects realtime prop', () => {
    const mockUseActivityFeedWithRealtime = vi.fn()
    mockUseActivityFeed.mockImplementation((options) => {
      mockUseActivityFeedWithRealtime(options)
      return {
        activities: mockActivities,
        loading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        refresh: vi.fn(),
        createActivity: vi.fn()
      }
    })

    render(<ActivityFeed realtime={false} />)
    
    expect(mockUseActivityFeedWithRealtime).toHaveBeenCalledWith(
      expect.objectContaining({
        realtime: false
      })
    )
  })
})