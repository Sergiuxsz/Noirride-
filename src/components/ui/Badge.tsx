import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  variant?: 'gold' | 'silver' | 'emerald' | 'amber' | 'blue' | 'rose' | 'dark';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'gold',
  size = 'sm',
  children,
  dot = false,
}) => {
  const variants = {
    gold: 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30',
    silver: 'bg-white/10 text-[#F8FAFC] border border-white/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    dark: 'bg-[#0A0B0E] text-[#94A3B8] border border-white/10',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full tracking-wider uppercase whitespace-nowrap',
        variants[variant],
        sizes[size]
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse',
            variant === 'emerald' && 'bg-emerald-400',
            variant === 'amber' && 'bg-amber-400',
            variant === 'blue' && 'bg-blue-400',
            variant === 'rose' && 'bg-rose-400',
            variant === 'gold' && 'bg-[#D4AF37]',
            variant === 'silver' && 'bg-[#F8FAFC]'
          )}
        />
      )}
      {children}
    </span>
  );
};
