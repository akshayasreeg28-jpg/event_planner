import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarPlus,
  Calendar,
  Sparkles,
  Settings,
  Flame,
} from 'lucide-react';
import { UserSwitcher } from './UserSwitcher';
import { PWAInstallButton } from './PWAInstallButton';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/wizard', label: 'Create Event', icon: CalendarPlus },
    { to: '/events', label: 'My Events', icon: Calendar },
    { to: '/ideas', label: 'Ideas Studio', icon: Sparkles },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-[#FFFDF9] border-r border-[#4B2A7B]/10 shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#4B2A7B]/8">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4B2A7B] to-[#371C5D] text-white flex items-center justify-center shadow-md shadow-[#4B2A7B]/15 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-[#FF7A6B]" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-[#1E1B24] font-serif block">
              Event AI
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#5C5765] font-semibold block">
              Personal Event Concierge
            </span>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-[#5C5765] uppercase tracking-wider">
          Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F3EEF8] text-[#4B2A7B] font-semibold shadow-xs'
                    : 'text-[#5C5765] hover:text-[#1E1B24] hover:bg-black/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-current" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* PWA banner shortcut */}
        <div className="pt-4 px-1">
          <PWAInstallButton />
        </div>
      </nav>

      {/* Footer / User Profile Switcher */}
      <div className="p-4 border-t border-[#4B2A7B]/10 bg-white/50">
        <UserSwitcher />
      </div>
    </aside>
  );
};
