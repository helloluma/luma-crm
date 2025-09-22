import { vi } from 'vitest';

// Mock Resend email service
export const mockResend = {
  emails: {
    send: vi.fn(),
  },
};

// Mock AWS SNS service
export const mockSNSClient = {
  send: vi.fn(),
};

export const mockPublishCommand = vi.fn();

// Mock Google Calendar API
export const mockGoogleAuth = {
  setCredentials: vi.fn(),
  getAccessToken: vi.fn(),
};

export const mockGoogleCalendar = {
  events: {
    list: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  calendars: {
    get: vi.fn(),
  },
};

// Mock Chart.js
export const mockChart = {
  register: vi.fn(),
  defaults: {
    responsive: true,
    maintainAspectRatio: false,
  },
};

// Mock SWR
export const mockSWR = {
  default: vi.fn(),
  mutate: vi.fn(),
  useSWRConfig: vi.fn(() => ({
    mutate: vi.fn(),
    cache: new Map(),
  })),
};

// Mock React Hook Form
export const mockUseForm = vi.fn(() => ({
  register: vi.fn(),
  handleSubmit: vi.fn((fn) => fn),
  formState: {
    errors: {},
    isSubmitting: false,
    isValid: true,
  },
  reset: vi.fn(),
  setValue: vi.fn(),
  getValues: vi.fn(),
  watch: vi.fn(),
  control: {},
}));

// Mock React Dropzone
export const mockUseDropzone = vi.fn(() => ({
  getRootProps: vi.fn(() => ({})),
  getInputProps: vi.fn(() => ({})),
  isDragActive: false,
  acceptedFiles: [],
  rejectedFiles: [],
}));

// Mock date-fns
export const mockDateFns = {
  format: vi.fn((date, formatStr) => '2023-01-01'),
  parseISO: vi.fn((dateStr) => new Date(dateStr)),
  isAfter: vi.fn(() => false),
  isBefore: vi.fn(() => true),
  addDays: vi.fn((date, days) => new Date()),
  subDays: vi.fn((date, days) => new Date()),
  startOfDay: vi.fn((date) => new Date()),
  endOfDay: vi.fn((date) => new Date()),
  differenceInDays: vi.fn(() => 1),
};

// Reset all external service mocks
export const resetExternalServiceMocks = () => {
  mockResend.emails.send.mockReset();
  mockSNSClient.send.mockReset();
  mockPublishCommand.mockReset();
  mockGoogleAuth.setCredentials.mockReset();
  mockGoogleAuth.getAccessToken.mockReset();
  Object.values(mockGoogleCalendar.events).forEach((fn: any) => fn.mockReset());
  mockGoogleCalendar.calendars.get.mockReset();
  mockSWR.default.mockReset();
  mockSWR.mutate.mockReset();
  mockUseForm.mockReset();
  mockUseDropzone.mockReset();
  Object.values(mockDateFns).forEach((fn: any) => fn.mockReset());
};

// Helper functions for common mock scenarios
export const mockSuccessfulEmailSend = () => {
  mockResend.emails.send.mockResolvedValue({
    id: 'email-123',
    from: 'noreply@example.com',
    to: ['user@example.com'],
    subject: 'Test Email',
  });
};

export const mockFailedEmailSend = (error: string) => {
  mockResend.emails.send.mockRejectedValue(new Error(error));
};

export const mockSuccessfulSMSSend = () => {
  mockSNSClient.send.mockResolvedValue({
    MessageId: 'sms-123',
    $metadata: {
      httpStatusCode: 200,
    },
  });
};

export const mockFailedSMSSend = (error: string) => {
  mockSNSClient.send.mockRejectedValue(new Error(error));
};

export const mockGoogleCalendarEvents = (events: any[]) => {
  mockGoogleCalendar.events.list.mockResolvedValue({
    data: {
      items: events,
    },
  });
};

export const mockSWRData = (data: any, error: any = null) => {
  mockSWR.default.mockReturnValue({
    data,
    error,
    isLoading: false,
    isValidating: false,
    mutate: vi.fn(),
  });
};

export const mockSWRLoading = () => {
  mockSWR.default.mockReturnValue({
    data: undefined,
    error: null,
    isLoading: true,
    isValidating: true,
    mutate: vi.fn(),
  });
};

export const mockFormWithErrors = (errors: Record<string, any>) => {
  mockUseForm.mockReturnValue({
    register: vi.fn(),
    handleSubmit: vi.fn((fn) => fn),
    formState: {
      errors,
      isSubmitting: false,
      isValid: false,
    },
    reset: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
    watch: vi.fn(),
    control: {},
  });
};

export const mockDropzoneWithFiles = (files: File[]) => {
  mockUseDropzone.mockReturnValue({
    getRootProps: vi.fn(() => ({})),
    getInputProps: vi.fn(() => ({})),
    isDragActive: false,
    acceptedFiles: files,
    rejectedFiles: [],
  });
};