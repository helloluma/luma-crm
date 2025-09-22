import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Layout from '../Layout';

// Mock the child components
vi.mock('../Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}));

vi.mock('../TopNav', () => ({
  default: ({ title, onMobileMenuToggle }: any) => (
    <div data-testid="topnav">
      <span>{title}</span>
      <button onClick={onMobileMenuToggle} data-testid="mobile-toggle">
        Toggle
      </button>
    </div>
  )
}));

vi.mock('../MainContent', () => ({
  default: ({ children, sidebarCollapsed }: any) => (
    <div data-testid="maincontent" data-sidebar-collapsed={sidebarCollapsed}>
      {children}
    </div>
  )
}));

describe('Layout', () => {
  it('renders all child components', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('topnav')).toBeInTheDocument();
    expect(screen.getByTestId('maincontent')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with default title', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <Layout title="Custom Title">
        <div>Content</div>
      </Layout>
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('handles mobile menu toggle', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const sidebar = screen.getByTestId('sidebar').parentElement;
    const mobileToggle = screen.getByTestId('mobile-toggle');
    
    // Initially mobile menu should be closed (sidebar translated off-screen)
    expect(sidebar).toHaveClass('-translate-x-full');
    
    // Click to open mobile menu
    fireEvent.click(mobileToggle);
    
    // Mobile menu should now be open
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('shows mobile overlay when mobile menu is open', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const mobileToggle = screen.getByTestId('mobile-toggle');
    
    // Initially no overlay
    expect(document.querySelector('.bg-black.bg-opacity-50')).not.toBeInTheDocument();
    
    // Open mobile menu
    fireEvent.click(mobileToggle);
    
    // Overlay should appear
    expect(document.querySelector('.bg-black.bg-opacity-50')).toBeInTheDocument();
  });

  it('closes mobile menu when overlay is clicked', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const sidebar = screen.getByTestId('sidebar').parentElement;
    const mobileToggle = screen.getByTestId('mobile-toggle');
    
    // Open mobile menu
    fireEvent.click(mobileToggle);
    expect(sidebar).toHaveClass('translate-x-0');
    
    // Click overlay to close
    const overlay = document.querySelector('.bg-black.bg-opacity-50');
    fireEvent.click(overlay!);
    
    // Mobile menu should be closed
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('applies responsive classes correctly', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    // Check main content area has responsive margin
    const mainContentArea = container.querySelector('.lg\\:ml-64');
    expect(mainContentArea).toBeInTheDocument();
  });

  it('maintains proper z-index layering', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const mobileToggle = screen.getByTestId('mobile-toggle');
    fireEvent.click(mobileToggle);
    
    // Check that overlay exists with correct z-index class
    const overlay = document.querySelector('.bg-black.bg-opacity-50');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('z-20');
  });
});