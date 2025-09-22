import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../Sidebar';

// Mock the usePathname hook
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('renders the sidebar with logo and navigation items', () => {
    render(<Sidebar />);
    
    // Check if logo is present
    expect(screen.getByAltText('Luma')).toBeInTheDocument();
    
    // Check if navigation items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('shows trial notice when sidebar is expanded', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('7 days left in trial')).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('highlights the active navigation item', () => {
    mockUsePathname.mockReturnValue('/clients');
    render(<Sidebar />);
    
    const clientsLink = screen.getByText('Clients').closest('a');
    expect(clientsLink).toHaveClass('text-blue-600', 'bg-blue-50');
  });

  it('toggles sidebar collapse state when toggle button is clicked', () => {
    const { container } = render(<Sidebar />);
    
    // Find the toggle button specifically (not the upgrade button)
    const toggleButton = screen.getAllByRole('button')[0]; // First button is the toggle
    
    // Initially expanded - should show full logo and text
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('w-64');
    
    // Click to collapse
    fireEvent.click(toggleButton);
    
    // After collapse, sidebar should be narrower
    expect(container.firstChild).toHaveClass('w-16');
    // Navigation should still be present
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('applies custom className when provided', () => {
    const { container } = render(<Sidebar className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders navigation links with correct hrefs', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Clients').closest('a')).toHaveAttribute('href', '/clients');
    expect(screen.getByText('Calendar').closest('a')).toHaveAttribute('href', '/calendar');
    expect(screen.getByText('Finance').closest('a')).toHaveAttribute('href', '/finance');
  });

  it('renders with proper accessibility attributes', () => {
    render(<Sidebar />);
    
    const navigationLinks = screen.getAllByRole('link');
    expect(navigationLinks).toHaveLength(4);
    
    navigationLinks.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });
});