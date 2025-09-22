import { Logger, captureError } from './error-monitoring';

/**
 * Error recovery mechanisms and fallback strategies
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

/**
 * Retry mechanism with configurable backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    shouldRetry = (error, attempt) => attempt < maxAttempts,
    onRetry
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (!shouldRetry(lastError, attempt)) {
        break;
      }

      if (attempt < maxAttempts) {
        const retryDelay = backoff === 'exponential' 
          ? delay * Math.pow(2, attempt - 1)
          : delay * attempt;
        
        Logger.warn(`Operation failed, retrying in ${retryDelay}ms`, {
          attempt,
          maxAttempts,
          error: lastError.message
        });

        if (onRetry) {
          onRetry(lastError, attempt);
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // All attempts failed
  captureError(lastError!, {
    type: 'network',
    severity: 'medium',
    context: {
      additionalData: {
        maxAttempts,
        finalAttempt: true,
        retryStrategy: 'withRetry'
      }
    }
  });

  throw lastError!;
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private successCount = 0;

  constructor(private options: CircuitBreakerOptions = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000, // 1 minute
      monitoringPeriod = 10000 // 10 seconds
    } = options;

    this.options = { failureThreshold, resetTimeout, monitoringPeriod };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout!) {
        this.state = 'half-open';
        this.successCount = 0;
        Logger.info('Circuit breaker transitioning to half-open state');
      } else {
        const error = new Error('Circuit breaker is open');
        captureError(error, {
          type: 'network',
          severity: 'medium',
          context: {
            additionalData: {
              circuitBreakerState: this.state,
              failures: this.failures
            }
          }
        });
        throw error;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = 'closed';
        Logger.info('Circuit breaker closed after successful recovery');
      }
    }
  }

  private onFailure(error: Error): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold!) {
      this.state = 'open';
      Logger.warn('Circuit breaker opened due to failures', {
        failures: this.failures,
        threshold: this.options.failureThreshold
      });
    }

    captureError(error, {
      type: 'network',
      severity: 'medium',
      context: {
        additionalData: {
          circuitBreakerState: this.state,
          failures: this.failures,
          threshold: this.options.failureThreshold
        }
      }
    });
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
    this.successCount = 0;
    Logger.info('Circuit breaker manually reset');
  }
}

/**
 * Fallback mechanism for failed operations
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T> | T,
  options: {
    shouldFallback?: (error: Error) => boolean;
    onFallback?: (error: Error) => void;
  } = {}
): Promise<T> {
  const { shouldFallback = () => true, onFallback } = options;

  try {
    return await primary();
  } catch (error) {
    const err = error as Error;
    
    if (shouldFallback(err)) {
      Logger.warn('Primary operation failed, using fallback', {
        error: err.message
      });

      if (onFallback) {
        onFallback(err);
      }

      captureError(err, {
        type: 'network',
        severity: 'low',
        context: {
          additionalData: {
            fallbackUsed: true,
            strategy: 'withFallback'
          }
        }
      });

      return await fallback();
    }

    throw error;
  }
}

/**
 * Timeout wrapper for operations
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        const error = new Error(timeoutMessage);
        captureError(error, {
          type: 'network',
          severity: 'medium',
          context: {
            additionalData: {
              timeoutMs,
              strategy: 'withTimeout'
            }
          }
        });
        reject(error);
      }, timeoutMs);
    })
  ]);
}

/**
 * Graceful degradation for API calls
 */
export class GracefulDegradation {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async withGracefulDegradation<T>(
    operation: () => Promise<T>,
    cacheKey: string,
    fallbackData?: T,
    options: {
      useStaleData?: boolean;
      maxStaleAge?: number;
    } = {}
  ): Promise<T> {
    const { useStaleData = true, maxStaleAge = 30 * 60 * 1000 } = options; // 30 minutes

    try {
      const result = await operation();
      
      // Cache successful result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      Logger.warn('Operation failed, attempting graceful degradation', {
        cacheKey,
        error: (error as Error).message
      });

      // Try to use cached data
      if (useStaleData) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          const age = Date.now() - cached.timestamp;
          if (age <= maxStaleAge) {
            Logger.info('Using stale cached data for graceful degradation', {
              cacheKey,
              age: Math.round(age / 1000) + 's'
            });
            
            captureError(error as Error, {
              type: 'network',
              severity: 'low',
              context: {
                additionalData: {
                  gracefulDegradation: true,
                  usedStaleData: true,
                  cacheAge: age
                }
              }
            });
            
            return cached.data;
          }
        }
      }

      // Use fallback data if available
      if (fallbackData !== undefined) {
        Logger.info('Using fallback data for graceful degradation', { cacheKey });
        
        captureError(error as Error, {
          type: 'network',
          severity: 'low',
          context: {
            additionalData: {
              gracefulDegradation: true,
              usedFallbackData: true
            }
          }
        });
        
        return fallbackData;
      }

      // No recovery options available
      throw error;
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Error recovery for React components
 */
export function useErrorRecovery() {
  const [error, setError] = React.useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = React.useState(false);

  const recover = React.useCallback(async (recoveryFn?: () => Promise<void>) => {
    if (!error) return;

    setIsRecovering(true);
    
    try {
      if (recoveryFn) {
        await recoveryFn();
      }
      
      setError(null);
      Logger.info('Component recovered from error');
    } catch (recoveryError) {
      Logger.error('Error recovery failed', recoveryError as Error);
      captureError(recoveryError as Error, {
        type: 'javascript',
        severity: 'medium',
        context: {
          additionalData: {
            originalError: error.message,
            recoveryFailed: true
          }
        }
      });
    } finally {
      setIsRecovering(false);
    }
  }, [error]);

  const captureAndSetError = React.useCallback((error: Error) => {
    setError(error);
    captureError(error, {
      type: 'javascript',
      severity: 'medium',
      context: {
        additionalData: {
          componentError: true,
          useErrorRecovery: true
        }
      }
    });
  }, []);

  return {
    error,
    isRecovering,
    recover,
    captureAndSetError,
    hasError: error !== null
  };
}

// Global circuit breakers for common services
export const apiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000
});

export const databaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000
});

// React import for useErrorRecovery hook
import React from 'react';