import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 - 100
  color?: 'purple' | 'coral' | 'green' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'purple',
  size = 'md',
  showLabel = false,
  label,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorStyles = {
    purple: 'bg-[#4B2A7B]',
    coral: 'bg-[#FF7A6B]',
    green: 'bg-emerald-600',
    amber: 'bg-amber-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-xs text-[#5C5765] mb-1.5">
          <span>{label}</span>
          <span className="font-mono tabular-nums font-medium">{clamped}%</span>
        </div>
      )}
      <div
        className={`w-full bg-[#4B2A7B]/10 rounded-full overflow-hidden ${sizeStyles[size]}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorStyles[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
