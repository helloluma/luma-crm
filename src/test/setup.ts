import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Set up environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.AWS_ACCESS_KEY_ID = 'test-aws-key'
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret'
process.env.AWS_REGION = 'us-east-1'

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ priority, ...props }: any) => {
    // Remove priority prop as it's not a valid HTML attribute
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', props);
  },
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', async () => {
  const { mockSupabaseClient, createClient } = await import('../test/__mocks__/supabase');
  return {
    createClient,
    default: { createClient },
  };
});

// Mock external services
vi.mock('resend', async () => {
  const { mockResend } = await import('../test/__mocks__/external-services');
  return {
    Resend: vi.fn(() => mockResend),
  };
});

vi.mock('@aws-sdk/client-sns', async () => {
  const { mockSNSClient, mockPublishCommand } = await import('../test/__mocks__/external-services');
  return {
    SNSClient: vi.fn(() => mockSNSClient),
    PublishCommand: mockPublishCommand,
  };
});

vi.mock('googleapis', async () => {
  const { mockGoogleAuth, mockGoogleCalendar } = await import('../test/__mocks__/external-services');
  return {
    google: {
      auth: {
        OAuth2: vi.fn(() => mockGoogleAuth),
      },
      calendar: vi.fn(() => mockGoogleCalendar),
    },
  };
});

vi.mock('swr', async () => {
  const { mockSWR } = await import('../test/__mocks__/external-services');
  return mockSWR;
});

vi.mock('react-hook-form', async () => {
  const { mockUseForm } = await import('../test/__mocks__/external-services');
  return {
    useForm: mockUseForm,
    Controller: ({ render }: any) => render({ field: {}, fieldState: {}, formState: {} }),
  };
});

vi.mock('react-dropzone', async () => {
  const { mockUseDropzone } = await import('../test/__mocks__/external-services');
  return {
    useDropzone: mockUseDropzone,
  };
});

vi.mock('date-fns', async () => {
  const { mockDateFns } = await import('../test/__mocks__/external-services');
  return mockDateFns;
});

// Mock Chart.js
vi.mock('chart.js', async () => {
  const { mockChart } = await import('../test/__mocks__/external-services');
  return {
    Chart: mockChart,
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    BarElement: vi.fn(),
    LineElement: vi.fn(),
    PointElement: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
  };
});

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => React.createElement('div', { 'data-testid': 'bar-chart' }, JSON.stringify(data)),
  Line: ({ data, options }: any) => React.createElement('div', { 'data-testid': 'line-chart' }, JSON.stringify(data)),
}));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock File and FileReader for file upload tests
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(bits: any[], name: string, options: any = {}) {
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
} as any;

global.FileReader = class MockFileReader {
  result: any = null;
  error: any = null;
  readyState: number = 0;
  onload: any = null;
  onerror: any = null;

  readAsDataURL(file: any) {
    this.readyState = 2;
    this.result = `data:${file.type};base64,mock-base64-data`;
    if (this.onload) this.onload({ target: this });
  }

  readAsText(file: any) {
    this.readyState = 2;
    this.result = 'mock file content';
    if (this.onload) this.onload({ target: this });
  }
} as any;