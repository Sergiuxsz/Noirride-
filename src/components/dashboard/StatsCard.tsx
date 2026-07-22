import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  isRevenue?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  isRevenue = false,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-secondary border border-border hover:border-gold-500/30 transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-serif uppercase tracking-widest text-muted">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${isRevenue ? 'bg-gold-500/15 text-gold-500' : 'bg-black/5 dark:bg-white/5 text-content'}`}>
          {icon}
        </div>
      </div>

      <div>
        <div className={`font-serif text-3xl font-bold tracking-tight ${isRevenue ? 'text-gold-500' : 'text-content'}`}>
          {isRevenue && typeof value === 'number' ? `$${value.toLocaleString()}` : value}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {trend && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                {trend}
              </span>
            )}
            {subtitle && <span className="text-muted">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
