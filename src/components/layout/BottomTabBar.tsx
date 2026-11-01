import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, CalendarPlus, Sparkles, Settings } from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  const tabs = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/wizard', label: 'Create', icon: CalendarPlus, isHighlight: true },
    { to: '/ideas', label: 'Ideas', icon: Sparkles },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#4B2A7B]/10 px-2 py-1.5 flex items-center justify-around"
      aria-label="Mobile Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#4B2A7B] font-bold' : 'text-[#5C5765] hover:text-[#1E1B24]'
              }`
            }
          >
            {tab.isHighlight ? (
              <div className="w-8 h-8 rounded-full bg-[#4B2A7B] text-white flex items-center justify-center -mt-3 shadow-md">
                <Icon className="w-4 h-4 text-[#FF7A6B]" />
              </div>
            ) : (
              <Icon className="w-5 h-5 mb-0.5" />
            )}
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
