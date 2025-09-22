import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  withRetry,
  CircuitBreaker,
  withFallback,
  withTimeout,
  GracefulDegradation
} from '../error-recovery';

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValue('success');
    
    const promise = withRetry(operation, { maxAttempts: 3, delay: 100 });
    
    // Fast-forward through retry delays
    await vi.advanceTimersByTimeAsync(300);
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
    
    const promise = withRetry(operation, { maxAttempts: 2, delay: 100 });
    
    await vi.advanceTimersByTimeAsync(200);
    
    await expect(promise).rejects.toThrow('Always fails');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockRejectedValueOnce(new Error('Attempt 2'))
      .mockResolvedValue('success');
    
    const onRetry = vi.fn();
    const promise = withRetry(operation, {
      maxAttempts: 3,
      delay: 100,
      backoff: 'exponential',
      onRetry
    });
    
    // First retry after 100ms, second after 200ms
    await vi.advanceTimersByTimeAsync(100);
    expect(onRetry).toHaveBeenCalledTimes(1);
    
    await vi.advanceTimersByTimeAsync(200);
    expect(onRetry).toHaveBeenCalledTimes(2);
    
    const result = await promise;
    expect(result).toBe('success');
  });

  it('should use linear backoff', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockRejectedValueOnce(new Error('Attempt 2'))
      .mockResolvedValue('success');
    
    const onRetry = vi.fn();
    const promise = withRetry(operation, {
      maxAttempts: 3,
      delay: 100,
      backoff: 'linear',
      onRetry
    });
    
    // First retry after 100ms, second after 200ms (linear)
    await vi.advanceTimersByTimeAsync(100);
    expect(onRetry).toHaveBeenCalledTimes(1);
    
    await vi.advanceTimersByTimeAsync(200);
    expect(onRetry).toHaveBeenCalledTimes(2);
    
    const result = await promise;
    expect(result).toBe('success');
  });

  it('should respect custom shouldRetry function', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Custom error'));
    const shouldRetry = vi.fn().mockReturnValue(false);
    
    await expect(withRetry(operation, { shouldRetry })).rejects.toThrow('Custom error');
    
    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1);
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000
    });
  });

  it('should start in closed state', () => {
    const state = circuitBreaker.getState();
    expect(state.state).toBe('closed');
    expect(state.failures).toBe(0);
  });

  it('should execute operation successfully when closed', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should open after failure threshold', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    
    // Fail 3 times to reach threshold
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
    }
    
    const state = circuitBreaker.getState();
    expect(state.state).toBe('open');
    expect(state.failures).toBe(3);
  });

  it('should reject immediately when open', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    
    // Fail 3 times to open circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
    }
    
    // Next call should be rejected immediately
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is open');
    
    // Operation should not have been called again
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should transition to half-open after reset timeout', async () => {
    vi.useFakeTimers();
    
    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
    }
    
    expect(circuitBreaker.getState().state).toBe('open');
    
    // Fast-forward past reset timeout
    vi.advanceTimersByTime(1001);
    
    // Next operation should transition to half-open
    operation.mockResolvedValueOnce('success');
    const result = await circuitBreaker.execute(operation);
    
    expect(result).toBe('success');
    
    vi.useRealTimers();
  });

  it('should close after successful operations in half-open state', async () => {
    vi.useFakeTimers();
    
    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
    }
    
    // Fast-forward past reset timeout
    vi.advanceTimersByTime(1001);
    
    // Succeed 3 times to close circuit
    operation.mockResolvedValue('success');
    for (let i = 0; i < 3; i++) {
      await circuitBreaker.execute(operation);
    }
    
    expect(circuitBreaker.getState().state).toBe('closed');
    
    vi.useRealTimers();
  });

  it('should reset manually', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
    }
    
    expect(circuitBreaker.getState().state).toBe('open');
    
    circuitBreaker.reset();
    
    const state = circuitBreaker.getState();
    expect(state.state).toBe('closed');
    expect(state.failures).toBe(0);
  });
});

describe('withFallback', () => {
  it('should return primary result when successful', async () => {
    const primary = vi.fn().mockResolvedValue('primary');
    const fallback = vi.fn().mockResolvedValue('fallback');
    
    const result = await withFallback(primary, fallback);
    
    expect(result).toBe('primary');
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('should use fallback when primary fails', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('Primary failed'));
    const fallback = vi.fn().mockResolvedValue('fallback');
    
    const result = await withFallback(primary, fallback);
    
    expect(result).toBe('fallback');
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('should respect shouldFallback condition', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('Primary failed'));
    const fallback = vi.fn().mockResolvedValue('fallback');
    const shouldFallback = vi.fn().mockReturnValue(false);
    
    await expect(withFallback(primary, fallback, { shouldFallback })).rejects.toThrow('Primary failed');
    
    expect(fallback).not.toHaveBeenCalled();
    expect(shouldFallback).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should call onFallback callback', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('Primary failed'));
    const fallback = vi.fn().mockResolvedValue('fallback');
    const onFallback = vi.fn();
    
    await withFallback(primary, fallback, { onFallback });
    
    expect(onFallback).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result when operation completes within timeout', async () => {
    const operation = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return 'success';
    });
    
    const promise = withTimeout(operation, 1000);
    
    await vi.advanceTimersByTimeAsync(500);
    
    const result = await promise;
    expect(result).toBe('success');
  });

  it('should timeout when operation takes too long', async () => {
    const operation = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return 'success';
    });
    
    const promise = withTimeout(operation, 1000, 'Custom timeout message');
    
    await vi.advanceTimersByTimeAsync(1001);
    
    await expect(promise).rejects.toThrow('Custom timeout message');
  });

  it('should use default timeout message', async () => {
    const operation = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return 'success';
    });
    
    const promise = withTimeout(operation, 1000);
    
    await vi.advanceTimersByTimeAsync(1001);
    
    await expect(promise).rejects.toThrow('Operation timed out');
  });
});

describe('GracefulDegradation', () => {
  beforeEach(() => {
    GracefulDegradation.clearCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should cache successful results', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await GracefulDegradation.withGracefulDegradation(
      operation,
      'test-key'
    );
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
    
    const stats = GracefulDegradation.getCacheStats();
    expect(stats.size).toBe(1);
    expect(stats.keys).toContain('test-key');
  });

  it('should use stale data when operation fails', async () => {
    const operation = vi.fn()
      .mockResolvedValueOnce('cached-data')
      .mockRejectedValue(new Error('Operation failed'));
    
    // First call succeeds and caches data
    await GracefulDegradation.withGracefulDegradation(operation, 'test-key');
    
    // Second call fails but uses cached data
    const result = await GracefulDegradation.withGracefulDegradation(
      operation,
      'test-key'
    );
    
    expect(result).toBe('cached-data');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should not use stale data when too old', async () => {
    const operation = vi.fn()
      .mockResolvedValueOnce('cached-data')
      .mockRejectedValue(new Error('Operation failed'));
    
    // First call succeeds and caches data
    await GracefulDegradation.withGracefulDegradation(operation, 'test-key');
    
    // Fast-forward past max stale age
    vi.advanceTimersByTime(31 * 60 * 1000); // 31 minutes
    
    // Second call should not use stale data
    await expect(
      GracefulDegradation.withGracefulDegradation(operation, 'test-key')
    ).rejects.toThrow('Operation failed');
  });

  it('should use fallback data when no cache available', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    
    const result = await GracefulDegradation.withGracefulDegradation(
      operation,
      'test-key',
      'fallback-data'
    );
    
    expect(result).toBe('fallback-data');
  });

  it('should throw error when no recovery options available', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    
    await expect(
      GracefulDegradation.withGracefulDegradation(operation, 'test-key')
    ).rejects.toThrow('Operation failed');
  });

  it('should respect useStaleData option', async () => {
    const operation = vi.fn()
      .mockResolvedValueOnce('cached-data')
      .mockRejectedValue(new Error('Operation failed'));
    
    // First call succeeds and caches data
    await GracefulDegradation.withGracefulDegradation(operation, 'test-key');
    
    // Second call fails and should not use stale data
    await expect(
      GracefulDegradation.withGracefulDegradation(
        operation,
        'test-key',
        undefined,
        { useStaleData: false }
      )
    ).rejects.toThrow('Operation failed');
  });
});