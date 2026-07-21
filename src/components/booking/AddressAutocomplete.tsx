import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, Calendar, Loader2, Home, Briefcase, History, X } from 'lucide-react';
import { usePlacesAutocomplete, SavedLocation } from '../../hooks/usePlacesAutocomplete';

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelectCoordinates?: (lat: number, lng: number) => void;
  placeholder?: string;
  showTimeSelect?: boolean;
  timeOption?: 'now' | 'later' | string;
  onChangeTimeOption?: (opt: 'now' | 'later' | string) => void;
  error?: string;
  icon?: React.ReactNode;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onSelectCoordinates,
  placeholder = 'Enter address...',
  showTimeSelect = false,
  timeOption = 'now',
  onChangeTimeOption,
  error,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    input,
    setInput,
    predictions,
    loading,
    recentSearches,
    favorites,
    saveRecentSearch,
    getPlaceCoordinates,
    clearRecentSearches
  } = usePlacesAutocomplete(value);

  // Sync external value changes to internal input state, unless the user is typing
  useEffect(() => {
    if (value !== input) {
       setInput(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    setInput(description);
    onChange(description);
    setIsOpen(false);

    try {
      const details = await getPlaceCoordinates(placeId);
      if (details) {
        if (onSelectCoordinates) {
          onSelectCoordinates(details.lat, details.lng);
        }
        
        saveRecentSearch({
          id: placeId,
          label: details.formattedAddress || description,
          address: details.formattedAddress || description,
          lat: details.lat,
          lng: details.lng,
        });
      }
    } catch (err) {
      console.error('Failed to get place details', err);
    }
  };

  const handleSelectSaved = (saved: SavedLocation) => {
    if (saved.lat && saved.lng && saved.address !== 'Add Home' && saved.address !== 'Add Work') {
      setInput(saved.address);
      onChange(saved.address);
      setIsOpen(false);
      if (onSelectCoordinates) {
        onSelectCoordinates(saved.lat, saved.lng);
      }
    } else {
      // In a real app, this would open a modal to set the home/work address
      console.log('Needs to set address for:', saved.type);
    }
  };

  return (
    <div className="relative w-full space-y-3" ref={dropdownRef}>
      <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-[#12141C]/80 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
        {/* Input container */}
        <div className="relative flex-1 flex items-center">
          {icon ? (
            <div className="absolute left-4 pointer-events-none flex items-center z-10">
              {icon}
            </div>
          ) : (
            <MapPin size={20} className="absolute left-4 text-[#D4AF37] pointer-events-none z-10" />
          )}
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full bg-[#1A1D28] border border-white/5 hover:border-white/15 focus:border-[#D4AF37] rounded-xl pl-12 pr-10 py-3.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-all relative z-0"
            autoComplete="off"
          />
          {loading && (
            <div className="absolute right-4 z-10 animate-spin text-[#D4AF37]">
              <Loader2 size={16} />
            </div>
          )}
        </div>

        {/* Time Select Segmented Control */}
        {showTimeSelect && onChangeTimeOption && (
          <div className="flex items-center bg-[#1A1D28] border border-white/5 rounded-xl p-1 md:max-w-xs shrink-0">
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
      </div>

      {error && (
        <p className="text-xs text-red-400 pl-4 font-medium transition-all animate-fade-in text-left">
          {error}
        </p>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && ((input && predictions.length > 0) || (input && !loading && predictions.length === 0) || ((!input || input.length < 2) && recentSearches.length > 0)) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1D28] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in max-h-80 overflow-y-auto">
          
          {/* Active Search Predictions */}
          {input && predictions.length > 0 && (
            <div className="p-2">
              {predictions.map((prediction) => (
                <button
                  key={prediction.placeId}
                  type="button"
                  onClick={() => handleSelectPlace(prediction.placeId, prediction.description)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-lg transition-colors flex items-start gap-3 group"
                >
                  <MapPin size={18} className="text-[#94A3B8] group-hover:text-[#D4AF37] mt-0.5 shrink-0 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F8FAFC] truncate">{prediction.mainText}</p>
                    {prediction.secondaryText && (
                      <p className="text-xs text-[#64748B] truncate">{prediction.secondaryText}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results state */}
          {input && !loading && predictions.length === 0 && (
            <div className="p-6 text-center text-sm text-[#64748B]">
              No places found for "{input}"
            </div>
          )}

          {/* History and Favorites (show when input is empty or very short) */}
          {(!input || input.length < 2) && (
            <div className="p-2 space-y-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                   <div className="flex items-center justify-between px-4 py-2">
                     <h4 className="text-[10px] uppercase tracking-widest text-[#64748B] font-semibold">Recent</h4>
                     <button type="button" onClick={clearRecentSearches} className="text-[10px] text-[#D4AF37] hover:text-[#F8FAFC] transition-colors">Clear</button>
                   </div>
                   {recentSearches.map((recent) => (
                     <button
                        key={recent.id}
                        type="button"
                        onClick={() => handleSelectSaved(recent)}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 group"
                     >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                          <History size={14} className="text-[#94A3B8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#F8FAFC] truncate">{recent.label}</p>
                        </div>
                     </button>
                   ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
