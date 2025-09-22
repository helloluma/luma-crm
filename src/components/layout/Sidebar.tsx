'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Receipt,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: Users,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    name: 'Finance',
    href: '/finance',
    icon: Receipt,
  },
];

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={cn(
              'logo-container flex items-center transition-all duration-300',
              isCollapsed && 'justify-center w-full'
            )}>
              {!isCollapsed ? (
                <Image
                  src="/luma_logo.svg"
                  alt="Luma"
                  width={96}
                  height={32}
                  className="logo-full transition-all duration-300"
                  priority
                />
              ) : (
                <Image
                  src="/luma_icon.svg"
                  alt="Luma"
                  width={32}
                  height={32}
                  className="logo-collapsed transition-all duration-300"
                  priority
                />
              )}
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className={cn(
              'hidden lg:flex p-1 rounded-lg hover:bg-gray-100 transition-all duration-200',
              isCollapsed && 'absolute right-[-10px] top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full w-5 h-5 items-center justify-center z-40 shadow-sm'
            )}
          >
            <ChevronLeft 
              className={cn(
                'text-gray-500 transition-transform duration-200',
                isCollapsed ? 'w-2.5 h-2.5 rotate-180' : 'w-5 h-5'
              )} 
            />
          </button>
        </div>
        
        {/* Trial Notice */}
        {!isCollapsed && (
          <div className="sidebar-text mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 transition-opacity duration-200">
            <div className="flex items-center text-orange-600 mb-1 text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              7 days left in trial
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'nav-item flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
                    isCollapsed && 'justify-center p-2'
                  )}
                >
                  <Icon 
                    className={cn(
                      'flex-shrink-0',
                      isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'
                    )} 
                  />
                  {!isCollapsed && (
                    <span className="sidebar-text transition-opacity duration-200">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}