import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ErrorMonitor, Logger } from '../error-monitoring';

// Mock global objects
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn()
};

const mockNavigator = {
  onLine: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const mockWindow = {
  addEventListener: vi.fn(),
  location: { href: 'https://example.com/test' }
};

const mockDocument = {
  cookie: 'user_id=test-user-123'
};

// Setup global mocks
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage });
Object.defineProperty(global, 'navigator', { value: mockNavigator });
Object.defineProperty(global, 'window', { value: mockWindow });
Object.defineProperty(global, 'document', { value: mockDocument });

// Mock fetch
global.fetch = vi.fn();

describe('ErrorMonitor', () => {
  let errorMonitor: ErrorMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
    
    // Create a fresh instance for each test
    (ErrorMonitor as any).instance = undefined;
    errorMonitor = ErrorMonitor.getInstance();
  });

  afterEach(() => {
    errorMonitor.destroy();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ErrorMonitor.getInstance();
      const instance2 = ErrorMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('captureError', () => {
    it('should capture basic error', () => {
      const error = new Error('Test error');
      const errorId = errorMonitor.captureError(error);
      
      expect(errorId).toBeDefined();
      expect(errorId).toMatch(/^error_\d+_[a-z0-9]+$/);
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should capture error with context', () => {
      const error = new Error('Test error with context');
      const errorId = errorMonitor.captureError(error, {
        type: 'api',
        severity: 'high',
        context: {
          additionalData: { endpoint: '/api/test' }
        }
      });
      
      expect(errorId).toBeDefined();
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.errorsByType.api).toBe(1);
      expect(stats.errorsBySeverity.high).toBe(1);
    });

    it('should deduplicate similar errors', () => {
      const error1 = new Error('Duplicate error');
      const error2 = new Error('Duplicate error');
      
      // Set the same stack trace to ensure fingerprints match
      const stack = 'Error: Duplicate error\n    at test (test.js:1:1)';
      error1.stack = stack;
      error2.stack = stack;
      
      const errorId1 = errorMonitor.captureError(error1);
      const errorId2 = errorMonitor.captureError(error2);
      
      expect(errorId1).toBe(errorId2);
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should handle different error types', () => {
      const jsError = new Error('JavaScript error');
      const apiError = new Error('API error');
      const dbError = new Error('Database error');
      
      errorMonitor.captureError(jsError, { type: 'javascript' });
      errorMonitor.captureError(apiError, { type: 'api' });
      errorMonitor.captureError(dbError, { type: 'database' });
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.errorsByType.javascript).toBe(1);
      expect(stats.errorsByType.api).toBe(1);
      expect(stats.errorsByType.database).toBe(1);
    });
  });

  describe('captureAPIError', () => {
    it('should capture API error with context', () => {
      const error = new Error('API request failed');
      const errorId = errorMonitor.captureAPIError(
        error,
        '/api/users',
        'GET',
        500,
        { message: 'Internal server error' }
      );
      
      expect(errorId).toBeDefined();
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.errorsByType.api).toBe(1);
      expect(stats.errorsBySeverity.high).toBe(1); // 500 status code = high severity
    });

    it('should set medium severity for 4xx errors', () => {
      const error = new Error('Not found');
      errorMonitor.captureAPIError(error, '/api/users/999', 'GET', 404);
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.errorsBySeverity.medium).toBe(1);
    });
  });

  describe('captureDatabaseError', () => {
    it('should capture database error with query context', () => {
      const error = new Error('Query failed');
      const errorId = errorMonitor.captureDatabaseError(
        error,
        'SELECT * FROM users WHERE id = ?',
        'users',
        'select'
      );
      
      expect(errorId).toBeDefined();
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.errorsByType.database).toBe(1);
      expect(stats.errorsBySeverity.high).toBe(1);
    });
  });

  describe('captureValidationError', () => {
    it('should capture validation error', () => {
      const error = new Error('Invalid email format');
      const errorId = errorMonitor.captureValidationError(
        error,
        'email',
        'invalid-email',
        'email_format'
      );
      
      expect(errorId).toBeDefined();
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.errorsByType.validation).toBe(1);
      expect(stats.errorsBySeverity.low).toBe(1);
    });
  });

  describe('captureSecurityError', () => {
    it('should capture security error with critical severity', () => {
      const error = new Error('Unauthorized access attempt');
      const errorId = errorMonitor.captureSecurityError(
        error,
        'unauthorized_access',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      
      expect(errorId).toBeDefined();
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.errorsByType.security).toBe(1);
      expect(stats.errorsBySeverity.critical).toBe(1);
    });
  });

  describe('getErrorStats', () => {
    it('should return correct statistics', () => {
      errorMonitor.captureError(new Error('Error 1'), { type: 'javascript', severity: 'high' });
      errorMonitor.captureError(new Error('Error 2'), { type: 'api', severity: 'medium' });
      errorMonitor.captureError(new Error('Error 3'), { type: 'javascript', severity: 'low' });
      
      const stats = errorMonitor.getErrorStats();
      
      expect(stats.queueSize).toBe(3);
      expect(stats.errorsByType.javascript).toBe(2);
      expect(stats.errorsByType.api).toBe(1);
      expect(stats.errorsBySeverity.high).toBe(1);
      expect(stats.errorsBySeverity.medium).toBe(1);
      expect(stats.errorsBySeverity.low).toBe(1);
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      errorMonitor.captureError(new Error('Error 1'));
      errorMonitor.captureError(new Error('Error 2'));
      
      expect(errorMonitor.getErrorStats().queueSize).toBe(2);
      
      errorMonitor.clearErrors();
      
      expect(errorMonitor.getErrorStats().queueSize).toBe(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('error_reports');
    });
  });
});

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
    
    Logger.clearContext();
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('setContext', () => {
    it('should set logging context', () => {
      Logger.setContext('userId', 'test-user');
      Logger.setContext('sessionId', 'test-session');
      
      Logger.info('Test message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[INFO] Test message',
        undefined,
        { userId: 'test-user', sessionId: 'test-session' }
      );
    });
  });

  describe('clearContext', () => {
    it('should clear logging context', () => {
      Logger.setContext('userId', 'test-user');
      Logger.clearContext();
      
      Logger.info('Test message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[INFO] Test message',
        undefined,
        {}
      );
    });
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      Logger.debug('Debug message', { data: 'test' });
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[DEBUG] Debug message',
        { data: 'test' },
        {}
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      Logger.debug('Debug message');
      
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      Logger.info('Info message', { data: 'test' });
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[INFO] Info message',
        { data: 'test' },
        {}
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      Logger.warn('Warning message', { data: 'test' });
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[WARN] Warning message',
        { data: 'test' },
        {}
      );
    });
  });

  describe('error', () => {
    it('should log error messages and capture errors', () => {
      const error = new Error('Test error');
      
      Logger.error('Error occurred', error, { data: 'test' });
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR] Error occurred',
        error,
        { data: 'test' },
        {}
      );
    });

    it('should work without error object', () => {
      Logger.error('Error message without error object');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR] Error message without error object',
        undefined,
        undefined,
        {}
      );
    });
  });
});