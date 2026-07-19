import React from 'react';
import { ArrowLeft, Lock, User, Mail, Phone } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { PriceSummary } from '../../../components/booking/PriceSummary';
import type { BookingFormState, Vehicle } from '../../../types';

interface Step4ReviewProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  specialRequests: string;
  setSpecialRequests: (val: string) => void;
  bookingState: BookingFormState;
  selectedVehicle: Vehicle;
  priceBreakdown: {
    total: number;
    base: number;
    serviceFee: number;
    tax: number;
  };
  errors: Record<string, string>;
  handleStep4Confirm: (e: React.FormEvent) => void;
  goBack: () => void;
}

export const Step4Review: React.FC<Step4ReviewProps> = ({
  customerName,
  setCustomerName,
  customerEmail,
  setCustomerEmail,
  customerPhone,
  setCustomerPhone,
  specialRequests,
  setSpecialRequests,
  bookingState,
  selectedVehicle,
  priceBreakdown,
  errors,
  handleStep4Confirm,
  goBack,
}) => {
  return (
    <div className="container-custom max-w-4xl pt-4 animate-fade-in">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#D4AF37] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Fleet Selection
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#F8FAFC]">Review & Finalize</h2>
          <p className="text-sm text-[#94A3B8] mt-1">Confirm your details and lock in the reservation.</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#94A3B8] bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
          <Lock size={14} className="text-[#D4AF37]" /> Encrypted
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Credentials Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleStep4Confirm} className="p-6 rounded-2xl bg-[#12141C] border border-white/10 flex flex-col gap-5">
            <h3 className="font-serif text-lg font-bold text-[#F8FAFC] border-b border-white/10 pb-3">
              Passenger Credentials
            </h3>

            <Input
              label="Full Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              error={errors.name}
              leftIcon={<User size={16} />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                error={errors.email}
                leftIcon={<Mail size={16} />}
              />
              <Input
                label="Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                error={errors.phone}
                leftIcon={<Phone size={16} />}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                Special Requests / Flight Code
              </label>
              <textarea
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. Flight BA 178, Terminal 4. Silent ride preferred."
                className="w-full bg-[#1A1D28] text-[#F8FAFC] placeholder-[#64748B] border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button type="submit" size="lg" className="w-full" leftIcon={<Lock size={16} />}>
                Confirm Executive Transfer (${priceBreakdown.total})
              </Button>
            </div>
          </form>

          <div className="mt-4 p-4 rounded-xl bg-[#1A1D28]/40 border border-white/5 text-xs text-[#94A3B8] leading-relaxed">
            By confirming, you authorize NoirRide to lock the scheduled chauffeur dispatch. Free cancellation up to 2 hours prior.
          </div>
        </div>

        {/* Right: Price Summary */}
        <div className="lg:col-span-5">
          <PriceSummary
            bookingState={bookingState}
            vehicle={selectedVehicle}
            priceBreakdown={priceBreakdown}
          />
        </div>
      </div>
    </div>
  );
};
