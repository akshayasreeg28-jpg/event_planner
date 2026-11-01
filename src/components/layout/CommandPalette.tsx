import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, CheckSquare, Users, Building, ArrowRight, X } from 'lucide-react';
import { getStoredEvents } from '../../lib/storage';

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent('toggle_command_palette'));
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const events = getStoredEvents();
  const q = query.toLowerCase().trim();

  // Search results
  const matchingEvents = q ? events.filter((e) => e.details.title.toLowerCase().includes(q) || e.details.city.toLowerCase().includes(q)) : events.slice(0, 3);
  
  const matchingTasks: { eventId: string; eventTitle: string; task: any }[] = [];
  const matchingGuests: { eventId: string; eventTitle: string; guest: any }[] = [];
  const matchingVendors: { eventId: string; eventTitle: string; vendor: any }[] = [];

  if (q) {
    events.forEach((ev) => {
      ev.tasks.forEach((t) => {
        if (t.title.toLowerCase().includes(q) || t.phase.toLowerCase().includes(q)) {
          matchingTasks.push({ eventId: ev.details.id, eventTitle: ev.details.title, task: t });
        }
      });
      ev.guests.forEach((g) => {
        if (g.name.toLowerCase().includes(q) || g.dietaryNeeds.toLowerCase().includes(q)) {
          matchingGuests.push({ eventId: ev.details.id, eventTitle: ev.details.title, guest: g });
        }
      });
      ev.vendors.forEach((v) => {
        if (v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)) {
          matchingVendors.push({ eventId: ev.details.id, eventTitle: ev.details.title, vendor: v });
        }
      });
    });
  }

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6" role="dialog">
      <div className="fixed inset-0 bg-[#1E1B24]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#4B2A7B]/15 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#4B2A7B]/10">
          <Search className="w-5 h-5 text-[#4B2A7B]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, tasks, guests, vendors... (Cmd+K)"
            className="w-full text-sm bg-transparent border-none outline-none text-[#1E1B24] placeholder:text-[#5C5765]"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-[#5C5765] hover:text-[#1E1B24] hover:bg-[#F3EEF8]"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Events */}
          {matchingEvents.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-[#5C5765] uppercase tracking-wider">
                Events
              </p>
              <div className="space-y-0.5">
                {matchingEvents.map((ev) => (
                  <button
                    key={ev.details.id}
                    onClick={() => handleSelect(`/events/${ev.details.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-xl hover:bg-[#F3EEF8] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar className="w-4 h-4 text-[#4B2A7B] shrink-0" />
                      <span className="text-sm font-medium text-[#1E1B24] truncate">
                        {ev.details.title}
                      </span>
                      <span className="text-xs text-[#5C5765] shrink-0">· {ev.details.city}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#4B2A7B] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {matchingTasks.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-[#5C5765] uppercase tracking-wider">
                Tasks ({matchingTasks.length})
              </p>
              <div className="space-y-0.5">
                {matchingTasks.slice(0, 4).map(({ eventId, eventTitle, task }) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelect(`/events/${eventId}?tab=timeline`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-xl hover:bg-[#F3EEF8] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="text-sm font-medium text-[#1E1B24]">{task.title}</span>
                        <span className="text-xs text-[#5C5765] block">in {eventTitle}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#5C5765] shrink-0">{task.deadline}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guests */}
          {matchingGuests.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-[#5C5765] uppercase tracking-wider">
                Guests ({matchingGuests.length})
              </p>
              <div className="space-y-0.5">
                {matchingGuests.slice(0, 4).map(({ eventId, guest }) => (
                  <button
                    key={guest.id}
                    onClick={() => handleSelect(`/events/${eventId}?tab=guests`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-xl hover:bg-[#F3EEF8] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Users className="w-4 h-4 text-[#FF7A6B] shrink-0" />
                      <span className="text-sm font-medium text-[#1E1B24] truncate">{guest.name}</span>
                      <span className="text-xs text-[#5C5765]">· RSVP: {guest.rsvpStatus}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vendors */}
          {matchingVendors.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-[#5C5765] uppercase tracking-wider">
                Vendors ({matchingVendors.length})
              </p>
              <div className="space-y-0.5">
                {matchingVendors.slice(0, 4).map(({ eventId, vendor }) => (
                  <button
                    key={vendor.id}
                    onClick={() => handleSelect(`/events/${eventId}?tab=vendors`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-xl hover:bg-[#F3EEF8] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Building className="w-4 h-4 text-[#4B2A7B] shrink-0" />
                      <span className="text-sm font-medium text-[#1E1B24] truncate">{vendor.name}</span>
                      <span className="text-xs text-[#5C5765]">· {vendor.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && matchingEvents.length === 0 && matchingTasks.length === 0 && matchingGuests.length === 0 && (
            <div className="py-8 text-center text-sm text-[#5C5765]">
              No results found for "{query}".
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-[#F3EEF8]/60 border-t border-[#4B2A7B]/10 text-[11px] text-[#5C5765]">
          <span>Navigation: Select to jump to section</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
