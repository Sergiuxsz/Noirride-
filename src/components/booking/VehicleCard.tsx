import React, { useState } from 'react';
import { Users, Briefcase, Check, Car } from 'lucide-react';
import type { Vehicle } from '../../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  selected: boolean;
  onSelect: () => void;
  calculatedPrice: number;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  selected,
  onSelect,
  calculatedPrice,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col md:flex-row items-center justify-between p-5 md:p-6 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-md ${
        selected
          ? 'bg-[#1A1D28]/80 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)] translate-y-[-2px]'
          : 'bg-[#12141C]/60 border-white/10 hover:border-white/30 hover:bg-[#151822]/80 hover:shadow-lg'
      }`}
    >
      {selected && (
        <div className="absolute top-4 right-4 bg-[#D4AF37] text-[#0A0B0E] p-1.5 rounded-full shadow-md z-10">
          <Check size={16} strokeWidth={3} />
        </div>
      )}

      {/* Vehicle Image / Fallback */}
      <div className="w-full md:w-56 h-36 flex items-center justify-center rounded-xl overflow-hidden bg-[#0A0B0E]/60 border border-white/5 mb-4 md:mb-0 md:mr-6 flex-shrink-0">
        {!imageError ? (
          <img
            src={vehicle.image}
            alt={vehicle.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center text-[#94A3B8]">
            <Car size={36} className="text-[#D4AF37] mb-2" />
            <span className="text-xs font-serif font-medium">{vehicle.category}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 space-y-2 pr-0 md:pr-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold">
            {vehicle.category}
          </span>
        </div>
        <h3 className="font-serif text-lg md:text-xl font-bold text-[#F8FAFC] tracking-wide">
          {vehicle.name}
        </h3>
        <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed line-clamp-2">
          {vehicle.description}
        </p>

        {/* Capacity & Amenities */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#E2E8F0]">
          <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
            <Users size={14} className="text-[#D4AF37]" />
            Max {vehicle.passengerCapacity} Pax
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
            <Briefcase size={14} className="text-[#D4AF37]" />
            {vehicle.luggageCapacity} Bags
          </span>
          <span className="hidden sm:inline text-xs text-[#94A3B8]">
            • {vehicle.features[0]}
          </span>
        </div>
      </div>

      {/* Price CTA */}
      <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between md:justify-center mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/10 flex-shrink-0">
        <div className="text-left md:text-right">
          <span className="block text-[10px] uppercase tracking-widest text-[#94A3B8]">Estimated Fare</span>
          <span className="font-serif text-2xl md:text-3xl font-bold text-[#F8FAFC]">
            ${calculatedPrice}
          </span>
        </div>
        <span
          className={`mt-0 md:mt-3 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
            selected
              ? 'bg-[#D4AF37] text-[#0A0B0E]'
              : 'bg-white/10 text-[#F8FAFC] hover:bg-white/20'
          }`}
        >
          {selected ? 'Selected' : 'Select Class'}
        </span>
      </div>
    </div>
  );
};
