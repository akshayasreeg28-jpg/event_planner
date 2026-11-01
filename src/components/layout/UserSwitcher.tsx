import React, { useState } from 'react';
import { DEMO_USERS, getCurrentUser, setCurrentUser, resetDemoEvents, UserProfile } from '../../lib/storage';
import { RefreshCw, Users, Check, Sparkles } from 'lucide-react';
import { useToast } from '../ui/Toast';

export const UserSwitcher: React.FC = () => {
  const [currentUser, setUserState] = useState<UserProfile>(getCurrentUser());
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const handleSelectUser = (u: UserProfile) => {
    setCurrentUser(u);
    setUserState(u);
    setIsOpen(false);
    showToast({
      type: 'info',
      title: `Switched user to ${u.name}`,
      description: `Viewing events and workspace as ${u.name}.`,
    });
  };

  const handleResetDemoData = () => {
    resetDemoEvents();
    setIsOpen(false);
    showToast({
      type: 'success',
      title: 'Demo Data Reloaded',
      description: 'Reset all 3 demo events (Wedding, Tech Fest, Safari Birthday) to pristine state.',
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-[#F3EEF8] transition-colors text-left w-full cursor-pointer group"
      >
        <img
          src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
          alt={currentUser.name}
          className="w-8 h-8 rounded-lg object-cover border border-[#4B2A7B]/20 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#1E1B24] truncate group-hover:text-[#4B2A7B] transition-colors">
            {currentUser.name}
          </p>
          <p className="text-[10px] text-[#5C5765] truncate">{currentUser.email}</p>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-[#4B2A7B]/15 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#5C5765] uppercase tracking-wider">
              Switch Demo Persona
            </div>

            <div className="space-y-1 mb-2">
              {DEMO_USERS.map((u) => {
                const isSelected = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#F3EEF8] text-[#4B2A7B] font-medium' : 'hover:bg-black/5 text-[#1E1B24]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-6 h-6 rounded-md object-cover border border-[#4B2A7B]/10 shrink-0"
                      />
                      <span className="text-xs truncate">{u.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#4B2A7B] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#4B2A7B]/10">
              <button
                onClick={handleResetDemoData}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#4B2A7B] hover:bg-[#F3EEF8] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#FF7A6B]" />
                <span>Reload Pristine Demo Data</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
