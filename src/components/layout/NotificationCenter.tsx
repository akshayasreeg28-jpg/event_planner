import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Clock, CreditCard, ChevronRight } from 'lucide-react';
import { getStoredEvents } from '../../lib/storage';
import { useNavigate } from 'react-router-dom';
import { formatMinorToCurrency } from '../../lib/formatters';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const events = getStoredEvents();
  const alerts: {
    id: string;
    type: 'overdue_task' | 'payment_due' | 'unconfirmed_rsvps';
    title: string;
    eventTitle: string;
    eventId: string;
    targetTab: string;
    dateOrAmount?: string;
  }[] = [];

  const todayStr = new Date().toISOString().split('T')[0];

  events.forEach((ev) => {
    // Tasks overdue or near deadline
    ev.tasks.forEach((t) => {
      if (t.status !== 'completed' && t.deadline <= todayStr) {
        alerts.push({
          id: `task_${t.id}`,
          type: 'overdue_task',
          title: `Overdue Task: ${t.title}`,
          eventTitle: ev.details.title,
          eventId: ev.details.id,
          targetTab: 'timeline',
          dateOrAmount: `Due: ${t.deadline}`,
        });
      }
    });

    // Payments pending or overdue
    ev.budgetItems.forEach((b) => {
      if ((b.status === 'pending' || b.status === 'partially_paid') && b.dueDate && b.dueDate <= todayStr) {
        const remainingMinor = b.actualAmountMinor - b.paidAmountMinor;
        alerts.push({
          id: `pay_${b.id}`,
          type: 'payment_due',
          title: `Payment Due: ${b.name}`,
          eventTitle: ev.details.title,
          eventId: ev.details.id,
          targetTab: 'budget',
          dateOrAmount: formatMinorToCurrency(remainingMinor, ev.details.currency),
        });
      }
    });
  });

  const count = alerts.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[#5C5765] hover:text-[#1E1B24] hover:bg-[#F3EEF8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2A7B] cursor-pointer"
        aria-label="Notification Center"
      >
        <Bell className="w-5 h-5 text-[#4B2A7B]" />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#FF7A6B] text-white rounded-full text-[10px] font-bold flex items-center justify-center font-mono">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#4B2A7B]/15 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#4B2A7B]/10 bg-[#F3EEF8]/40">
            <span className="text-sm font-semibold text-[#1E1B24] font-serif">Notifications</span>
            <span className="text-xs text-[#5C5765] font-mono tabular-nums">{count} action alerts</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#4B2A7B]/8">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/events/${alert.eventId}?tab=${alert.targetTab}`);
                  }}
                  className="w-full text-left p-3.5 hover:bg-[#F3EEF8]/60 transition-colors flex items-start gap-3 group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-rose-50 text-rose-600">
                    {alert.type === 'payment_due' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1E1B24] truncate">{alert.title}</p>
                    <p className="text-[11px] text-[#5C5765] truncate mt-0.5">{alert.eventTitle}</p>
                    {alert.dateOrAmount && (
                      <p className="text-[11px] font-mono font-medium text-[#4B2A7B] mt-1">
                        {alert.dateOrAmount}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#5C5765] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2" />
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#5C5765]">
                <AlertTriangle className="w-6 h-6 text-emerald-600 mx-auto mb-2 opacity-80" />
                All caught up! No overdue tasks or urgent payments.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
