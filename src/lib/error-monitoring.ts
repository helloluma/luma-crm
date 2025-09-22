/**
 * Error monitoring and logging utilities
 */

export interface ErrorContext {
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  sessionId?: string;
  buildVersion?: string;
  environment?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'api' | 'database' | 'network' | 'validation' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  fingerprint: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errorQueue: ErrorReport[] = [];
  private isOnline = true;
  private maxQueueSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkMonitoring();
    this.startPeriodicFlush();
  }

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'javascript',
        severity: 'high',
        context: {
          url: event.filename,
          additionalData: {
            lineno: event.lineno,
            colno: event.colno
          }
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        type: 'javascript',
        severity: 'high',
        context: {
          additionalData: {
            reason: event.reason,
            promise: event.promise
          }
        }
      });
    });

    // Handle React error boundaries (if using React)
    if (typeof window !== 'undefined' && (window as any).React) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        if (args[0] && args[0].includes && args[0].includes('React')) {
          this.captureError(new Error(args.join(' ')), {
            type: 'javascript',
            severity: 'medium',
            context: {
              additionalData: { reactError: true }
            }
          });
        }
        originalConsoleError.apply(console, args);
      };
    }
  }

  /**
   * Set up network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrors(); // Flush queued errors when back online
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Start periodic error flushing
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushErrors();
    }, this.flushInterval);
  }

  /**
   * Capture an error
   */
  captureError(
    error: Error,
    options: {
      type?: ErrorReport['type'];
      severity?: ErrorReport['severity'];
      context?: Partial<ErrorContext>;
      tags?: Record<string, string>;
    } = {}
  ): string {
    const {
      type = 'javascript',
      severity = 'medium',
      context = {},
      tags = {}
    } = options;

    const errorId = this.generateErrorId();
    const fingerprint = this.generateFingerprint(error, type);
    const timestamp = new Date().toISOString();

    // Check if this error already exists in queue
    const existingError = this.errorQueue.find(e => e.fingerprint === fingerprint);
    
    if (existingError) {
      existingError.count++;
      existingError.lastSeen = timestamp;
      return existingError.id;
    }

    const errorReport: ErrorReport = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      type,
      severity,
      context: {
        userId: this.getCurrentUserId(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp,
        sessionId: this.getSessionId(),
        buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
        environment: process.env.NODE_ENV || 'unknown',
        ...context
      },
      fingerprint,
      count: 1,
      firstSeen: timestamp,
      lastSeen: timestamp
    };

    this.errorQueue.push(errorReport);

    // Limit queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Flush immediately for critical errors
    if (severity === 'critical') {
      this.flushErrors();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorReport);
    }

    return errorId;
  }

  /**
   * Capture API error
   */
  captureAPIError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    responseData?: any
  ): string {
    return this.captureError(error, {
      type: 'api',
      severity: statusCode && statusCode >= 500 ? 'high' : 'medium',
      context: {
        additionalData: {
          endpoint,
          method,
          statusCode,
          responseData: responseData ? JSON.stringify(responseData).substring(0, 1000) : undefined
        }
      }
    });
  }

  /**
   * Capture database error
   */
  captureDatabaseError(
    error: Error,
    query?: string,
    table?: string,
    operation?: string
  ): string {
    return this.captureError(error, {
      type: 'database',
      severity: 'high',
      context: {
        additionalData: {
          query: query ? query.substring(0, 500) : undefined,
          table,
          operation
        }
      }
    });
  }

  /**
   * Capture validation error
   */
  captureValidationError(
    error: Error,
    field?: string,
    value?: any,
    rule?: string
  ): string {
    return this.captureError(error, {
      type: 'validation',
      severity: 'low',
      context: {
        additionalData: {
          field,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          rule
        }
      }
    });
  }

  /**
   * Capture security error
   */
  captureSecurityError(
    error: Error,
    securityEvent: string,
    ipAddress?: string,
    userAgent?: string
  ): string {
    return this.captureError(error, {
      type: 'security',
      severity: 'critical',
      context: {
        additionalData: {
          securityEvent,
          ipAddress,
          userAgent
        }
      }
    });
  }

  /**
   * Flush errors to monitoring service
   */
  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0 || !this.isOnline) {
      return;
    }

    const errorsToFlush = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In a real implementation, this would send to a monitoring service
      // For now, we'll log to console and optionally send to an API endpoint
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Flushing errors:', errorsToFlush);
      }

      // Send to monitoring API if configured
      const monitoringEndpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT;
      if (monitoringEndpoint) {
        await fetch(monitoringEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            errors: errorsToFlush,
            timestamp: new Date().toISOString()
          })
        });
      }

      // Store in local storage as backup
      if (typeof window !== 'undefined') {
        const existingErrors = this.getStoredErrors();
        const allErrors = [...existingErrors, ...errorsToFlush];
        
        // Keep only last 50 errors in storage
        const recentErrors = allErrors.slice(-50);
        localStorage.setItem('error_reports', JSON.stringify(recentErrors));
      }

    } catch (flushError) {
      // If flushing fails, put errors back in queue
      this.errorQueue.unshift(...errorsToFlush);
      console.error('Failed to flush errors:', flushError);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error fingerprint for deduplication
   */
  private generateFingerprint(error: Error, type: string): string {
    const message = error.message || 'Unknown error';
    const stack = error.stack || '';
    
    // Extract the first few lines of stack trace for fingerprinting
    const stackLines = stack.split('\n').slice(0, 3).join('\n');
    
    const fingerprint = `${type}:${message}:${stackLines}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get current user ID from session/auth
   */
  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    // Try to get from various sources
    try {
      // From localStorage (if stored by auth system)
      const authData = localStorage.getItem('auth_user');
      if (authData) {
        const user = JSON.parse(authData);
        return user.id || user.user_id;
      }
      
      // From sessionStorage
      const sessionData = sessionStorage.getItem('user_id');
      if (sessionData) {
        return sessionData;
      }
      
      // From cookies (basic extraction)
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'user_id') {
          return value;
        }
      }
    } catch (error) {
      // Ignore errors in user ID extraction
    }
    
    return undefined;
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Get stored errors from localStorage
   */
  private getStoredErrors(): ErrorReport[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('error_reports');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    queueSize: number;
    totalStored: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
  } {
    const stored = this.getStoredErrors();
    const allErrors = [...this.errorQueue, ...stored];
    
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    allErrors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + error.count;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + error.count;
    });
    
    return {
      queueSize: this.errorQueue.length,
      totalStored: stored.length,
      errorsByType,
      errorsBySeverity
    };
  }

  /**
   * Clear all stored errors
   */
  clearErrors(): void {
    this.errorQueue = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error_reports');
    }
  }

  /**
   * Destroy the error monitor
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}

// Logger utility
export class Logger {
  private static context: Record<string, any> = {};

  static setContext(key: string, value: any): void {
    this.context[key] = value;
  }

  static clearContext(): void {
    this.context = {};
  }

  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data, this.context);
    }
  }

  static info(message: string, data?: any): void {
    console.info(`[INFO] ${message}`, data, this.context);
  }

  static warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data, this.context);
  }

  static error(message: string, error?: Error, data?: any): void {
    console.error(`[ERROR] ${message}`, error, data, this.context);
    
    if (error) {
      ErrorMonitor.getInstance().captureError(error, {
        context: {
          additionalData: {
            logMessage: message,
            logData: data,
            logContext: this.context
          }
        }
      });
    }
  }
}

// Initialize error monitoring
export const errorMonitor = ErrorMonitor.getInstance();

// Export convenience functions
export const captureError = (error: Error, options?: Parameters<typeof errorMonitor.captureError>[1]) => 
  errorMonitor.captureError(error, options);

export const captureAPIError = (error: Error, endpoint: string, method: string, statusCode?: number, responseData?: any) =>
  errorMonitor.captureAPIError(error, endpoint, method, statusCode, responseData);

export const captureDatabaseError = (error: Error, query?: string, table?: string, operation?: string) =>
  errorMonitor.captureDatabaseError(error, query, table, operation);

export const captureValidationError = (error: Error, field?: string, value?: any, rule?: string) =>
  errorMonitor.captureValidationError(error, field, value, rule);

export const captureSecurityError = (error: Error, securityEvent: string, ipAddress?: string, userAgent?: string) =>
  errorMonitor.captureSecurityError(error, securityEvent, ipAddress, userAgent);