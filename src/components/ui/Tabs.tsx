import React from 'react';
import { motion } from 'motion/react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  if (variant === 'pills') {
    return (
      <div
        className={`flex items-center gap-1.5 p-1 bg-[var(--app-surface-subtle)] rounded-xl overflow-x-auto no-scrollbar ${className}`}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'text-[var(--app-accent)] font-semibold'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-white/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="pills-active-bg"
                  className="absolute inset-0 bg-[var(--app-surface)] rounded-lg shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                      isActive ? 'bg-[#4B2A7B]/10 text-[#4B2A7B]' : 'bg-black/5 text-[var(--app-text-muted)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center gap-5 border-b border-[var(--app-border)] overflow-x-auto no-scrollbar ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isActive
                ? 'text-[var(--event-primary)] font-bold'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-mono tabular-nums ${
                  isActive ? 'bg-[#4B2A7B]/10 text-[#4B2A7B]' : 'bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)]'
                }`}
              >
                {tab.count}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId="tabs-active-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--event-primary)]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
