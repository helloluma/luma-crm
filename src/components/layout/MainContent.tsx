'use client';

import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface MainContentProps {
  children: ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
}

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Card component for consistent card-based layouts
export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-4 lg:p-6',
    lg: 'p-6 lg:p-8'
  };

  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 shadow-sm',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

// Grid component for responsive layouts
export function Grid({ children, cols = 1, gap = 'md', className }: GridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12'
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-4 lg:gap-6',
    lg: 'gap-6 lg:gap-8'
  };

  return (
    <div className={cn(
      'grid',
      colClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Section component for consistent spacing and hierarchy
export function Section({ 
  children, 
  title, 
  description, 
  className,
  headerAction
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  headerAction?: ReactNode;
}) {
  return (
    <section className={cn('mb-6 lg:mb-8', className)}>
      {(title || description || headerAction) && (
        <div className="mb-4 lg:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2 space-y-2 lg:space-y-0">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            )}
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
          {description && (
            <p className="text-gray-600 text-sm">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// Main content layout component
export default function MainContent({ 
  children, 
  className, 
  sidebarCollapsed = false 
}: MainContentProps) {
  return (
    <div className={cn(
      'transition-all duration-300',
      sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64',
      className
    )}>
      <main className="p-4 lg:p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 lg:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-xs text-gray-500">©2025 Luma - All rights reserved</p>
            <div className="flex justify-center space-x-4 mt-2">
              <a 
                href="#" 
                className="text-xs text-blue-600 hover:text-blue-500 transition-colors"
              >
                Terms & Conditions
              </a>
              <a 
                href="#" 
                className="text-xs text-blue-600 hover:text-blue-500 transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

