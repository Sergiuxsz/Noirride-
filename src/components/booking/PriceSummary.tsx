import React from 'react';
import { MapPin, Navigation, Calendar, Users, Shield, Award } from 'lucide-react';
import type { BookingFormState, Vehicle } from '../../types';

interface PriceSummaryProps {
  bookingState: BookingFormState;
  vehicle: Vehicle;
  priceBreakdown: { base: number; serviceFee: number; tax: number; total: number };
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  bookingState,
  vehicle,
  priceBreakdown,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-[#12141C] border border-white/15 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
            Service Dossier
          </span>
          <h3 className="font-serif text-lg font-bold text-[#F8FAFC]">Executive Dispatch Summary</h3>
        </div>
        <div className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold uppercase">
          {bookingState.serviceType}
        </div>
      </div>

      {/* Itinerary */}
      <div className="space-y-3.5 text-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-white/5 text-[#D4AF37] mt-0.5">
            <MapPin size={16} />
          </div>
          <div>
            <span className="block text-xs uppercase text-[#94A3B8]">Pickup Address</span>
            <span className="font-medium text-[#F8FAFC]">{bookingState.pickupLocation}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-white/5 text-[#D4AF37] mt-0.5">
            <Navigation size={16} />
          </div>
          <div>
            <span className="block text-xs uppercase text-[#94A3B8]">Destination</span>
            <span className="font-medium text-[#F8FAFC]">{bookingState.destination}</span>
          </div>
        </div>
      </div>

      {/* Date & Vehicle Info */}
      <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/10 text-xs">
        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-[#D4AF37]" />
          <div>
            <span className="block text-[#94A3B8]">Date & Time</span>
            <span className="font-semibold text-[#F8FAFC]">{bookingState.date} • {bookingState.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Users size={16} className="text-[#D4AF37]" />
          <div>
            <span className="block text-[#94A3B8]">Party Size</span>
            <span className="font-semibold text-[#F8FAFC]">{bookingState.passengers} Passengers</span>
          </div>
        </div>
      </div>

      {/* Selected Vehicle Card Mini */}
      <div className="p-3.5 rounded-xl bg-[#1A1D28]/60 border border-white/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]">{vehicle.category}</span>
          <p className="font-serif text-sm font-bold text-[#F8FAFC]">{vehicle.name}</p>
          <p className="text-xs text-[#94A3B8]">{vehicle.makeModel}</p>
        </div>
        <Award className="text-[#D4AF37]" size={24} />
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2.5 pt-2 text-sm">
        <div className="flex justify-between text-[#94A3B8]">
          <span>Chauffeur & Vehicle Base Fare</span>
          <span className="text-[#F8FAFC] font-medium">${priceBreakdown.base}</span>
        </div>
        <div className="flex justify-between text-[#94A3B8]">
          <span>White-Glove Service & Wait Protocol (12%)</span>
          <span className="text-[#F8FAFC] font-medium">${priceBreakdown.serviceFee}</span>
        </div>
        <div className="flex justify-between text-[#94A3B8]">
          <span>Taxes & Airport Surcharge</span>
          <span className="text-[#F8FAFC] font-medium">${priceBreakdown.tax}</span>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-white/15">
          <div>
            <span className="font-serif text-base font-bold text-[#F8FAFC]">Total Guaranteed Fare</span>
            <span className="block text-[11px] text-[#94A3B8]">All tolls, gratuity & insurance included</span>
          </div>
          <span className="font-serif text-3xl font-bold text-[#D4AF37]">${priceBreakdown.total}</span>
        </div>
      </div>

      {/* Guarantee badge */}
      <div className="flex items-center gap-2 text-xs text-[#94A3B8] pt-2">
        <Shield size={16} className="text-emerald-400 flex-shrink-0" />
        <span>Complimentary cancellation up to 2 hours prior to scheduled pickup.</span>
      </div>
    </div>
  );
};
