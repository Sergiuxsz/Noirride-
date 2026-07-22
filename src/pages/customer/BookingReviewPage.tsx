import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldAlert, Lock, User, Mail, Phone } from 'lucide-react';
import { PriceSummary } from '../../components/booking/PriceSummary';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useBooking } from '../../hooks/useBooking';

export const BookingReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookingState, calculatePrice, confirmBooking, vehicles } = useBooking();

  const [customerName, setCustomerName] = useState('Victoria Kensington');
  const [customerEmail, setCustomerEmail] = useState('v.kensington@kensington-capital.com');
  const [customerPhone, setCustomerPhone] = useState('+1 (555) 234-5678');
  const [specialRequests, setSpecialRequests] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === bookingState.selectedVehicleId) || vehicles[3];
  const priceBreakdown = calculatePrice(selectedVehicle.id);

  // Incomplete booking state check
  const isIncomplete = !bookingState.pickupLocation || !bookingState.destination || !bookingState.date;

  if (isIncomplete) {
    return (
      <div className="container-custom max-w-2xl pt-12">
        <EmptyState
          icon={<ShieldAlert size={36} className="text-amber-400" />}
          title="Incomplete Transfer Dossier"
          description="Your pickup location or itinerary details are currently incomplete. Please return to step 1 to configure your executive route."
          actionLabel="Return to Schedule Screen"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.name = 'Full executive name is required';
    if (!customerEmail.trim() || !customerEmail.includes('@')) errs.email = 'Valid corporate email required';
    if (!customerPhone.trim() || customerPhone.length < 7) errs.phone = 'Valid direct phone required for chauffeur SMS';
    return errs;
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      await confirmBooking({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        specialRequests,
      });
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/trip-details');
      }, 1500);
    } catch {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center container-custom">
        <LoadingState message="Dispatching reservation to secure chauffeur network..." />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center container-custom animate-fade-in">
        <div className="p-8 rounded-2xl bg-secondary border border-gold-500 max-w-md text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-content">
            Transfer Protocol Confirmed
          </h2>
          <p className="text-sm text-muted">
            Your executive dossier has been locked and assigned to our top-tier chauffeur. Redirecting to live trip telemetry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16 animate-fade-in">
      <div className="container-custom max-w-4xl pt-8 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <button
              onClick={() => navigate('/select-vehicle')}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-gold-500 mb-2 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Fleet Selection
            </button>
            <span className="block text-xs uppercase tracking-widest text-gold-500 font-semibold">
              Step 3 of 3
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-content">
              Review & Finalize Dossier
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted bg-white/5 px-3 py-1.5 rounded-xl border border-border">
            <Lock size={14} className="text-gold-500" /> 256-Bit Encrypted Protocol
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer Details & Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleConfirm} className="p-6 rounded-2xl bg-secondary border border-border space-y-5">
              <h3 className="font-serif text-lg font-bold text-content border-b border-border pb-3">
                Passenger Credentials
              </h3>

              <Input
                label="Full Executive Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                error={errors.name}
                leftIcon={<User size={16} />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Corporate Email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  error={errors.email}
                  leftIcon={<Mail size={16} />}
                />
                <Input
                  label="Direct SMS Contact"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  error={errors.phone}
                  leftIcon={<Phone size={16} />}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">
                  Chauffeur Instructions / Flight Code
                </label>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Flight BA 178 arriving Terminal 4. Chilled sparkling water. Silent ride preferred."
                  className="w-full bg-tertiary text-content placeholder-muted border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-gold-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  leftIcon={<Lock size={16} />}
                >
                  Confirm Executive Transfer (${priceBreakdown.total})
                </Button>
              </div>
            </form>

            <div className="p-4 rounded-xl bg-tertiary/40 border border-white/5 text-xs text-muted leading-relaxed">
              By confirming this reservation, you authorize NoirRide to lock the scheduled chauffeur dispatch. You may modify or terminate your reservation up to 2 hours prior to scheduled arrival with zero penalty.
            </div>
          </div>

          {/* Right Column: Price & Itinerary Summary */}
          <div className="lg:col-span-5">
            <PriceSummary
              bookingState={bookingState}
              vehicle={selectedVehicle}
              priceBreakdown={priceBreakdown}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
