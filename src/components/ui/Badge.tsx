import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'purple' | 'coral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
}) => {
  const variantStyles = {
    neutral: 'bg-[#F3EEF8] text-[#5C5765] border border-[#4B2A7B]/10',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    error: 'bg-rose-50 text-rose-800 border border-rose-200',
    purple: 'bg-[#F3EEF8] text-[#4B2A7B] border border-[#4B2A7B]/20',
    coral: 'bg-[#FFEAE7] text-[#E65D4E] border border-[#FF7A6B]/30',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md whitespace-nowrap shrink-0 ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
