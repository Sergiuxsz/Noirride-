import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { TripTimeline } from '../../components/booking/TripTimeline';
import { DriverCard } from '../../components/booking/DriverCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRideContext } from '../../context/RideContext';

export const UpcomingRidePage: React.FC = () => {
  const navigate = useNavigate();
  const { confirmedRide, cancelConfirmedRide } = useRideContext();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Check if there is an active confirmed ride in context
  const activeTrip = confirmedRide;

  const handleConfirmCancel = () => {
    cancelConfirmedRide();
    setIsCancelModalOpen(false);
  };

  if (!activeTrip) {
    return (
      <div className="container-custom max-w-2xl pt-16">
        <EmptyState
          title="No Active Transfer Telemetry"
          description="You currently do not have any confirmed chauffeur reservations. Schedule a new luxury transfer to activate live dispatch telemetry."
          actionLabel="Book a New Transfer"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  const isCancelled = activeTrip.status === 'CANCELLED';

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16 animate-fade-in">
      <div className="container-custom max-w-4xl pt-8 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#D4AF37]">
              Dossier Ref: {activeTrip.id}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
              Live Chauffeur Telemetry
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {!isCancelled && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
              >
                Terminate Reservation
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dispatch')}
            >
              Operator View
            </Button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {!isCancelled ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-pulse-subtle">
            <div className="flex items-center gap-3 text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="font-serif font-bold text-sm block">
                  Chauffeur {activeTrip.driverName} is arriving in 8 min
                </span>
                <span className="text-xs text-[#94A3B8]">
                  Vehicle GPS tracking confirmed on route to {activeTrip.pickupLocation.split(',')[0]}.
                </span>
              </div>
            </div>
            <span className="font-mono text-xs text-[#D4AF37] bg-[#12141C] px-3 py-1 rounded border border-white/10 hidden sm:inline">
              LIVE 5G PROTOCOL
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            Reservation Ref {activeTrip.id} has been cancelled. No cancellation fees were charged.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Route Summary & Timeline */}
          <div className="md:col-span-7 space-y-6">
            {/* Route Summary Card */}
            <div className="p-6 rounded-2xl bg-[#12141C] border border-white/10 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-serif uppercase tracking-widest text-[#D4AF37]">
                  Route Specification
                </span>
                <span className="text-xs text-[#94A3B8] uppercase">
                  {activeTrip.serviceType} Service
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-white/5 text-[#D4AF37] mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase text-[#94A3B8]">Pickup Address</span>
                    <span className="font-medium text-[#F8FAFC]">{activeTrip.pickupLocation}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-white/5 text-[#D4AF37] mt-0.5">
                    <Navigation size={16} />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase text-[#94A3B8]">Destination Address</span>
                    <span className="font-medium text-[#F8FAFC]">{activeTrip.destination}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-[#D4AF37]" />
                  <span>{activeTrip.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-[#D4AF37]" />
                  <span>Scheduled: {activeTrip.time}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <TripTimeline status={activeTrip.status} etaMinutes={8} />
          </div>

          {/* Right Column: Driver & Vehicle Card */}
          <div className="md:col-span-5 space-y-6">
            <DriverCard
              driverName={activeTrip.driverName}
              driverId={activeTrip.driverId}
              vehicleName={activeTrip.vehicleName}
            />

            {/* Fare confirmation box */}
            <div className="p-6 rounded-2xl bg-[#12141C] border border-white/10 space-y-3">
              <span className="text-[11px] uppercase tracking-widest text-[#94A3B8]">
                Payment Security Dossier
              </span>
              <div className="flex items-center justify-between">
                <span className="font-serif text-base font-bold text-[#F8FAFC]">Guaranteed Total Fare</span>
                <span className="font-serif text-2xl font-bold text-[#D4AF37]">${activeTrip.price}</span>
              </div>
              <p className="text-xs text-[#94A3B8] pt-2 border-t border-white/10">
                Authorized on corporate account for {activeTrip.customerName}. Automated tax invoice sent to {activeTrip.customerEmail}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Cancelling */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Termination of Reservation"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Keep Reservation Active
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmCancel}>
              Terminate & Cancel Ride
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-400 text-xs">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <span>
              You are about to cancel Chauffeur protocol {activeTrip.id}. Because you are canceling within our complimentary grace window, <strong>$0 cancellation fees</strong> will apply.
            </span>
          </div>
          <p className="text-sm text-[#F8FAFC]">
            Are you certain you wish to release chauffeur <strong>{activeTrip.driverName}</strong> and vehicle <strong>{activeTrip.vehicleName}</strong>?
          </p>
        </div>
      </Modal>
    </div>
  );
};
