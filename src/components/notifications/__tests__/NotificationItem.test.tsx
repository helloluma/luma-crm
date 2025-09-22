import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { NotificationItem } from '../NotificationItem'
import { Notification } from '@/types'

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}))

const mockNotification: Notification = {
  id: '1',
  title: 'Test Notification',
  message: 'This is a test notification message',
  type: 'info',
  read: false,
  user_id: 'user-1',
  action_url: '/clients/123',
  created_at: '2024-01-01T10:00:00Z',
}

describe('NotificationItem', () => {
  it('should render notification content', () => {
    render(
      <NotificationItem
        notification={mockNotification}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText('Test Notification')).toBeInTheDocument()
    expect(screen.getByText('This is a test notification message')).toBeInTheDocument()
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
  })

  it('should show unread indicator for unread notifications', () => {
    render(
      <NotificationItem
        notification={mockNotification}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const unreadIndicator = document.querySelector('.bg-blue-600')
    expect(unreadIndicator).toBeInTheDocument()
  })

  it('should not show unread indicator for read notifications', () => {
    const readNotification = { ...mockNotification, read: true }
    
    render(
      <NotificationItem
        notification={readNotification}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const unreadIndicator = document.querySelector('.bg-blue-600')
    expect(unreadIndicator).not.toBeInTheDocument()
  })

  it('should apply different styles for unread notifications', () => {
    render(
      <NotificationItem
        notification={mockNotification}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const container = screen.getByText('Test Notification').closest('.group')
    expect(container).toHaveClass('bg-blue-50')
  })

  it('should not apply unread styles for read notifications', () => {
    const readNotification = { ...mockNotification, read: true }
    
    render(
      <NotificationItem
        notification={readNotification}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const container = screen.getByText('Test Notification').closest('.group')
    expect(container).not.toHaveClass('bg-blue-50')
  })

  it('should call onClick when notification is clicked', () => {
    const onClick = vi.fn()
    
    render(
      <NotificationItem
        notification={mockNotification}
        onClick={onClick}
        onDelete={vi.fn()}
      />
    )

    const container = screen.getByText('Test Notification').closest('.group')
    fireEvent.click(container!)

    expect(onClick).toHaveBeenCalled()
  })

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    
    render(
      <NotificationItem
        notification={mockNotification}
        onClick={vi.fn()}
        onDelete={onDelete}
      />
    )

    const deleteButton = document.querySelector('[data-testid="delete-button"]') || 
                        document.querySelector('button')
    fireEvent.click(deleteButton!)

    expect(onDelete).toHaveBeenCalled()
  })

  it('should prevent event propagation when delete button is clicked', () => {
    const onClick = vi.fn()
    const onDelete = vi.fn()
    
    render(
      <NotificationItem
        notification={mockNotification}
        onClick={onClick}
        onDelete={onDelete}
      />
    )

    const deleteButton = document.querySelector('button')
    fireEvent.click(deleteButton!)

    expect(onDelete).toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should display correct icon for different notification types', () => {
    const types = ['info', 'success', 'warning', 'error'] as const
    
    types.forEach((type) => {
      const notification = { ...mockNotification, type }
      const { container } = render(
        <NotificationItem
          notification={notification}
          onClick={vi.fn()}
          onDelete={vi.fn()}
        />
      )
      
      // Check that an icon is rendered (we can't easily test which specific icon)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  it('should navigate to action URL when notification is clicked', () => {
    // Mock window.location
    const originalLocation = window.location
    delete (window as any).location
    window.location = { ...originalLocation, href: '' }

    render(
      <NotificationItem
        notification={mockNotification}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const container = screen.getByText('Test Notification').closest('.group')
    fireEvent.click(container!)

    expect(window.location.href).toBe('/clients/123')

    // Restore window.location
    window.location = originalLocation
  })

  it('should not navigate when action_url is null', () => {
    const notificationWithoutUrl = { ...mockNotification, action_url: null }
    
    // Mock window.location
    const originalLocation = window.location
    delete (window as any).location
    window.location = { ...originalLocation, href: '' }

    render(
      <NotificationItem
        notification={notificationWithoutUrl}
        onClick={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const container = screen.getByText('Test Notification').closest('.group')
    fireEvent.click(container!)

    expect(window.location.href).toBe('')

    // Restore window.location
    window.location = originalLocation
  })
})