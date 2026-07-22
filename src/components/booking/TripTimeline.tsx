import React from 'react';
import { CheckCircle2, Clock, Navigation, MapPin, Flag } from 'lucide-react';
import type { RideStatus } from '../../types';
import { useTranslation } from 'react-i18next';

interface TripTimelineProps {
  status: RideStatus;
  etaMinutes?: number;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({
  status,
  etaMinutes = 8,
}) => {
  const { t } = useTranslation();
  
  const steps = [
    { key: 'SCHEDULED', label: t('trip.status.scheduled', 'Reservation Confirmed'), desc: t('trip.status.scheduledDesc', 'Chauffeur protocol locked'), icon: <CheckCircle2 size={16} /> },
    { key: 'EN_ROUTE', label: t('trip.status.enRoute', 'Chauffeur En Route'), desc: `${t('trip.status.arrivingIn', 'Driver is arriving in')} ${etaMinutes} ${t('common.min', 'min')}`, icon: <Navigation size={16} /> },
    { key: 'ARRIVED', label: t('trip.status.arrived', 'Driver Arrived at Curbside'), desc: t('trip.status.arrivedDesc', 'Complimentary 60-min wait active'), icon: <MapPin size={16} /> },
    { key: 'IN_PROGRESS', label: t('trip.status.inProgress', 'Executive Transfer Active'), desc: t('trip.status.inProgressDesc', 'En route to destination'), icon: <Clock size={16} /> },
    { key: 'COMPLETED', label: t('trip.status.completed', 'Transfer Completed'), desc: t('trip.status.completedDesc', 'Arrived at destination safely'), icon: <Flag size={16} /> },
  ];

  const getStatusIndex = (s: RideStatus) => {
    if (s === 'CANCELLED') return -1;
    const idx = steps.findIndex((step) => step.key === s);
    return idx === -1 ? 1 : idx; // Default to EN_ROUTE if mismatch
  };

  const currentIndex = getStatusIndex(status);

  if (status === 'CANCELLED') {
    return (
      <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
        <span className="font-serif text-sm font-semibold text-red-400 uppercase tracking-wider">
          {t('trip.reservationCancelled', 'Reservation Cancelled')}
        </span>
        <p className="text-xs text-muted mt-1">
          {t('trip.cancellationNoFee', 'This dispatch order has been terminated. No cancellation fees incurred.')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-secondary border border-border space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h4 className="font-serif text-sm uppercase tracking-widest text-gold-500">
          {t('trip.liveTelemetry', 'Live Dispatch Telemetry')}
        </h4>
        {status === 'EN_ROUTE' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {t('trip.arrivingIn', 'Arriving in')} {etaMinutes} {t('common.min', 'min')}
          </span>
        )}
      </div>

      <div className="relative pl-6 space-y-6">
        {/* Vertical line */}
        <div className="absolute left-2.5 top-2 bottom-4 w-0.5 bg-black/10 dark:bg-white/10" />

        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="relative flex items-start gap-4">
              {/* Dot marker */}
              <div
                className={`absolute -left-6 flex items-center justify-center w-5 h-5 rounded-full z-10 transition-colors ${
                  isDone
                    ? 'bg-gold-500 text-black'
                    : isCurrent
                    ? 'bg-emerald-400 text-black ring-4 ring-emerald-400/20 animate-pulse'
                    : 'bg-tertiary text-muted border border-border'
                }`}
              >
                {step.icon}
              </div>

              {/* Step info */}
              <div>
                <span
                  className={`block text-sm font-semibold ${
                    isCurrent
                      ? 'text-emerald-400'
                      : isDone
                      ? 'text-content'
                      : 'text-muted'
                  }`}
                >
                  {step.label}
                </span>
                <span className="block text-xs text-muted mt-0.5">
                  {step.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
