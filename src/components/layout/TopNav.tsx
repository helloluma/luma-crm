'use client';

import { useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { NotificationBell } from '@/components/notifications';

interface TopNavProps {
  title: string;
  onMobileMenuToggle?: () => void;
  className?: string;
}

interface User {
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

// Mock user data - this would come from auth context in real implementation
const mockUser: User = {
  name: 'Edward Guillien',
  email: 'hello@edwardguillien.com',
  initials: 'EG'
};

export default function TopNav({ title, onMobileMenuToggle, className }: TopNavProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  return (
    <header className={cn('bg-white border-b border-gray-200 px-4 lg:px-6 py-4', className)}>
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-2 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Quick Action Button */}
          <button className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm lg:text-base flex items-center">
            <Plus className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>
          
          {/* Notifications */}
          <NotificationBell />
          
          {/* User Profile */}
          <div className="relative">
            <button
              onClick={toggleUserDropdown}
              className="flex items-center space-x-2 lg:space-x-3 hover:bg-gray-50 rounded-lg p-1 transition-colors"
            >
              <div className="hidden lg:block text-right">
                <div className="text-sm font-medium text-gray-900">{mockUser.name}</div>
                <div className="text-xs text-gray-500">{mockUser.email}</div>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                {mockUser.avatar ? (
                  <img 
                    src={mockUser.avatar} 
                    alt={mockUser.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">{mockUser.initials}</span>
                )}
              </div>
            </button>
            
            {/* User Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{mockUser.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{mockUser.name}</div>
                      <div className="text-xs text-gray-500 truncate">{mockUser.email}</div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Account Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Help & Support
                  </button>
                </div>
                <div className="border-t border-gray-200 py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close dropdowns */}
      {showUserDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserDropdown(false);
          }}
        />
      )}
    </header>
  );
}