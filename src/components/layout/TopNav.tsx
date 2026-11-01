import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Plus, Sparkles, Flame, Moon, Sun } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { Button } from '../ui/Button';

export const TopNav: React.FC<{ onOpenSearch: () => void }> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    const saved = localStorage.getItem('event_ai_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('event_ai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('event_ai_theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-8 py-3.5 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-[#4B2A7B]/10">
      {/* Zone 1: Mobile brand or breadcrumb */}
      <div className="flex items-center gap-3">
        <NavLink to="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#4B2A7B] text-white flex items-center justify-center">
            <Flame className="w-4 h-4 text-[#FF7A6B]" />
          </div>
          <span className="text-base font-bold text-[#1E1B24] font-serif">Event AI</span>
        </NavLink>

        <span className="hidden lg:inline-block text-xs font-medium text-[#5C5765]">
          GenAI-Powered Event Workspace
        </span>
      </div>

      {/* Zone 2: Quick Search trigger button */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-[#4B2A7B]/15 bg-white/70 text-xs text-[#5C5765] hover:border-[#4B2A7B]/30 hover:bg-white transition-all shadow-xs cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#4B2A7B]" />
            <span>Search events, tasks, guests, vendors...</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#F3EEF8] rounded text-[#4B2A7B] border border-[#4B2A7B]/15">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Dark Mode + Notification Bell + Action CTA */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 text-[#5C5765] hover:text-[#1E1B24] rounded-lg"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-[#4B2A7B]" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-[#5C5765] hover:text-[#4B2A7B] hover:bg-[#F3EEF8]/60 transition-colors cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#4B2A7B]" />}
        </button>

        <NotificationCenter />

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/wizard')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Event
        </Button>
      </div>
    </header>
  );
};
