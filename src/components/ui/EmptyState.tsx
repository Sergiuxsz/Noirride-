import React from 'react';
import { SearchSlash } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-secondary/40">
      <div className="p-4 mb-4 rounded-full bg-white/5 dark:bg-white/5 text-muted">
        {icon || <SearchSlash size={32} />}
      </div>
      <h3 className="font-serif text-lg font-semibold text-content mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
