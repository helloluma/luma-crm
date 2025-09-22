import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider, useRole } from '../useAuth';
import { sessionManager } from '@/lib/session';
import type { SessionData } from '@/lib/session';
import type { Profile } from '@/lib/auth';

// Mock the session manager
vi.mock('@/lib/session', () => ({
  sessionManager: {
    subscribe: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }
}));

const mockSessionManager = sessionManager as any;

// Test component to use the hook
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{auth.user?.email || 'no-user'}</div>
      <div data-testid="profile">{auth.profile?.name || 'no-profile'}</div>
      <div data-testid="error">{auth.error || 'no-error'}</div>
    </div>
  );
};

const RoleTestComponent = () => {
  const role = useRole();
  return (
    <div>
      <div data-testid="role">{role.role}</div>
      <div data-testid="isAdmin">{role.isAdmin ? 'admin' : 'not-admin'}</div>
      <div data-testid="isSuperAdmin">{role.isSuperAdmin ? 'super-admin' : 'not-super-admin'}</div>
    </div>
  );
};

describe('useAuth hook', () => {
  let mockSubscribe: any;
  let mockUnsubscribe: any;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe);
    mockSessionManager.subscribe = mockSubscribe;
    mockSessionManager.signOut = vi.fn().mockResolvedValue({ error: null });
    mockSessionManager.refreshProfile = vi.fn().mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });

  it('should provide initial loading state', () => {
    const mockSessionData: SessionData = {
      session: null,
      user: null,
      profile: null,
      isLoading: true,
      error: null
    };

    mockSubscribe.mockImplementation((callback: (data: SessionData) => void) => {
      callback(mockSessionData);
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('profile')).toHaveTextContent('no-profile');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should provide authenticated user data', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {}
    };

    const mockProfile: Profile = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'Admin',
      avatar_url: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    const mockSessionData: SessionData = {
      session: { user: mockUser } as any,
      user: mockUser,
      profile: mockProfile,
      isLoading: false,
      error: null
    };

    mockSubscribe.mockImplementation((callback: (data: SessionData) => void) => {
      callback(mockSessionData);
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('profile')).toHaveTextContent('Test User');
    });
  });

  it('should handle error state', async () => {
    const mockSessionData: SessionData = {
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      error: 'Authentication failed'
    };

    mockSubscribe.mockImplementation((callback: (data: SessionData) => void) => {
      callback(mockSessionData);
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
    });
  });

  it('should call signOut correctly', async () => {
    const mockSessionData: SessionData = {
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      error: null
    };

    mockSubscribe.mockImplementation((callback: (data: SessionData) => void) => {
      callback(mockSessionData);
      return mockUnsubscribe;
    });

    const TestSignOutComponent = () => {
      const { signOut } = useAuth();
      return <button onClick={() => signOut()}>Sign Out</button>;
    };

    render(
      <AuthProvider>
        <TestSignOutComponent />
      </AuthProvider>
    );

    const button = screen.getByText('Sign Out');
    button.click();

    await waitFor(() => {
      expect(mockSessionManager.signOut).toHaveBeenCalled();
    });
  });

  it('should unsubscribe on unmount', () => {
    mockSubscribe.mockImplementation((callback: (data: SessionData) => void) => {
      callback({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        error: null
      });
      return mockUnsubscribe;
    });

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

describe('useRole hook', () => {
  let mockSubscribe: any;
  let mockUnsubscribe: any;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe);
    mockSessionManager.subscribe = mockSubscribe;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return Assistant role by default', () => {
    const mockSessionData: SessionData = {
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      error: null
    };

    mockSubscribe.mockImplementation((callback: (data: SessionData) => void) => {
      callback(mockSessionData);
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <RoleTestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('role')).toHaveTextContent('Assistant');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('not-admin');
    expect(screen.getByTestId('isSuperAdmin')).toHaveTextContent('not-super-admin');
  });

  it('should return Admin role permissions', () => {
    const mockProfile: Profile = {
      id: '123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'Admin',
      avatar_url: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    const mockSessionData: SessionData = {
      session: null,
      user: null,
      profile: mockProfile,
      isLoading: false,
      error: null
    };

    mockSubscribe.mockImplementation((callback: (data: SessionData) => void) => {
      callback(mockSessionData);
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <RoleTestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('role')).toHaveTextContent('Admin');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('admin');
    expect(screen.getByTestId('isSuperAdmin')).toHaveTextContent('not-super-admin');
  });

  it('should return SuperAdmin role permissions', () => {
    const mockProfile: Profile = {
      id: '123',
      email: 'superadmin@example.com',
      name: 'Super Admin User',
      role: 'SuperAdmin',
      avatar_url: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    const mockSessionData: SessionData = {
      session: null,
      user: null,
      profile: mockProfile,
      isLoading: false,
      error: null
    };

    mockSubscribe.mockImplementation((callback: (data: SessionData) => void) => {
      callback(mockSessionData);
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <RoleTestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('role')).toHaveTextContent('SuperAdmin');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('admin');
    expect(screen.getByTestId('isSuperAdmin')).toHaveTextContent('super-admin');
  });

  it('should check role permissions correctly', () => {
    const mockProfile: Profile = {
      id: '123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'Admin',
      avatar_url: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    const mockSessionData: SessionData = {
      session: null,
      user: null,
      profile: mockProfile,
      isLoading: false,
      error: null
    };

    mockSubscribe.mockImplementation((callback: (data: SessionData) => void) => {
      callback(mockSessionData);
      return mockUnsubscribe;
    });

    const RolePermissionTestComponent = () => {
      const role = useRole();
      return (
        <div>
          <div data-testid="hasRole">{role.hasRole(['Admin']) ? 'has-admin' : 'no-admin'}</div>
          <div data-testid="hasAnyRole">{role.hasAnyRole(['Admin', 'SuperAdmin']) ? 'has-any' : 'no-any'}</div>
          <div data-testid="canViewAllClients">{role.canViewAllClients ? 'can-view' : 'cannot-view'}</div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <RolePermissionTestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('hasRole')).toHaveTextContent('has-admin');
    expect(screen.getByTestId('hasAnyRole')).toHaveTextContent('has-any');
    expect(screen.getByTestId('canViewAllClients')).toHaveTextContent('can-view');
  });
});