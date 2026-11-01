import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { BottomTabBar } from './BottomTabBar';
import { CommandPalette } from './CommandPalette';

export const AppLayout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsSearchOpen((prev) => !prev);
    window.addEventListener('toggle_command_palette', handleToggle);
    return () => window.removeEventListener('toggle_command_palette', handleToggle);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#FBF7F0] text-[#1E1B24]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <TopNav onOpenSearch={() => setIsSearchOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
