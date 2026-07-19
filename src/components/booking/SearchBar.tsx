import React from 'react';
import { MapPin, Clock, Calendar } from 'lucide-react';

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
  return (
    <div className="w-full space-y-3">
      <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-[#12141C]/80 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
        {/* Input container */}
        <div className="relative flex-1 flex items-center">
          {icon ? (
            <div className="absolute left-4 pointer-events-none flex items-center">
              {icon}
            </div>
          ) : (
            <MapPin size={20} className="absolute left-4 text-[#D4AF37] pointer-events-none" />
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#1A1D28] border border-white/5 hover:border-white/15 focus:border-[#D4AF37] rounded-xl pl-12 pr-4 py-3.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-all"
          />
        </div>

        {/* Time Select Segmented Control */}
        {showTimeSelect && onChangeTimeOption && (
          <div className="flex items-center bg-[#1A1D28] border border-white/5 rounded-xl p-1 md:max-w-xs">
            <button
              type="button"
              onClick={() => onChangeTimeOption('now')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                timeOption === 'now'
                  ? 'bg-[#D4AF37] text-[#0A0B0E] shadow-md'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Clock size={14} />
              <span>Now</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTimeOption('later')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                timeOption === 'later'
                  ? 'bg-[#D4AF37] text-[#0A0B0E] shadow-md'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Calendar size={14} />
              <span>Later</span>
            </button>
          </div>
        )}

        {/* Search / Submit Button */}
        <button
          type="submit"
          onClick={onSubmit}
          className="bg-[#D4AF37] hover:bg-[#C5A030] text-[#0A0B0E] px-6 py-3.5 rounded-xl font-serif text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#D4AF37]/10"
        >
          {buttonLabel}
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
