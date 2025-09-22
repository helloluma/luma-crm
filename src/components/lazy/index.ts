import { Suspense, ComponentType } from 'react';
import { lazyLoad } from '@/lib/performance';

// Loading fallback components
export const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export const CardLoader = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg h-32 w-full"></div>
  </div>
);

// Lazy-loaded components with proper fallbacks
export const LazyDashboard = lazyLoad(
  () => import('@/app/dashboard/page'),
  PageLoader
);

export const LazyClients = lazyLoad(
  () => import('@/app/clients/page'),
  PageLoader
);

export const LazyCalendar = lazyLoad(
  () => import('@/app/calendar/page'),
  PageLoader
);

export const LazyRevenueAnalytics = lazyLoad(
  () => import('@/app/revenue-analytics/page'),
  PageLoader
);

// Lazy-loaded feature components
export const LazyRevenueChart = lazyLoad(
  () => import('@/components/financial/RevenueChart'),
  ComponentLoader
);

export const LazyPerformanceChart = lazyLoad(
  () => import('@/components/dashboard/PerformanceChart'),
  ComponentLoader
);

export const LazyCalendarView = lazyLoad(
  () => import('@/components/calendar/CalendarView'),
  ComponentLoader
);

export const LazyTransactionTable = lazyLoad(
  () => import('@/components/financial/TransactionTable'),
  ComponentLoader
);

export const LazyClientList = lazyLoad(
  () => import('@/components/clients/ClientList'),
  ComponentLoader
);

export const LazyDocumentManager = lazyLoad(
  () => import('@/components/clients/DocumentManager'),
  ComponentLoader
);

export const LazyNotificationCenter = lazyLoad(
  () => import('@/components/notifications/NotificationCenter'),
  ComponentLoader
);

// HOC for adding Suspense wrapper
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback: ComponentType = ComponentLoader
) {
  const WrappedComponent = (props: P) => (
    <Suspense fallback={<fallback />}>
      <Component {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Preload utilities
export const preloadComponent = (importFunc: () => Promise<any>) => {
  // Preload on idle or after a delay
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFunc());
    } else {
      setTimeout(() => importFunc(), 100);
    }
  }
};

// Preload critical components
export const preloadCriticalComponents = () => {
  preloadComponent(() => import('@/components/dashboard/MetricsCards'));
  preloadComponent(() => import('@/components/dashboard/ActivityFeed'));
  preloadComponent(() => import('@/components/clients/ClientCard'));
};