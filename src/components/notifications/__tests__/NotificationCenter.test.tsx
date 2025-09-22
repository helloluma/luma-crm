import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { NotificationCenter } from '../NotificationCenter'
import { useNotifications } from '@/hooks/useNotifications'

// Mock the useNotifications hook
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
  useUnreadNotificationsCount: vi.fn(),
}))

const mockUseNotifications = useNotifications as ReturnType<typeof vi.fn>

const mockNotifications = [
  {
    id: '1',
    title: 'Test Notification 1',
    message: 'This is a test notification',
    type: 'info' as const,
    read: false,
    user_id: 'user-1',
    action_url: null,
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Test Notification 2',
    message: 'This is another test notification',
    type: 'warning' as const,
    read: true,
    user_id: 'user-1',
    action_url: '/clients/123',
    created_at: '2024-01-01T09:00:00Z',
  },
]

const defaultMockReturn = {
  notifications: mockNotifications,
  count: 2,
  totalPages: 1,
  currentPage: 1,
  isLoading: false,
  error: null,
  setPage: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  createNotification: vi.fn(),
  refresh: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseNotifications.mockReturnValue(defaultMockReturn)
})

describe('NotificationCenter', () => {
  it('should not render when closed', () => {
    render(<NotificationCenter isOpen={false} onClose={vi.fn()} />)
    
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
  })

  it('should render when open', () => {
    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Test Notification 1')).toBeInTheDocument()
    expect(screen.getByText('Test Notification 2')).toBeInTheDocument()
  })

  it('should display notification count', () => {
    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<NotificationCenter isOpen={true} onClose={onClose} />)
    
    const backdrop = document.querySelector('.bg-black.bg-opacity-50')
    fireEvent.click(backdrop!)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onClose when X button is clicked', () => {
    const onClose = vi.fn()
    render(<NotificationCenter isOpen={true} onClose={onClose} />)
    
    const closeButton = screen.getByLabelText('Close notifications')
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('should call markAllAsRead when mark all read button is clicked', async () => {
    const markAllAsRead = vi.fn()
    mockUseNotifications.mockReturnValue({
      ...defaultMockReturn,
      markAllAsRead,
    })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    const markAllButton = screen.getByText('Mark all read')
    fireEvent.click(markAllButton)
    
    await waitFor(() => {
      expect(markAllAsRead).toHaveBeenCalled()
    })
  })

  it('should toggle filters when filter button is clicked', () => {
    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    const filterButton = screen.getByText('Filter')
    fireEvent.click(filterButton)
    
    expect(screen.getByText('Type')).toBeInTheDocument()
  })

  it('should toggle unread only filter', () => {
    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    const unreadButton = screen.getByText('Unread only')
    fireEvent.click(unreadButton)
    
    expect(unreadButton).toHaveClass('bg-blue-100')
  })

  it('should show loading state', () => {
    mockUseNotifications.mockReturnValue({
      ...defaultMockReturn,
      notifications: [],
      isLoading: true,
    })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument()
  })

  it('should show error state', () => {
    mockUseNotifications.mockReturnValue({
      ...defaultMockReturn,
      notifications: [],
      error: new Error('Failed to load'),
    })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Failed to load notifications')).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('should show empty state', () => {
    mockUseNotifications.mockReturnValue({
      ...defaultMockReturn,
      notifications: [],
      count: 0,
    })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('No notifications')).toBeInTheDocument()
  })

  it('should show empty unread state when filtering unread only', () => {
    mockUseNotifications.mockReturnValue({
      ...defaultMockReturn,
      notifications: [],
      count: 0,
    })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    // Click unread only filter
    const unreadButton = screen.getByText('Unread only')
    fireEvent.click(unreadButton)
    
    expect(screen.getByText('No unread notifications')).toBeInTheDocument()
  })

  it('should show load more button when there are more pages', () => {
    mockUseNotifications.mockReturnValue({
      ...defaultMockReturn,
      totalPages: 2,
      currentPage: 1,
    })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Load more')).toBeInTheDocument()
  })

  it('should call setPage when load more is clicked', () => {
    const setPage = vi.fn()
    mockUseNotifications.mockReturnValue({
      ...defaultMockReturn,
      totalPages: 2,
      currentPage: 1,
      setPage,
    })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    
    const loadMoreButton = screen.getByText('Load more')
    fireEvent.click(loadMoreButton)
    
    expect(setPage).toHaveBeenCalledWith(2)
  })
})