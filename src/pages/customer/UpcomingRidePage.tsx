import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { TripTimeline } from '../../components/booking/TripTimeline';
import { DriverCard } from '../../components/booking/DriverCard';
import { ClientLiveMap } from '../../components/booking/ClientLiveMap';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRideContext } from '../../context/RideContext';
import { useTranslation } from 'react-i18next';
import type { RideStatus } from '../../types';

export const UpcomingRidePage: React.FC = () => {
  const navigate = useNavigate();
  const { confirmedRide, cancelConfirmedRide, updateRideStatus } = useRideContext();
  const { t } = useTranslation();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const activeTrip = confirmedRide;

  const [etaSeconds, setEtaSeconds] = useState<number>(() => {
    return activeTrip?.currentEta ?? activeTrip?.etaSeconds ?? activeTrip?.pickupEtaSeconds ?? 300;
  });

  React.useEffect(() => {
    if (activeTrip) {
      const initial = activeTrip.currentEta ?? activeTrip.etaSeconds ?? activeTrip.pickupEtaSeconds;
      if (typeof initial === 'number' && initial > 0) {
        setEtaSeconds(initial);
      }
    }
  }, [activeTrip?.id, activeTrip?.currentEta, activeTrip?.etaSeconds]);

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

  const mapTelemetryStatus = (status: string): RideStatus => {
    switch (status) {
      case 'driver_en_route':
        return 'EN_ROUTE';
      case 'driver_arrived':
        return 'ARRIVED';
      case 'in_progress':
        return 'IN_PROGRESS';
      case 'completed':
        return 'COMPLETED';
      default:
        return 'EN_ROUTE';
    }
  };

  const handleTelemetryUpdate = (status: string, currentEtaSeconds: number) => {
    if (!activeTrip || ['CANCELLED', 'COMPLETED'].includes(activeTrip.status)) return;
    
    const mappedStatus = mapTelemetryStatus(status);
    if (typeof currentEtaSeconds === 'number' && !isNaN(currentEtaSeconds) && currentEtaSeconds > 0) {
      setEtaSeconds(currentEtaSeconds);
    }

    if (mappedStatus !== activeTrip.status) {
      updateRideStatus(activeTrip.id, mappedStatus);
    }
  };

  const handleConfirmCancel = () => {
    cancelConfirmedRide();
    setIsCancelModalOpen(false);
  };

  const getBannerDetails = () => {
    switch (activeTrip.status) {
      case 'EN_ROUTE':
        return {
          title: `Chauffeur ${activeTrip.driverName || 'Executive Chauffeur'} is arriving in ${Math.ceil(etaSeconds / 60)} min`,
          description: `Vehicle GPS tracking confirmed on route to ${activeTrip.pickupLocation.split(',')[0]}.`,
          color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dotColor: 'bg-emerald-400'
        };
      case 'ARRIVED':
        return {
          title: `Chauffeur ${activeTrip.driverName || 'Executive Chauffeur'} has arrived!`,
          description: `Your chauffeur is waiting at the pickup location: ${activeTrip.pickupLocation.split(',')[0]}.`,
          color: 'bg-[#D4AF37]/10 border-gold-500/30 text-gold-500',
          dotColor: 'bg-[#D4AF37]'
        };
      case 'IN_PROGRESS':
        return {
          title: `Active luxury transfer in progress`,
          description: `Arriving at destination in ${Math.ceil(etaSeconds / 60)} min. Enjoy the ride.`,
          color: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          dotColor: 'bg-blue-400'
        };
      case 'COMPLETED':
        return {
          title: `Luxury transfer completed`,
          description: `Thank you for choosing NoirRide. Your receipt has been sent.`,
          color: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400',
          dotColor: 'bg-zinc-400'
        };
      default:
        return {
          title: `Chauffeur ${activeTrip.driverName || 'Executive Chauffeur'} is assigned`,
          description: `GPS tracking will activate shortly.`,
          color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dotColor: 'bg-emerald-400'
        };
    }
  };

  const banner = getBannerDetails();
  const isCancelled = activeTrip.status === 'CANCELLED';

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16 animate-fade-in">
      <div className="container-custom max-w-4xl pt-8 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-gold-500">
              Dossier Ref: {activeTrip.id}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-content">
              {t('trip.liveTelemetry', 'Live Chauffeur Telemetry')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {!isCancelled && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
              >
                {t('trip.terminate', 'Terminate Reservation')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dispatch')}
            >
              {t('trip.operator', 'Operator View')}
            </Button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {!isCancelled ? (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-pulse-subtle ${banner.color}`}>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full animate-ping ${banner.dotColor}`} />
              <div>
                <span className="font-serif font-bold text-sm block">
                  {banner.title}
                </span>
                <span className="text-xs opacity-80">
                  {banner.description}
                </span>
              </div>
            </div>
            <span className="font-mono text-xs text-gold-500 bg-secondary px-3 py-1 rounded border border-border hidden sm:inline">
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
            <div className="p-6 rounded-2xl bg-secondary border border-border space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-serif uppercase tracking-widest text-gold-500">
                  Route Specification
                </span>
                <span className="text-xs text-muted uppercase">
                  {activeTrip.serviceType} Service
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-white/5 text-gold-500 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase text-muted">Pickup Address</span>
                    <span className="font-medium text-content">{activeTrip.pickupLocation}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-white/5 text-gold-500 mt-0.5">
                    <Navigation size={16} />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase text-muted">Destination Address</span>
                    <span className="font-medium text-content">{activeTrip.destination}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border text-xs">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-gold-500" />
                  <span>{activeTrip.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-gold-500" />
                  <span>Scheduled: {activeTrip.time}</span>
                </div>
              </div>
            </div>

              {/* Client Live Telemetry Map (SSOT) */}
              <div className="h-[300px] sm:h-[400px] w-full bg-[#0A0B10]">
                <ClientLiveMap
                  rideId={activeTrip.id}
                  vehicleId={activeTrip.vehicleId}
                  vehicleName={activeTrip.vehicleName}
                  pickupLocation={activeTrip.pickupLocation}
                  destination={activeTrip.destination}
                  onTelemetryUpdate={handleTelemetryUpdate}
                />
              </div>

            {/* Timeline */}
            <TripTimeline status={activeTrip.status} etaMinutes={Math.max(1, Math.ceil(etaSeconds / 60))} />
          </div>

          {/* Right Column: Driver & Vehicle Card */}
          <div className="md:col-span-5 space-y-6">
            <DriverCard
              driverName={activeTrip.driverName}
              driverId={activeTrip.driverId}
              vehicleName={activeTrip.vehicleName}
            />

            {/* Fare confirmation box */}
            <div className="p-6 rounded-2xl bg-secondary border border-border space-y-3">
              <span className="text-[11px] uppercase tracking-widest text-muted">
                Payment Security Dossier
              </span>
              <div className="flex items-center justify-between">
                <span className="font-serif text-base font-bold text-content">Guaranteed Total Fare</span>
                <span className="font-serif text-2xl font-bold text-gold-500">${activeTrip.price}</span>
              </div>
              <p className="text-xs text-muted pt-2 border-t border-border">
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
          <p className="text-sm text-content">
            Are you certain you wish to release chauffeur <strong>{activeTrip.driverName}</strong> and vehicle <strong>{activeTrip.vehicleName}</strong>?
          </p>
        </div>
      </Modal>
    </div>
  );
};
