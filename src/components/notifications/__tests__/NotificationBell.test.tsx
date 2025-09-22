import { render, screen, fireEvent } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { NotificationBell } from '../NotificationBell'
import { useUnreadNotificationsCount } from '@/hooks/useNotifications'

// Mock the useUnreadNotificationsCount hook
vi.mock('@/hooks/useNotifications', () => ({
  useUnreadNotificationsCount: vi.fn(),
  useNotifications: vi.fn(() => ({
    notifications: [],
    count: 0,
    totalPages: 0,
    currentPage: 1,
    isLoading: false,
    error: null,
    setPage: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    createNotification: vi.fn(),
    refresh: vi.fn(),
  })),
}))

const mockUseUnreadNotificationsCount = useUnreadNotificationsCount as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('NotificationBell', () => {
  it('should render bell icon', () => {
    mockUseUnreadNotificationsCount.mockReturnValue({
      count: 0,
      isLoading: false,
      error: null,
    })

    render(<NotificationBell />)
    
    const bellButton = screen.getByRole('button')
    expect(bellButton).toBeInTheDocument()
    
    // Check for bell icon (Lucide React Bell component)
    const bellIcon = bellButton.querySelector('svg')
    expect(bellIcon).toBeInTheDocument()
  })

  it('should not show badge when count is 0', () => {
    mockUseUnreadNotificationsCount.mockReturnValue({
      count: 0,
      isLoading: false,
      error: null,
    })

    render(<NotificationBell />)
    
    const badge = document.querySelector('.bg-red-500')
    expect(badge).not.toBeInTheDocument()
  })

  it('should show badge with count when there are unread notifications', () => {
    mockUseUnreadNotificationsCount.mockReturnValue({
      count: 5,
      isLoading: false,
      error: null,
    })

    render(<NotificationBell />)
    
    const badge = document.querySelector('.bg-red-500')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('5')
  })

  it('should show 99+ when count exceeds 99', () => {
    mockUseUnreadNotificationsCount.mockReturnValue({
      count: 150,
      isLoading: false,
      error: null,
    })

    render(<NotificationBell />)
    
    const badge = document.querySelector('.bg-red-500')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('99+')
  })

  it('should open notification center when bell is clicked', () => {
    mockUseUnreadNotificationsCount.mockReturnValue({
      count: 3,
      isLoading: false,
      error: null,
    })

    render(<NotificationBell />)
    
    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)
    
    // Check if notification center is opened (by looking for the backdrop)
    const backdrop = document.querySelector('.bg-black.bg-opacity-50')
    expect(backdrop).toBeInTheDocument()
  })

  it('should close notification center when backdrop is clicked', () => {
    mockUseUnreadNotificationsCount.mockReturnValue({
      count: 3,
      isLoading: false,
      error: null,
    })

    render(<NotificationBell />)
    
    // Open notification center
    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)
    
    // Click backdrop to close
    const backdrop = document.querySelector('.bg-black.bg-opacity-50')
    fireEvent.click(backdrop!)
    
    // Check if notification center is closed
    expect(document.querySelector('.bg-black.bg-opacity-50')).not.toBeInTheDocument()
  })

  it('should handle loading state', () => {
    mockUseUnreadNotificationsCount.mockReturnValue({
      count: 0,
      isLoading: true,
      error: null,
    })

    render(<NotificationBell />)
    
    // Should still render the bell, just without count
    const bellButton = screen.getByRole('button')
    expect(bellButton).toBeInTheDocument()
    
    const badge = document.querySelector('.bg-red-500')
    expect(badge).not.toBeInTheDocument()
  })

  it('should handle error state', () => {
    mockUseUnreadNotificationsCount.mockReturnValue({
      count: 0,
      isLoading: false,
      error: new Error('Failed to load'),
    })

    render(<NotificationBell />)
    
    // Should still render the bell, just without count
    const bellButton = screen.getByRole('button')
    expect(bellButton).toBeInTheDocument()
    
    const badge = document.querySelector('.bg-red-500')
    expect(badge).not.toBeInTheDocument()
  })

  it('should apply hover styles', () => {
    mockUseUnreadNotificationsCount.mockReturnValue({
      count: 0,
      isLoading: false,
      error: null,
    })

    render(<NotificationBell />)
    
    const bellButton = screen.getByRole('button')
    expect(bellButton).toHaveClass('hover:bg-gray-100')
    expect(bellButton).toHaveClass('hover:text-gray-900')
  })
})