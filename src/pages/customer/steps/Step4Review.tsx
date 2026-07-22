import React from 'react';
import { ArrowLeft, Lock, User, Mail, Phone } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { PriceSummary } from '../../../components/booking/PriceSummary';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <div className="container-custom max-w-4xl pt-4 animate-fade-in">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-gold-500 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> {t('booking.backToFleet', 'Back to Fleet Selection')}
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-content">{t('booking.reviewBooking', 'Review & Finalize')}</h2>
          <p className="text-sm text-muted mt-1">{t('booking.confirm_details', 'Confirm your details and lock in the reservation.')}</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted bg-white/5 px-3 py-1.5 rounded-xl border border-border">
          <Lock size={14} className="text-gold-500" /> {t('booking.encrypted', 'Encrypted')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Credentials Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleStep4Confirm} className="p-6 rounded-2xl bg-secondary border border-border flex flex-col gap-5">
            <h3 className="font-serif text-lg font-bold text-content border-b border-border pb-3">
              {t('booking.passengerCredentials', 'Passenger Credentials')}
            </h3>

            <Input
              label={t('booking.fullName', 'Full Name')}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              error={errors.name}
              leftIcon={<User size={16} />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('booking.email', 'Email')}
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                error={errors.email}
                leftIcon={<Mail size={16} />}
              />
              <Input
                label={t('booking.phone', 'Phone')}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                error={errors.phone}
                leftIcon={<Phone size={16} />}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted">
                {t('booking.specialRequests', 'Special Requests / Flight Code')}
              </label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder={t('booking.specialRequestsPlaceholder', 'e.g. Flight BA 178, Terminal 4. Silent ride preferred.')}
                className="w-full bg-tertiary text-content placeholder-muted border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-gold-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted flex items-center justify-between">
                <span>{t('booking.securePayment', 'Secure Payment')}</span>
                <span className="text-[10px] text-gold-500">{t('booking.poweredByStripe', 'Powered by Stripe')}</span>
              </label>
              <div className="w-full bg-tertiary border border-border rounded-lg p-3 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center">
                    <div className="w-4 h-4 bg-white/20 rounded-full" />
                    <div className="w-4 h-4 bg-white/20 rounded-full -ml-2 mix-blend-screen" />
                  </div>
                  <span className="text-sm text-muted tracking-widest">•••• •••• •••• 4242</span>
                </div>
                <div className="text-xs text-muted">12/28</div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button type="submit" size="lg" className="w-full" leftIcon={<Lock size={16} />}>
                {t('booking.confirm', 'Confirm Executive Transfer')} (${priceBreakdown.total})
              </Button>
            </div>
          </form>

          <div className="mt-4 p-4 rounded-xl bg-tertiary/40 border border-white/5 text-xs text-muted leading-relaxed">
            {t('booking.disclaimer', 'By confirming, you authorize NoirRide to lock the scheduled chauffeur dispatch. Free cancellation up to 2 hours prior.')}
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
