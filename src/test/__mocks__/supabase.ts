import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
};

// Mock createClient function
export const createClient = vi.fn(() => mockSupabaseClient);

// Mock auth helpers
export const createServerClient = vi.fn(() => mockSupabaseClient);
export const createBrowserClient = vi.fn(() => mockSupabaseClient);

// Reset all mocks
export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient.auth).forEach((fn: any) => {
    if (typeof fn === 'function') fn.mockReset();
  });
  mockSupabaseClient.from.mockReset();
  mockSupabaseClient.storage.from.mockReset();
  mockSupabaseClient.channel.mockReset();
  mockSupabaseClient.removeChannel.mockReset();
  createClient.mockReset();
  createServerClient.mockReset();
  createBrowserClient.mockReset();
};

// Helper to mock successful responses
export const mockSupabaseSuccess = (data: any) => ({
  data,
  error: null,
});

// Helper to mock error responses
export const mockSupabaseError = (message: string) => ({
  data: null,
  error: { message },
});

// Mock common query responses
export const mockQueryBuilder = (data: any, error: any = null) => {
  const builder = mockSupabaseClient.from();
  builder.single.mockResolvedValue({ data, error });
  builder.maybeSingle.mockResolvedValue({ data, error });
  return builder;
};