import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MainContent, { Card, Grid, Section } from '../MainContent';

describe('MainContent', () => {
  it('renders children correctly', () => {
    render(
      <MainContent>
        <div>Test Content</div>
      </MainContent>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct margin classes based on sidebar state', () => {
    const { container, rerender } = render(
      <MainContent sidebarCollapsed={false}>
        <div>Content</div>
      </MainContent>
    );
    
    expect(container.firstChild).toHaveClass('lg:ml-64');
    
    rerender(
      <MainContent sidebarCollapsed={true}>
        <div>Content</div>
      </MainContent>
    );
    
    expect(container.firstChild).toHaveClass('lg:ml-16');
  });

  it('renders footer with correct links', () => {
    render(
      <MainContent>
        <div>Content</div>
      </MainContent>
    );
    
    expect(screen.getByText('©2025 Luma - All rights reserved')).toBeInTheDocument();
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <MainContent className="custom-class">
        <div>Content</div>
      </MainContent>
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('Card', () => {
  it('renders children with default styling', () => {
    render(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    
    const card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('bg-white', 'rounded-xl', 'border', 'border-gray-200');
  });

  it('applies different padding sizes', () => {
    const { container, rerender } = render(
      <Card padding="sm">
        <div>Content</div>
      </Card>
    );
    
    expect(container.firstChild).toHaveClass('p-4');
    
    rerender(
      <Card padding="lg">
        <div>Content</div>
      </Card>
    );
    
    expect(container.firstChild).toHaveClass('p-6', 'lg:p-8');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-card">
        <div>Content</div>
      </Card>
    );
    
    expect(container.firstChild).toHaveClass('custom-card');
  });
});

describe('Grid', () => {
  it('renders children with default grid layout', () => {
    render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    );
    
    const grid = screen.getByText('Item 1').parentElement;
    expect(grid).toHaveClass('grid', 'grid-cols-1');
  });

  it('applies different column configurations', () => {
    const { container, rerender } = render(
      <Grid cols={2}>
        <div>Item</div>
      </Grid>
    );
    
    expect(container.firstChild).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    
    rerender(
      <Grid cols={4}>
        <div>Item</div>
      </Grid>
    );
    
    expect(container.firstChild).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
  });

  it('applies different gap sizes', () => {
    const { container, rerender } = render(
      <Grid gap="sm">
        <div>Item</div>
      </Grid>
    );
    
    expect(container.firstChild).toHaveClass('gap-4');
    
    rerender(
      <Grid gap="lg">
        <div>Item</div>
      </Grid>
    );
    
    expect(container.firstChild).toHaveClass('gap-6', 'lg:gap-8');
  });
});

describe('Section', () => {
  it('renders children without header when no title provided', () => {
    render(
      <Section>
        <div>Section Content</div>
      </Section>
    );
    
    expect(screen.getByText('Section Content')).toBeInTheDocument();
  });

  it('renders title and description when provided', () => {
    render(
      <Section title="Test Section" description="Test description">
        <div>Content</div>
      </Section>
    );
    
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders header action when provided', () => {
    render(
      <Section 
        title="Test Section" 
        headerAction={<button>Action Button</button>}
      >
        <div>Content</div>
      </Section>
    );
    
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Section className="custom-section">
        <div>Content</div>
      </Section>
    );
    
    expect(container.firstChild).toHaveClass('custom-section');
  });
});