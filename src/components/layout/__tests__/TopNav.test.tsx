import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TopNav from '../TopNav';

describe('TopNav', () => {
  const defaultProps = {
    title: 'Test Dashboard',
  };

  it('renders the title correctly', () => {
    render(<TopNav {...defaultProps} />);
    
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
  });

  it('renders mobile menu toggle button on mobile', () => {
    render(<TopNav {...defaultProps} />);
    
    const mobileToggle = screen.getByLabelText('Toggle mobile menu');
    expect(mobileToggle).toBeInTheDocument();
    expect(mobileToggle).toHaveClass('lg:hidden');
  });

  it('calls onMobileMenuToggle when mobile menu button is clicked', () => {
    const mockToggle = vi.fn();
    render(<TopNav {...defaultProps} onMobileMenuToggle={mockToggle} />);
    
    const mobileToggle = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(mobileToggle);
    
    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it('renders quick action button', () => {
    render(<TopNav {...defaultProps} />);
    
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
  });

  it('renders notification bell with badge', () => {
    render(<TopNav {...defaultProps} />);
    
    const notificationButton = screen.getByLabelText('Notifications');
    expect(notificationButton).toBeInTheDocument();
    
    // Check for notification badge (red dot)
    const badge = notificationButton.querySelector('.bg-red-500');
    expect(badge).toBeInTheDocument();
  });

  it('renders user profile information', () => {
    render(<TopNav {...defaultProps} />);
    
    expect(screen.getByText('Edward Guillien')).toBeInTheDocument();
    expect(screen.getByText('hello@edwardguillien.com')).toBeInTheDocument();
    expect(screen.getByText('EG')).toBeInTheDocument();
  });

  it('toggles notifications dropdown when notification button is clicked', () => {
    render(<TopNav {...defaultProps} />);
    
    const notificationButton = screen.getByLabelText('Notifications');
    
    // Initially dropdown should not be visible
    expect(screen.queryByText('New client inquiry')).not.toBeInTheDocument();
    
    // Click to open dropdown
    fireEvent.click(notificationButton);
    
    // Dropdown should now be visible
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('New client inquiry')).toBeInTheDocument();
    expect(screen.getByText('Deal closed')).toBeInTheDocument();
  });

  it('toggles user dropdown when user profile is clicked', () => {
    render(<TopNav {...defaultProps} />);
    
    const userButton = screen.getByText('EG').closest('button');
    
    // Initially dropdown should not be visible
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
    
    // Click to open dropdown
    fireEvent.click(userButton!);
    
    // Dropdown should now be visible
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('closes dropdowns when clicking outside', () => {
    render(<TopNav {...defaultProps} />);
    
    const notificationButton = screen.getByLabelText('Notifications');
    
    // Open notifications dropdown
    fireEvent.click(notificationButton);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Click outside (on the overlay)
    const overlay = document.querySelector('.fixed.inset-0.z-40');
    fireEvent.click(overlay!);
    
    // Dropdown should be closed
    expect(screen.queryByText('New client inquiry')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(<TopNav {...defaultProps} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows responsive text for quick action button', () => {
    render(<TopNav {...defaultProps} />);
    
    // Should show full text on larger screens
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    
    // Should also have shortened text for mobile (both are rendered with different visibility classes)
    expect(screen.getByText('Add')).toBeInTheDocument();
  });
});