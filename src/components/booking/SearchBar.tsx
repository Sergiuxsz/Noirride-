import React from 'react';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  showTimeSelect?: boolean;
  timeOption?: 'now' | 'later' | string;
  onChangeTimeOption?: (opt: 'now' | 'later') => void;
  buttonLabel?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Enter address...',
  showTimeSelect = false,
  timeOption = 'now',
  onChangeTimeOption,
  buttonLabel = 'Search',
  error,
  icon,
}) => {
  const { t } = useTranslation();
  return (
    <div className="w-full space-y-3">
      <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-secondary border border-border rounded-2xl shadow-xl">
        {/* Input container */}
        <div className="relative flex-1 flex items-center">
          {icon ? (
            <div className="absolute left-4 pointer-events-none flex items-center">
              {icon}
            </div>
          ) : (
            <MapPin size={20} className="absolute left-4 text-gold-500 pointer-events-none" />
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || t('booking.enterAddress', 'Enter address...')}
            className="w-full bg-tertiary border border-border hover:border-border/50 focus:border-gold-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-content placeholder-muted focus:outline-none transition-all"
          />
        </div>

        {/* Time Select Segmented Control */}
        {showTimeSelect && onChangeTimeOption && (
          <div className="flex items-center bg-tertiary border border-border rounded-xl p-1 md:max-w-xs">
            <button
              type="button"
              onClick={() => onChangeTimeOption('now')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                timeOption === 'now'
                  ? 'bg-gold-500 text-black shadow-md'
                  : 'text-muted hover:text-content'
              }`}
            >
              <Clock size={14} />
              <span>{t('booking.now', 'Now')}</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTimeOption('later')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                timeOption === 'later'
                  ? 'bg-gold-500 text-black shadow-md'
                  : 'text-muted hover:text-content'
              }`}
            >
              <Calendar size={14} />
              <span>{t('booking.later', 'Later')}</span>
            </button>
          </div>
        )}

        {/* Search / Submit Button */}
        <button
          type="submit"
          onClick={onSubmit}
          className="bg-gold-500 hover:bg-[#C5A030] text-black px-6 py-3.5 rounded-xl font-serif text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-gold-500/10"
        >
          {buttonLabel === 'Search' ? t('booking.search', 'Search') : buttonLabel}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 pl-4 font-medium transition-all animate-fade-in text-left">
          {error}
        </p>
      )}
    </div>
  );
};
