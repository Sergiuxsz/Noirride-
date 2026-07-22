import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
}) => {
  const { t } = useTranslation();
  const loadingMessage = message || t('common.loading', 'Securing your executive transfer...');

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-2 rounded-full border-gold-500/20"></div>
        <div className="absolute inset-0 border-2 border-t-gold-500 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border border-dashed rounded-full border-gold-500/40 animate-pulse"></div>
      </div>
      <p className="font-serif text-base font-medium tracking-wide text-content animate-pulse">
        {loadingMessage}
      </p>
      <p className="text-xs text-muted mt-2">{t('common.loadingSub', 'Connecting with private dispatch protocol')}</p>
    </div>
  );
};
