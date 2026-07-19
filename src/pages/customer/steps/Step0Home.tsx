import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import type { ServiceType } from '../../../types';

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
  handleServiceCardClick: (type: ServiceType) => void;
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destinationInput.trim()) {
      applyTimeSelection(pickupTimeOption);
      goTo(1);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-0 pb-44 space-y-4 animate-fade-in relative">
      {/* Sticky Header Area containing Search Bar and Golden Line Separation */}
      <div className="sticky top-[48px] z-30 bg-[#0A0B0E] pt-2 pb-1 -mx-4 px-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="flex items-center bg-[#181A20]/90 border border-white/10 rounded-full py-2.5 px-4 backdrop-blur-md shadow-xl">
            <Search size={18} className="text-[#8E9BAE] mr-3 flex-shrink-0" />
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="Where to?"
              className="flex-1 bg-transparent text-sm sm:text-base text-[#F8FAFC] placeholder-[#8E9BAE] font-sans focus:outline-none"
            />
            <div className="h-5 w-[1px] bg-white/15 mx-3" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className="flex items-center gap-1.5 pl-1 text-sm font-semibold text-[#D4AF37] hover:text-[#E5C158] transition-colors"
              >
                <span>
                  {pickupTimeOption === 'now'
                    ? 'Now'
                    : pickupTimeOption === '15min'
                      ? '15m'
                      : pickupTimeOption === '30min'
                        ? '30m'
                        : pickupTimeOption === '1hour'
                          ? '1h'
                          : 'Later'}
                </span>
                <ChevronDown size={14} className="text-[#D4AF37]" />
              </button>
            </div>
          </div>

          {/* Time Selection Dropdown Options */}
          {isTimeDropdownOpen && (
            <div className="absolute right-0 top-14 z-50 w-52 bg-[#12141C] border border-[#D4AF37]/40 rounded-2xl shadow-2xl p-2 animate-fade-in flex flex-col gap-1">
              {[
                { id: 'now', label: 'Now (Immediate)' },
                { id: '15min', label: 'In 15 Minutes' },
                { id: '30min', label: 'In 30 Minutes' },
                { id: '1hour', label: 'In 1 Hour' },
                { id: 'later', label: 'Schedule Custom' },
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
                    ? 'bg-[#D4AF37] text-[#0A0B0E]'
                    : 'text-[#E2E8F0] hover:bg-white/10'
                    }`}
                >
                  <span>{opt.label}</span>
                  {pickupTimeOption === opt.id && <CheckCircle size={14} />}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Thin gold horizontal rule directly below search bar */}
        <div className="w-full h-[1px] bg-[#D4AF37]/60 mt-3.5 mb-1" />
      </div>

      {/* Tab Row */}
      <div>
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab('rides')}
            className={`flex flex-col items-center justify-center font-sans text-xs sm:text-sm font-bold tracking-widest uppercase transition-all ${activeTab === 'rides' ? 'text-[#D4AF37]' : 'text-[#64748B] hover:text-[#F8FAFC]'
              }`}
          >
            <span className="pb-2">CHAUFFEUR SERVICE</span>
            <div className={`w-full h-0.5 ${activeTab === 'rides' ? 'bg-[#D4AF37]' : 'bg-transparent'}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('dispatch');
              navigate('/dispatch');
            }}
            className="flex flex-col items-center justify-center font-sans text-xs sm:text-sm font-bold tracking-widest uppercase transition-all text-[#64748B] hover:text-[#F8FAFC]"
          >
            <span className="pb-2">DISPATCH</span>
            <div className="w-full h-0.5 bg-transparent" />
          </button>
        </div>
        <div className="w-full h-[1px] bg-white/10" />
      </div>

      {/* Recent/Saved Locations List */}
      <div className="space-y-3 pt-2">
        {[
          { title: 'Mondrian Hotel', subtitle: 'Enter your location' },
          { title: 'DFW Private Terminal', subtitle: 'Enter your location' },
        ].map((loc, idx) => (
          <div
            key={idx}
            onClick={() => {
              setDestinationInput(loc.title);
              goTo(1);
            }}
            className="flex items-center gap-4 cursor-pointer group py-1.5"
          >
            <div className="text-[#D4AF37] group-hover:scale-110 transition-transform flex-shrink-0">
              <Clock size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[15px] font-bold text-[#F8FAFC] group-hover:text-[#D4AF37] transition-colors leading-snug">
                {loc.title}
              </span>
              <span className="font-sans text-[13px] text-[#64748B] font-medium leading-tight">
                {loc.subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions Section */}
      <div className="pt-3 space-y-3">
        <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E9BAE]">
          SUGGESTIONS
        </h2>
        <div className="max-h-[230px] overflow-y-auto pr-1.5 grid grid-cols-1 gap-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-[#D4AF37]/40 hover:[&::-webkit-scrollbar-thumb]:bg-[#D4AF37] [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Card 1: Airplane hangar */}
          <div
            onClick={() => handleServiceCardClick('airport')}
            className="group relative aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/60 cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-end p-3.5"
          >
            <img src={airportImg} alt="Airplane hangar" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="relative z-10 font-sans text-xs sm:text-sm font-bold text-[#F8FAFC]">
              Airport
            </span>
          </div>

          {/* Card 2: Private chauffeur */}
          <div
            onClick={() => handleServiceCardClick('hourly')}
            className="group relative aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/60 cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-end p-3.5"
          >
            <img src={hourlyImg} alt="Private chauffeur" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="relative z-10 font-sans text-xs sm:text-sm font-bold text-[#F8FAFC]">
              Private chauffeur
            </span>
          </div>

          {/* Card 3: Car on the bridge */}
          <div
            onClick={() => handleServiceCardClick('intercity')}
            className="group relative aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/60 cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-end p-3.5"
          >
            <img src={intercityImg} alt="Car on the bridge" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="relative z-10 font-sans text-xs sm:text-sm font-bold text-[#F8FAFC]">
              Outside City
            </span>
          </div>

          {/* Card 4: Chauffeur fleet */}
          <div
            onClick={() => handleServiceCardClick('hourly')}
            className="group relative aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/60 cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-end p-3.5"
          >
            <img src={heroImg} alt="Chauffeur fleet" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="relative z-10 font-sans text-xs sm:text-sm font-bold text-[#F8FAFC]">
              Hourly Chauffeur
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
