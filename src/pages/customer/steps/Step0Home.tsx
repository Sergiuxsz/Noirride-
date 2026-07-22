import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, CheckCircle, Clock, MapPin, Loader2, Home, Briefcase, History } from 'lucide-react';
import type { ServiceType } from '../../../types';
import { usePlacesAutocomplete, SavedLocation } from '../../../hooks/usePlacesAutocomplete';
import { useTranslation } from 'react-i18next';

import airportImg from '../../../assets/airport_transfer.png';
import hourlyImg from '../../../assets/hourly_chauffeur.png';
import intercityImg from '../../../assets/intercity_voyage.png';
import heroImg from '../../../assets/hero.png';

interface Step0HomeProps {
  destinationInput: string;
  setDestinationInput: (val: string) => void;
  pickupTimeOption: string;
  setPickupTimeOption: (val: string) => void;
  applyTimeSelection: (opt: string) => void;
  handleServiceCardClick: (type: ServiceType, overrideDestination?: string) => void;
  goTo: (step: number) => void;
}

export const Step0Home: React.FC<Step0HomeProps> = ({
  destinationInput,
  setDestinationInput,
  pickupTimeOption,
  setPickupTimeOption,
  applyTimeSelection,
  handleServiceCardClick,
  goTo,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'rides' | 'dispatch'>('rides');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const autocompleteRef = React.useRef<HTMLFormElement>(null);
  const { t } = useTranslation();

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
  } = usePlacesAutocomplete(destinationInput);

  React.useEffect(() => {
    if (destinationInput !== input) {
       setInput(destinationInput);
    }
  }, [destinationInput]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setDestinationInput(val);
    if (!isAutocompleteOpen) setIsAutocompleteOpen(true);
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    setInput(description);
    setDestinationInput(description);
    setIsAutocompleteOpen(false);
    
    // Auto-proceed to next step
    applyTimeSelection(pickupTimeOption);
    goTo(1);

    try {
      const details = await getPlaceCoordinates(placeId);
      if (details) {
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
      setDestinationInput(saved.address);
      setIsAutocompleteOpen(false);
      applyTimeSelection(pickupTimeOption);
      goTo(1);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destinationInput.trim()) {
      applyTimeSelection(pickupTimeOption);
      goTo(1);
    }
  };

  const handleAirportClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Bucharest bounds roughly: lat 44.3 to 44.6, lng 25.9 to 26.3
          const isOutsideBucharest = latitude < 44.3 || latitude > 44.6 || longitude < 25.9 || longitude > 26.3;
          handleServiceCardClick(isOutsideBucharest ? 'intercity' : 'airport', 'Otopeni Airport');
        },
        (error) => {
          console.warn('Geolocation blocked/error, defaulting to airport', error);
          handleServiceCardClick('airport', 'Otopeni Airport');
        },
        { timeout: 5000 }
      );
    } else {
      handleServiceCardClick('airport', 'Otopeni Airport');
    }
  };

  const handleHourlyClick = () => {
    setPickupTimeOption('later');
    applyTimeSelection('later');
    handleServiceCardClick('hourly');
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-0 pb-44 space-y-4 animate-fade-in relative">
      {/* Sticky Header Area containing Search Bar and Golden Line Separation */}
      <div className="sticky top-[48px] z-30 bg-primary pt-2 pb-1 -mx-4 px-4 transition-colors">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative" ref={autocompleteRef}>
          <div className="flex items-center bg-primary/90 border border-border rounded-full py-2.5 px-4 backdrop-blur-md shadow-xl">
            <Search size={18} className="text-muted mr-3 flex-shrink-0" />
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onFocus={() => setIsAutocompleteOpen(true)}
              placeholder={t('home.whereTo', 'Where to?')}
              className="flex-1 bg-transparent text-sm sm:text-base text-content placeholder-muted font-sans focus:outline-none"
              autoComplete="off"
            />
            {loading && (
              <div className="mr-3 animate-spin text-gold-500">
                <Loader2 size={16} />
              </div>
            )}
            <div className="h-5 w-[1px] bg-white/15 mx-3" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className="flex items-center gap-1.5 pl-1 text-sm font-semibold text-gold-500 hover:text-[#E5C158] transition-colors"
              >
                <span>
                  {pickupTimeOption === 'now'
                    ? t('booking.now', 'Now')
                    : pickupTimeOption === '15min'
                      ? t('booking.15m', '15m')
                      : pickupTimeOption === '30min'
                        ? t('booking.30m', '30m')
                        : pickupTimeOption === '1hour'
                          ? t('booking.1h', '1h')
                          : t('booking.later', 'Later')}
                </span>
                <ChevronDown size={14} className="text-gold-500" />
              </button>
            </div>
          </div>

          {/* Time Selection Dropdown Options */}
          {isTimeDropdownOpen && (
            <div className="absolute right-0 top-14 z-50 w-52 bg-secondary border border-gold-500/40 rounded-2xl shadow-2xl p-2 animate-fade-in flex flex-col gap-1">
              {[
                { id: 'now', label: t('booking.nowImmediate', 'Now (Immediate)') },
                { id: '15min', label: t('booking.in15Min', 'In 15 Minutes') },
                { id: '30min', label: t('booking.in30Min', 'In 30 Minutes') },
                { id: '1hour', label: t('booking.in1Hour', 'In 1 Hour') },
                { id: 'later', label: t('booking.scheduleCustom', 'Schedule Custom') },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPickupTimeOption(opt.id);
                    applyTimeSelection(opt.id);
                    setIsTimeDropdownOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${pickupTimeOption === opt.id
                    ? 'bg-gold-500 text-black'
                    : 'text-content hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                >
                  <span>{opt.label}</span>
                  {pickupTimeOption === opt.id && <CheckCircle size={14} />}
                </button>
              ))}
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {isAutocompleteOpen && ((input && predictions.length > 0) || (input && !loading && predictions.length === 0) || ((!input || input.length < 2) && recentSearches.length > 0)) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-tertiary border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in max-h-80 overflow-y-auto">
              {/* Active Search Predictions */}
              {input && predictions.length > 0 && (
                <div className="p-2">
                  {predictions.map((prediction) => (
                    <button
                      key={prediction.placeId}
                      type="button"
                      onClick={() => handleSelectPlace(prediction.placeId, prediction.description)}
                      className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors flex items-start gap-3 group"
                    >
                      <MapPin size={18} className="text-muted group-hover:text-gold-500 mt-0.5 shrink-0 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-content truncate">{prediction.mainText}</p>
                        {prediction.secondaryText && (
                          <p className="text-xs text-muted truncate">{prediction.secondaryText}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results state */}
              {input && !loading && predictions.length === 0 && (
                <div className="p-6 text-center text-sm text-muted">
                  {t('booking.noPlaces', 'No places found for')} "{input}"
                </div>
              )}

              {/* History and Favorites */}
              {(!input || input.length < 2) && (
                <div className="p-2 space-y-4">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-4 py-2">
                        <h4 className="text-[10px] uppercase tracking-widest text-muted font-semibold">{t('booking.recent', 'Recent')}</h4>
                        <button type="button" onClick={clearRecentSearches} className="text-[10px] text-gold-500 hover:text-content transition-colors">{t('booking.clear', 'Clear')}</button>
                      </div>
                      {recentSearches.map((recent) => (
                        <button
                          key={recent.id}
                          type="button"
                          onClick={() => handleSelectSaved(recent)}
                          className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <History size={14} className="text-muted" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-content truncate">{recent.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
        <div className="w-full h-[1px] bg-gold-500/60 mt-3.5 mb-1" />
      </div>

      {/* Tab Row */}
      <div>
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab('rides')}
            className={`flex flex-col items-center justify-center font-sans text-xs sm:text-sm font-bold tracking-widest uppercase transition-all ${activeTab === 'rides' ? 'text-gold-500' : 'text-muted hover:text-content'
              }`}
          >
            <span className="pb-2">{t('home.chauffeurService', 'CHAUFFEUR SERVICE')}</span>
            <div className={`w-full h-0.5 ${activeTab === 'rides' ? 'bg-gold-500' : 'bg-transparent'}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('dispatch');
              navigate('/dispatch');
            }}
            className="flex flex-col items-center justify-center font-sans text-xs sm:text-sm font-bold tracking-widest uppercase transition-all text-muted hover:text-content"
          >
            <span className="pb-2">{t('home.dispatch', 'DISPATCH')}</span>
            <div className="w-full h-0.5 bg-transparent" />
          </button>
        </div>
        <div className="w-full h-[1px] border-b border-border" />
      </div>

      {/* Recent/Saved Locations List */}
      <div className="space-y-3 pt-2">
        {[
          { title: t('home.loc1', 'Mondrian Hotel'), subtitle: t('booking.enterLocation', 'Enter your location') },
          { title: t('home.loc2', 'DFW Private Terminal'), subtitle: t('booking.enterLocation', 'Enter your location') },
        ].map((loc, idx) => (
          <div
            key={idx}
            onClick={() => {
              setDestinationInput(loc.title);
              goTo(1);
            }}
            className="flex items-center gap-4 cursor-pointer group py-1.5"
          >
            <div className="text-gold-500 group-hover:scale-110 transition-transform flex-shrink-0">
              <Clock size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[15px] font-bold text-content group-hover:text-gold-500 transition-colors leading-snug">
                {loc.title}
              </span>
              <span className="font-sans text-[13px] text-muted font-medium leading-tight">
                {loc.subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions Section */}
      <div className="pt-3 space-y-3">
        <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
          {t('home.suggestions', 'SUGGESTIONS')}
        </h2>
        <div className="max-h-[230px] overflow-y-auto pr-1.5 grid grid-cols-1 gap-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-tertiary [&::-webkit-scrollbar-thumb]:bg-gold-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-gold-500 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Card 1: Airport transfer */}
          <div
            onClick={handleAirportClick}
            className="group relative aspect-[21/9] rounded-2xl overflow-hidden border border-border hover:border-gold-500/60 cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-end p-3.5"
          >
            <img src={airportImg} alt="Airplane hangar" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="relative z-10 font-sans text-xs sm:text-sm font-bold text-white">
              {t('home.airportTransfer', 'Airport Transfer')}
            </span>
          </div>

          {/* Card 2: Private chauffeur */}
          <div
            onClick={() => handleServiceCardClick('private-chauffeur')}
            className="group relative aspect-[21/9] rounded-2xl overflow-hidden border border-border hover:border-gold-500/60 cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-end p-3.5"
          >
            <img src={hourlyImg} alt="Private chauffeur" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="relative z-10 font-sans text-xs sm:text-sm font-bold text-white">
              {t('home.privateChauffeur', 'Private Chauffeur')}
            </span>
          </div>

          {/* Card 3: Outside City (Intercity) */}
          <div
            onClick={() => handleServiceCardClick('intercity')}
            className="group relative aspect-[21/9] rounded-2xl overflow-hidden border border-border hover:border-gold-500/60 cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-end p-3.5"
          >
            <img src={intercityImg} alt="Car on the bridge" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="relative z-10 font-sans text-xs sm:text-sm font-bold text-content">
              {t('home.outsideCity', 'Outside City')}
            </span>
          </div>

          {/* Card 4: Hourly Chauffeur */}
          <div
            onClick={handleHourlyClick}
            className="group relative aspect-[21/9] rounded-2xl overflow-hidden border border-border hover:border-gold-500/60 cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-end p-3.5"
          >
            <img src={heroImg} alt="Chauffeur fleet" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="relative z-10 font-sans text-xs sm:text-sm font-bold text-content">
              {t('home.hourlyChauffeur', 'Hourly Chauffeur')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
