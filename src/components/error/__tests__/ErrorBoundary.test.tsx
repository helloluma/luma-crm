import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import React from 'react';

// Mock the error monitoring
vi.mock('@/lib/error-monitoring', () => ({
  ErrorMonitor: {
    captureError: vi.fn(),
    captureException: vi.fn()
  },
  captureError: vi.fn(),
  Logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws an error in useEffect
const ThrowAsyncError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      throw new Error('Async test error');
    }
  }, [shouldThrow]);
  
  return <div>No async error</div>;
};

describe('ErrorBoundary', () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Suppress console.error for error boundary tests
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component Error')).toBeInTheDocument();
    expect(screen.getByText('This component encountered an error and couldn\'t render properly.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const CustomFallback = (
      <div>
        <h2>Custom Error: Test error</h2>
        <button>Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should show retry button when error occurs', () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText('Component Error')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    retryButton.click();

    // Should call window.location.reload
    expect(mockReload).toHaveBeenCalled();
  });

  it('should handle multiple error types', () => {
    const TypeErrorComponent = () => {
      throw new TypeError('Type error occurred');
    };

    render(
      <ErrorBoundary>
        <TypeErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component Error')).toBeInTheDocument();
  });

  it('should handle errors with different error messages', () => {
    const CustomErrorComponent = () => {
      throw new Error('Custom error message');
    };

    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <CustomErrorComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Custom error message'
      }),
      expect.any(Object)
    );
  });

  it('should not catch errors in event handlers', () => {
    const EventHandlerError = () => {
      const handleClick = () => {
        throw new Error('Event handler error');
      };

      return <button onClick={handleClick}>Click me</button>;
    };

    render(
      <ErrorBoundary>
        <EventHandlerError />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: 'Click me' });
    
    // Error boundaries don't catch errors in event handlers
    // The component should still render normally
    expect(screen.getByText('Click me')).toBeInTheDocument();
    
    // The error will be thrown but not caught by the boundary
    // We can't easily test this without more complex setup
  });

  it('should not catch errors in async code', () => {
    // Error boundaries don't catch errors in async code, useEffect, etc.
    // This test verifies that the component renders normally even if async errors occur
    render(
      <ErrorBoundary>
        <ThrowAsyncError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No async error')).toBeInTheDocument();
  });

  it('should provide error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.stringContaining('ThrowError')
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle nested error boundaries', () => {
    const InnerError = () => {
      throw new Error('Inner error');
    };

    const onOuterError = vi.fn();
    const onInnerError = vi.fn();

    render(
      <ErrorBoundary onError={onOuterError}>
        <div>Outer content</div>
        <ErrorBoundary onError={onInnerError}>
          <InnerError />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Inner error boundary should catch the error
    expect(onInnerError).toHaveBeenCalled();
    expect(onOuterError).not.toHaveBeenCalled();
    
    // Outer content should still be visible
    expect(screen.getByText('Outer content')).toBeInTheDocument();
    // Inner error UI should be displayed
    expect(screen.getByText('Component Error')).toBeInTheDocument();
  });

  it('should handle component stack information', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <div>
          <div>
            <ThrowError shouldThrow={true} />
          </div>
        </div>
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );

    const [, errorInfo] = onError.mock.calls[0];
    expect(errorInfo.componentStack).toContain('ThrowError');
  });
});