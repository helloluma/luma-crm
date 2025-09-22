'use client';

import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import MainContent from './MainContent';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'Dashboard' }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar />
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Main Content Area */}
      <div className={`
        transition-all duration-300
        ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
      `}>
        {/* Top Navigation */}
        <TopNav 
          title={title}
          onMobileMenuToggle={toggleMobileMenu}
        />

        {/* Main Content */}
        <MainContent sidebarCollapsed={isSidebarCollapsed}>
          {children}
        </MainContent>
      </div>
    </div>
  );
}