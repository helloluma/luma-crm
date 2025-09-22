import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  usePerformanceMonitoring,
  useAPIPerformanceMonitoring,
  useQueryPerformanceMonitoring,
  usePerformanceStats,
  useWebVitals
} from '../usePerformanceMonitoring';
import { PerformanceMonitor } from '@/lib/performance';

// Mock the PerformanceMonitor
vi.mock('@/lib/performance', () => ({
  PerformanceMonitor: {
    recordMetric: vi.fn(),
    start: vi.fn(),
    getAllStats: vi.fn(),
    getStats: vi.fn(),
    clear: vi.fn()
  }
}));

// Mock performance.now()
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  },
  writable: true
});

// Mock PerformanceObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockObserver = {
  observe: mockObserve,
  disconnect: mockDisconnect
};
global.PerformanceObserver = vi.fn().mockImplementation((callback) => mockObserver);

const mockPerformanceMonitor = PerformanceMonitor as any;

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should record component lifetime on unmount', () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // mount time
      .mockReturnValueOnce(2000); // unmount time

    const { unmount } = renderHook(() => usePerformanceMonitoring('TestComponent'));

    unmount();

    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('TestComponent_lifetime', 1000);
  });

  it('should measure render time correctly', () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // mount time
      .mockReturnValueOnce(1500) // start render
      .mockReturnValueOnce(1600); // end render

    const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));

    act(() => {
      result.current.startRender();
    });

    act(() => {
      result.current.endRender();
    });

    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('TestComponent_render', 100);
  });

  it('should not record render time if startRender was not called', () => {
    const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));

    act(() => {
      result.current.endRender();
    });

    expect(mockPerformanceMonitor.recordMetric).not.toHaveBeenCalledWith(
      expect.stringContaining('_render'),
      expect.any(Number)
    );
  });

  it('should measure async operations', async () => {
    const mockEndTimer = vi.fn();
    mockPerformanceMonitor.start.mockReturnValue(mockEndTimer);

    const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));

    const asyncOperation = vi.fn().mockResolvedValue('result');

    const resultValue = await act(async () => {
      return result.current.measureAsync(asyncOperation, 'testOperation');
    });

    expect(resultValue).toBe('result');
    expect(mockPerformanceMonitor.start).toHaveBeenCalledWith('TestComponent_testOperation');
    expect(mockEndTimer).toHaveBeenCalled();
    expect(asyncOperation).toHaveBeenCalled();
  });

  it('should measure sync operations', () => {
    const mockEndTimer = vi.fn();
    mockPerformanceMonitor.start.mockReturnValue(mockEndTimer);

    const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));

    const syncOperation = vi.fn().mockReturnValue('result');

    let resultValue: string;
    act(() => {
      resultValue = result.current.measureSync(syncOperation, 'testOperation');
    });

    expect(resultValue).toBe('result');
    expect(mockPerformanceMonitor.start).toHaveBeenCalledWith('TestComponent_testOperation');
    expect(mockEndTimer).toHaveBeenCalled();
    expect(syncOperation).toHaveBeenCalled();
  });

  it('should handle errors in async operations', async () => {
    const mockEndTimer = vi.fn();
    mockPerformanceMonitor.start.mockReturnValue(mockEndTimer);

    const { result } = renderHook(() => usePerformanceMonitoring('TestComponent'));

    const asyncOperation = vi.fn().mockRejectedValue(new Error('Test error'));

    await expect(
      act(async () => {
        return result.current.measureAsync(asyncOperation, 'testOperation');
      })
    ).rejects.toThrow('Test error');

    expect(mockEndTimer).toHaveBeenCalled();
  });
});

describe('useAPIPerformanceMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should measure API call performance', async () => {
    const mockEndTimer = vi.fn().mockReturnValue(500);
    mockPerformanceMonitor.start.mockReturnValue(mockEndTimer);

    const { result } = renderHook(() => useAPIPerformanceMonitoring());

    const apiCall = vi.fn().mockResolvedValue({ data: 'test' });

    const resultValue = await act(async () => {
      return result.current.measureAPICall(apiCall, '/api/test');
    });

    expect(resultValue).toEqual({ data: 'test' });
    expect(mockPerformanceMonitor.start).toHaveBeenCalledWith('api__api_test');
    expect(mockEndTimer).toHaveBeenCalled();
  });

  it('should warn about slow API calls', async () => {
    const mockEndTimer = vi.fn().mockReturnValue(3000);
    mockPerformanceMonitor.start.mockReturnValue(mockEndTimer);

    const { result } = renderHook(() => useAPIPerformanceMonitoring());

    const apiCall = vi.fn().mockResolvedValue({ data: 'test' });

    await act(async () => {
      return result.current.measureAPICall(apiCall, '/api/slow');
    });

    expect(console.warn).toHaveBeenCalledWith(
      'Slow API call detected: /api/slow (3000.00ms)'
    );
  });

  it('should record API errors', async () => {
    const mockEndTimer = vi.fn();
    mockPerformanceMonitor.start.mockReturnValue(mockEndTimer);

    const { result } = renderHook(() => useAPIPerformanceMonitoring());

    const apiCall = vi.fn().mockRejectedValue(new Error('API Error'));

    await expect(
      act(async () => {
        return result.current.measureAPICall(apiCall, '/api/error');
      })
    ).rejects.toThrow('API Error');

    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('api_error__api_error', 1);
    expect(mockEndTimer).toHaveBeenCalled();
  });
});

describe('useQueryPerformanceMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should measure query performance', async () => {
    const mockEndTimer = vi.fn().mockReturnValue(500);
    mockPerformanceMonitor.start.mockReturnValue(mockEndTimer);

    const { result } = renderHook(() => useQueryPerformanceMonitoring());

    const query = vi.fn().mockResolvedValue([{ id: 1, name: 'test' }]);

    const resultValue = await act(async () => {
      return result.current.measureQuery(query, 'getClients');
    });

    expect(resultValue).toEqual([{ id: 1, name: 'test' }]);
    expect(mockPerformanceMonitor.start).toHaveBeenCalledWith('query_getClients');
    expect(mockEndTimer).toHaveBeenCalled();
  });

  it('should warn about slow queries', async () => {
    const mockEndTimer = vi.fn().mockReturnValue(2000);
    mockPerformanceMonitor.start.mockReturnValue(mockEndTimer);

    const { result } = renderHook(() => useQueryPerformanceMonitoring());

    const query = vi.fn().mockResolvedValue([]);

    await act(async () => {
      return result.current.measureQuery(query, 'slowQuery');
    });

    expect(console.warn).toHaveBeenCalledWith(
      'Slow query detected: slowQuery (2000.00ms)'
    );
  });

  it('should record query errors', async () => {
    const mockEndTimer = vi.fn();
    mockPerformanceMonitor.start.mockReturnValue(mockEndTimer);

    const { result } = renderHook(() => useQueryPerformanceMonitoring());

    const query = vi.fn().mockRejectedValue(new Error('Query Error'));

    await expect(
      act(async () => {
        return result.current.measureQuery(query, 'errorQuery');
      })
    ).rejects.toThrow('Query Error');

    expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('query_error_errorQuery', 1);
    expect(mockEndTimer).toHaveBeenCalled();
  });
});

describe('usePerformanceStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get all stats', () => {
    const mockStats = { metric1: { avg: 100, count: 5 } };
    mockPerformanceMonitor.getAllStats.mockReturnValue(mockStats);

    const { result } = renderHook(() => usePerformanceStats());

    const stats = result.current.getStats();

    expect(stats).toBe(mockStats);
    expect(mockPerformanceMonitor.getAllStats).toHaveBeenCalled();
  });

  it('should get component-specific stats', () => {
    const mockRenderStats = { avg: 50, count: 10 };
    const mockLifetimeStats = { avg: 5000, count: 2 };

    mockPerformanceMonitor.getStats
      .mockReturnValueOnce(mockRenderStats)
      .mockReturnValueOnce(mockLifetimeStats);

    const { result } = renderHook(() => usePerformanceStats());

    const stats = result.current.getComponentStats('TestComponent');

    expect(stats).toEqual({
      render: mockRenderStats,
      lifetime: mockLifetimeStats
    });
    expect(mockPerformanceMonitor.getStats).toHaveBeenCalledWith('TestComponent_render');
    expect(mockPerformanceMonitor.getStats).toHaveBeenCalledWith('TestComponent_lifetime');
  });

  it('should clear stats', () => {
    const { result } = renderHook(() => usePerformanceStats());

    act(() => {
      result.current.clearStats();
    });

    expect(mockPerformanceMonitor.clear).toHaveBeenCalled();
  });
});

describe('useWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Reset the mock observer
    mockObserve.mockClear();
    mockDisconnect.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set up PerformanceObserver for web vitals', () => {
    renderHook(() => useWebVitals());

    expect(PerformanceObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalledWith({
      entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']
    });
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useWebVitals());

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle browser compatibility issues', () => {
    mockObserve.mockImplementationOnce(() => {
      throw new Error('Not supported');
    });

    renderHook(() => useWebVitals());

    expect(console.warn).toHaveBeenCalledWith(
      'Web Vitals monitoring not supported in this browser'
    );
  });

  it('should get web vitals stats', () => {
    const mockLCPStats = { avg: 2500, count: 1 };
    const mockFIDStats = { avg: 100, count: 1 };
    const mockCLSStats = { avg: 0.1, count: 1 };

    mockPerformanceMonitor.getStats
      .mockReturnValueOnce(mockLCPStats)
      .mockReturnValueOnce(mockFIDStats)
      .mockReturnValueOnce(mockCLSStats);

    const { result } = renderHook(() => useWebVitals());

    const vitals = result.current.getWebVitals();

    expect(vitals).toEqual({
      lcp: mockLCPStats,
      fid: mockFIDStats,
      cls: mockCLSStats
    });
  });
});