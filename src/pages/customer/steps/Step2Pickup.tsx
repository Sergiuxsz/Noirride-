import React from 'react';
import { ArrowLeft, MapPin, Navigation, Minus, Plus, Users } from 'lucide-react';
import { AddressAutocomplete } from '../../../components/booking/AddressAutocomplete';
import type { BookingFormState } from '../../../types';

interface Step2PickupProps {
  bookingState: BookingFormState;
  updateField: (field: keyof BookingFormState, value: any) => void;
  destinationInput: string;
  pickupInput: string;
  setPickupInput: (val: string) => void;
  passengers: number;
  setPassengers: (val: number) => void;
  errors: Record<string, string>;
  handleStep2Submit: (e: React.FormEvent) => void;
  goBack: () => void;
}

export const Step2Pickup: React.FC<Step2PickupProps> = ({
  bookingState,
  updateField,
  destinationInput,
  pickupInput,
  setPickupInput,
  passengers,
  setPassengers,
  errors,
  handleStep2Submit,
  goBack,
}) => {
  return (
    <div className="container-custom max-w-xl pt-4 animate-fade-in">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#D4AF37] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="space-y-2 mb-8">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#F8FAFC]">Where should we pick you up?</h2>
        <p className="text-sm text-[#94A3B8]">Provide the exact pickup location and number of passengers.</p>
      </div>

      {/* Route summary badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#12141C] border border-white/10 text-xs text-[#E2E8F0] mb-6">
        <Navigation size={14} className="text-[#D4AF37] flex-shrink-0" />
        <span className="truncate">
          Heading to: <strong className="text-[#F8FAFC]">{bookingState.destination || destinationInput}</strong>
        </span>
      </div>

      <form onSubmit={handleStep2Submit} className="flex flex-col gap-6">
        <AddressAutocomplete
          value={pickupInput}
          onChange={setPickupInput}
          onSelectCoordinates={(lat, lng) => updateField('pickupCoordinates', { lat, lng })}
          placeholder="Pickup hotel, airport, or residence..."
          icon={<MapPin className="text-[#D4AF37] flex-shrink-0 z-10" size={20} />}
          error={errors.pickup}
        />
        <button
          type="submit"
          className="bg-[#D4AF37] hover:bg-[#C5A030] text-[#0A0B0E] px-6 py-3.5 rounded-xl font-serif text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#D4AF37]/10 w-full"
        >
          Select Fleet
        </button>

        {/* Passengers stepper */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold">Passengers</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPassengers(Math.max(1, passengers - 1))}
              className="w-10 h-10 rounded-xl bg-[#12141C] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#D4AF37] transition-colors"
            >
              <Minus size={16} />
            </button>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#D4AF37]" />
              <span className="font-serif text-xl font-bold text-[#F8FAFC] w-6 text-center">{passengers}</span>
            </div>
            <button
              type="button"
              onClick={() => setPassengers(Math.min(7, passengers + 1))}
              className="w-10 h-10 rounded-xl bg-[#12141C] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#D4AF37] transition-colors"
            >
              <Plus size={16} />
            </button>
            <span className="text-xs text-[#64748B]">passenger{passengers !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </form>
    </div>
  );
};
