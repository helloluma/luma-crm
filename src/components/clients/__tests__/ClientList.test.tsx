import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ClientList } from '../ClientList'
import { useClients } from '@/hooks/useClients'
import type { ClientWithAgent } from '@/types'
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
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the useClients hook
vi.mock('@/hooks/useClients')
const mockUseClients = vi.mocked(useClients)

// Mock data
const mockClients: ClientWithAgent[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    type: 'Lead',
    source: 'Website',
    budget_min: 100000,
    budget_max: 200000,
    preferred_area: 'Downtown',
    notes: 'Interested in condos',
    assigned_agent: 'agent1',
    last_contact: '2024-01-15T10:00:00Z',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    assigned_agent_profile: {
      id: 'agent1',
      name: 'Agent Smith',
      email: 'agent@example.com',
      role: 'Admin',
      avatar_url: null,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1987654321',
    type: 'Prospect',
    source: 'Referral',
    budget_min: 200000,
    budget_max: 300000,
    preferred_area: 'Suburbs',
    notes: 'Looking for family home',
    assigned_agent: 'agent1',
    last_contact: '2024-01-20T10:00:00Z',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    assigned_agent_profile: {
      id: 'agent1',
      name: 'Agent Smith',
      email: 'agent@example.com',
      role: 'Admin',
      avatar_url: null,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: null,
    type: 'Client',
    source: 'Cold Call',
    budget_min: null,
    budget_max: null,
    preferred_area: null,
    notes: null,
    assigned_agent: 'agent1',
    last_contact: null,
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-08T10:00:00Z',
    assigned_agent_profile: {
      id: 'agent1',
      name: 'Agent Smith',
      email: 'agent@example.com',
      role: 'Admin',
      avatar_url: null,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  }
]

const defaultMockReturn = {
  clients: mockClients,
  loading: false,
  error: null,
  totalCount: 3,
  totalPages: 1,
  currentPage: 1,
  fetchClients: vi.fn(),
  refetch: vi.fn(),
  setPage: vi.fn(),
  setFilters: vi.fn(),
  clearFilters: vi.fn()
}

describe('ClientList', () => {
  beforeEach(() => {
    mockUseClients.mockReturnValue(defaultMockReturn)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders client list with header', () => {
    render(<ClientList />)
    
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('3 clients total')).toBeInTheDocument()
  })

  it('displays clients in grid view by default', () => {
    render(<ClientList />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('handles search input', async () => {
    const user = userEvent.setup()
    const mockSetFilters = vi.fn()
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      setFilters: mockSetFilters
    })

    render(<ClientList />)
    
    const searchInput = screen.getByPlaceholderText('Search clients by name, email, or phone...')
    await user.type(searchInput, 'John')
    
    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalledWith({
        search: 'John'
      })
    })
  })

  it('toggles between grid and list view', async () => {
    const user = userEvent.setup()
    render(<ClientList />)
    
    const listViewButton = screen.getByTitle('List view')
    await user.click(listViewButton)
    
    // Check if the view mode changed (grid classes should be different)
    const clientContainer = screen.getByText('John Doe').closest('.space-y-4')
    expect(clientContainer).toBeInTheDocument()
  })

  it('shows and hides filter panel', async () => {
    const user = userEvent.setup()
    render(<ClientList />)
    
    const filterButton = screen.getByText('Filters')
    await user.click(filterButton)
    
    expect(screen.getByText('Client Type')).toBeInTheDocument()
    expect(screen.getAllByText('Source')[0]).toBeInTheDocument()
    
    await user.click(filterButton)
    expect(screen.queryByText('Client Type')).not.toBeInTheDocument()
  })

  it('handles client type filtering', async () => {
    const user = userEvent.setup()
    const mockSetFilters = vi.fn()
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      setFilters: mockSetFilters
    })

    render(<ClientList />)
    
    // Open filters
    const filterButton = screen.getByText('Filters')
    await user.click(filterButton)
    
    // Select Lead type
    const leadCheckbox = screen.getByLabelText('Lead')
    await user.click(leadCheckbox)
    
    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalledWith({
        type: ['Lead']
      })
    })
  })

  it('handles source filtering', async () => {
    const user = userEvent.setup()
    const mockSetFilters = vi.fn()
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      setFilters: mockSetFilters
    })

    render(<ClientList />)
    
    // Open filters
    const filterButton = screen.getByText('Filters')
    await user.click(filterButton)
    
    // Select Website source
    const websiteCheckbox = screen.getByLabelText('Website')
    await user.click(websiteCheckbox)
    
    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalledWith({
        source: ['Website']
      })
    })
  })

  it('clears all filters', async () => {
    const user = userEvent.setup()
    const mockClearFilters = vi.fn()
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      clearFilters: mockClearFilters
    })

    render(<ClientList />)
    
    // Add some search text first
    const searchInput = screen.getByPlaceholderText('Search clients by name, email, or phone...')
    await user.type(searchInput, 'John')
    
    // Open filters and select a type
    const filterButton = screen.getByText('Filters')
    await user.click(filterButton)
    
    const leadCheckbox = screen.getByLabelText('Lead')
    await user.click(leadCheckbox)
    
    // Clear filters
    const clearButton = screen.getByText('Clear all filters')
    await user.click(clearButton)
    
    expect(mockClearFilters).toHaveBeenCalled()
    expect(searchInput).toHaveValue('')
  })

  it('handles sorting', async () => {
    const user = userEvent.setup()
    render(<ClientList />)
    
    const nameSort = screen.getByText('Name')
    await user.click(nameSort)
    
    // Should show sort indicator - check the button element itself
    const nameButton = screen.getByText('Name').closest('button')
    expect(nameButton).toHaveClass('bg-blue-100')
  })

  it('shows loading state', () => {
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      loading: true,
      clients: []
    })

    render(<ClientList />)
    
    expect(screen.getByText('Loading clients...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    const mockRefetch = vi.fn()
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      error: 'Failed to fetch clients',
      clients: [],
      refetch: mockRefetch
    })

    render(<ClientList />)
    
    expect(screen.getByText('Error:')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch clients')).toBeInTheDocument()
    
    const tryAgainButton = screen.getByText('Try again')
    fireEvent.click(tryAgainButton)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows empty state with no filters', () => {
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      clients: [],
      totalCount: 0
    })

    render(<ClientList />)
    
    expect(screen.getByText('No clients found')).toBeInTheDocument()
  })

  it('shows empty state with filters', async () => {
    const user = userEvent.setup()
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      clients: [],
      totalCount: 0
    })

    render(<ClientList />)
    
    // Add search to simulate active filters
    const searchInput = screen.getByPlaceholderText('Search clients by name, email, or phone...')
    await user.type(searchInput, 'NonExistent')
    
    await waitFor(() => {
      expect(screen.getByText('No clients match your filters')).toBeInTheDocument()
    })
  })

  it('calls callback functions when provided', async () => {
    const user = userEvent.setup()
    const mockOnEdit = vi.fn()
    const mockOnDelete = vi.fn()
    const mockOnView = vi.fn()
    const mockOnCreate = vi.fn()

    render(
      <ClientList
        onClientEdit={mockOnEdit}
        onClientDelete={mockOnDelete}
        onClientView={mockOnView}
        onClientCreate={mockOnCreate}
      />
    )
    
    // Test create button
    const addButton = screen.getByText('Add Client')
    await user.click(addButton)
    expect(mockOnCreate).toHaveBeenCalled()
  })

  it('shows pagination when multiple pages exist', () => {
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      totalPages: 3,
      currentPage: 2,
      totalCount: 30
    })

    render(<ClientList />)
    
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Showing 13 to 24 of 30 clients')).toBeInTheDocument()
  })

  it('handles pagination navigation', async () => {
    const user = userEvent.setup()
    const mockSetPage = vi.fn()
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      totalPages: 3,
      currentPage: 1,
      setPage: mockSetPage
    })

    render(<ClientList />)
    
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)
    
    expect(mockSetPage).toHaveBeenCalledWith(2)
  })

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()
    mockUseClients.mockReturnValue({
      ...defaultMockReturn,
      refetch: mockRefetch
    })

    render(<ClientList />)
    
    const refreshButton = screen.getByTitle('Refresh')
    await user.click(refreshButton)
    
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows filter count badge when filters are active', async () => {
    const user = userEvent.setup()
    render(<ClientList />)
    
    // Add search text
    const searchInput = screen.getByPlaceholderText('Search clients by name, email, or phone...')
    await user.type(searchInput, 'John')
    
    // Open filters and select a type
    const filterButton = screen.getByText('Filters')
    await user.click(filterButton)
    
    const leadCheckbox = screen.getByLabelText('Lead')
    await user.click(leadCheckbox)
    
    // Should show filter count
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // 1 search + 1 type filter
    })
  })
})