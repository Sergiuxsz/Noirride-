import React from 'react';
import { CheckCircle2, Clock, Navigation, MapPin, Flag } from 'lucide-react';
import type { RideStatus } from '../../types';

interface TripTimelineProps {
  status: RideStatus;
  etaMinutes?: number;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({
  status,
  etaMinutes = 8,
}) => {
  const steps = [
    { key: 'SCHEDULED', label: 'Reservation Confirmed', desc: 'Chauffeur protocol locked', icon: <CheckCircle2 size={16} /> },
    { key: 'EN_ROUTE', label: 'Chauffeur En Route', desc: `Driver is arriving in ${etaMinutes} min`, icon: <Navigation size={16} /> },
    { key: 'ARRIVED', label: 'Driver Arrived at Curbside', desc: 'Complimentary 60-min wait active', icon: <MapPin size={16} /> },
    { key: 'IN_PROGRESS', label: 'Executive Transfer Active', desc: 'En route to destination', icon: <Clock size={16} /> },
    { key: 'COMPLETED', label: 'Transfer Completed', desc: 'Arrived at destination safely', icon: <Flag size={16} /> },
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
          Reservation Cancelled
        </span>
        <p className="text-xs text-[#94A3B8] mt-1">
          This dispatch order has been terminated. No cancellation fees incurred.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-[#12141C] border border-white/10 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h4 className="font-serif text-sm uppercase tracking-widest text-[#D4AF37]">
          Live Dispatch Telemetry
        </h4>
        {status === 'EN_ROUTE' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Arriving in {etaMinutes} min
          </span>
        )}
      </div>

      <div className="relative pl-6 space-y-6">
        {/* Vertical line */}
        <div className="absolute left-2.5 top-2 bottom-4 w-0.5 bg-white/10" />

        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="relative flex items-start gap-4">
              {/* Dot marker */}
              <div
                className={`absolute -left-6 flex items-center justify-center w-5 h-5 rounded-full z-10 transition-colors ${
                  isDone
                    ? 'bg-[#D4AF37] text-[#0A0B0E]'
                    : isCurrent
                    ? 'bg-emerald-400 text-[#0A0B0E] ring-4 ring-emerald-400/20 animate-pulse'
                    : 'bg-[#1A1D28] text-[#64748B] border border-white/10'
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
                      ? 'text-[#F8FAFC]'
                      : 'text-[#64748B]'
                  }`}
                >
                  {step.label}
                </span>
                <span className="block text-xs text-[#94A3B8] mt-0.5">
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
