import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'raised' | 'glass' | 'highlight';
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantStyles = {
    default: 'bg-white border border-[#4B2A7B]/10 shadow-[0_2px_12px_rgba(75,42,123,0.04)]',
    elevated: 'bg-white border border-[#4B2A7B]/12 shadow-[0_8px_30px_rgba(75,42,123,0.08)]',
    raised: 'bg-white border border-[#4B2A7B]/12 shadow-[0_8px_30px_rgba(75,42,123,0.08)]',
    glass: 'bg-white/80 backdrop-blur-md border border-[#4B2A7B]/10 shadow-sm',
    highlight: 'bg-gradient-to-br from-white via-white to-[#F3EEF8] border border-[#4B2A7B]/20 shadow-md',
  };

  const hoverEffect = hoverable
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(75,42,123,0.1)] hover:border-[#4B2A7B]/25'
    : '';

  return (
    <div
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverEffect} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
