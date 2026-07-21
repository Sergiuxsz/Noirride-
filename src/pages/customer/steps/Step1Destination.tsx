import React from 'react';
import { ArrowLeft, Plane, Compass, ShieldCheck } from 'lucide-react';
import { AddressAutocomplete } from '../../../components/booking/AddressAutocomplete';
import type { BookingFormState, ServiceType } from '../../../types';

interface Step1DestinationProps {
  destinationInput: string;
  setDestinationInput: (val: string) => void;
  pickupTimeOption: string;
  setPickupTimeOption: (val: string) => void;
  applyTimeSelection: (opt: string) => void;
  customDate: string;
  setCustomDate: (val: string) => void;
  customTime: string;
  setCustomTime: (val: string) => void;
  bookingState: BookingFormState;
  updateField: (field: keyof BookingFormState, value: any) => void;
  errors: Record<string, string>;
  handleStep1Submit: (e: React.FormEvent) => void;
  goBack: () => void;
}

export const Step1Destination: React.FC<Step1DestinationProps> = ({
  destinationInput,
  setDestinationInput,
  pickupTimeOption,
  setPickupTimeOption,
  applyTimeSelection,
  customDate,
  setCustomDate,
  customTime,
  setCustomTime,
  bookingState,
  updateField,
  errors,
  handleStep1Submit,
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
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#F8FAFC]">Where are you heading?</h2>
        <p className="text-sm text-[#94A3B8]">Enter your destination and select when you'd like to be picked up.</p>
      </div>

      <form onSubmit={handleStep1Submit} className="flex flex-col gap-6">
        <AddressAutocomplete
          value={destinationInput}
          onChange={setDestinationInput}
          onSelectCoordinates={(lat, lng) => updateField('destinationCoordinates', { lat, lng })}
          placeholder="Airport, hotel, or address..."
          showTimeSelect
          timeOption={pickupTimeOption}
          onChangeTimeOption={(opt) => {
            setPickupTimeOption(opt);
            applyTimeSelection(opt);
          }}
          error={errors.destination}
        />
        
        <button
          type="submit"
          className="bg-[#D4AF37] hover:bg-[#C5A030] text-[#0A0B0E] px-6 py-3.5 rounded-xl font-serif text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#D4AF37]/10 w-full"
        >
          Continue
        </button>

        {pickupTimeOption === 'later' && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#12141C] border border-white/10 animate-fade-in">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#94A3B8] mb-1.5 font-semibold">Date</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  updateField('date', e.target.value);
                }}
                className="w-full bg-[#1A1D28] border border-white/10 rounded-lg p-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#94A3B8] mb-1.5 font-semibold">Time</label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  updateField('time', e.target.value);
                }}
                className="w-full bg-[#1A1D28] border border-white/10 rounded-lg p-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        )}

        {/* Service Type Pills */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold">Service Type</span>
          <div className="flex gap-2">
            {([
              { key: 'airport' as ServiceType, icon: <Plane size={14} />, label: 'Airport' },
              { key: 'hourly' as ServiceType, icon: <Compass size={14} />, label: 'Hourly' },
              { key: 'intercity' as ServiceType, icon: <ShieldCheck size={14} />, label: 'Intercity' },
            ]).map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => updateField('serviceType', key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  bookingState.serviceType === key
                    ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/50'
                    : 'bg-[#12141C] text-[#94A3B8] border-white/10 hover:border-white/25 hover:text-[#F8FAFC]'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
