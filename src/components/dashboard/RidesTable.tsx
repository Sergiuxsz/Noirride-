import React from 'react';
import { Eye, ArrowRight } from 'lucide-react';
import type { Ride } from '../../types';
import { RideStatusBadge } from './RideStatusBadge';
import { EmptyState } from '../ui/EmptyState';

interface RidesTableProps {
  rides: Ride[];
  onSelectRide: (ride: Ride) => void;
  onResetFilters?: () => void;
}

export const RidesTable: React.FC<RidesTableProps> = ({
  rides,
  onSelectRide,
  onResetFilters,
}) => {
  if (rides.length === 0) {
    return (
      <EmptyState
        title="No Dispatch Records Found"
        description="Your current search parameters or operational status filters did not return any active transfer telemetry."
        actionLabel={onResetFilters ? 'Reset Operational Filters' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12141C]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-[11px] font-medium uppercase tracking-widest text-[#94A3B8] bg-[#1A1D28]/40">
            <th className="py-4 px-5">Dossier ID</th>
            <th className="py-4 px-5">VIP Client</th>
            <th className="py-4 px-5 min-w-[240px]">Itinerary Route</th>
            <th className="py-4 px-5">Schedule</th>
            <th className="py-4 px-5">Class & Driver</th>
            <th className="py-4 px-5">Telemetry Status</th>
            <th className="py-4 px-5 text-right">Guaranteed Fare</th>
            <th className="py-4 px-5 text-center">Command</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-xs text-[#E2E8F0]">
          {rides.map((ride) => (
            <tr
              key={ride.id}
              onClick={() => onSelectRide(ride)}
              className="hover:bg-white/5 transition-colors duration-150 cursor-pointer group"
            >
              {/* ID */}
              <td className="py-4 px-5 font-mono font-semibold text-[#D4AF37]">
                {ride.id}
              </td>

              {/* Passenger */}
              <td className="py-4 px-5">
                <div className="font-semibold text-[#F8FAFC]">{ride.customerName}</div>
                {ride.vipTier && (
                  <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-[#D4AF37] border border-[#D4AF37]/20">
                    {ride.vipTier} VIP
                  </span>
                )}
              </td>

              {/* Route */}
              <td className="py-4 px-5">
                <div className="flex items-center gap-1.5 text-[#F8FAFC] font-medium truncate max-w-[260px]">
                  <span>{ride.pickupLocation.split(',')[0]}</span>
                  <ArrowRight size={12} className="text-[#D4AF37] flex-shrink-0" />
                  <span>{ride.destination.split(',')[0]}</span>
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5 uppercase tracking-wider">
                  {ride.serviceType} Protocol
                </div>
              </td>

              {/* Schedule */}
              <td className="py-4 px-5 whitespace-nowrap">
                <div className="font-medium text-[#F8FAFC]">{ride.time}</div>
                <div className="text-[#94A3B8]">{ride.date}</div>
              </td>

              {/* Vehicle & Driver */}
              <td className="py-4 px-5">
                <div className="font-medium text-[#F8FAFC]">{ride.vehicleName}</div>
                <div className="text-[#94A3B8]">{ride.driverName}</div>
              </td>

              {/* Status */}
              <td className="py-4 px-5">
                <RideStatusBadge status={ride.status} />
              </td>

              {/* Price */}
              <td className="py-4 px-5 text-right font-serif text-sm font-bold text-[#F8FAFC]">
                ${ride.price}
              </td>

              {/* Action */}
              <td className="py-4 px-5 text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRide(ride);
                  }}
                  className="p-2 rounded-lg bg-white/5 text-[#94A3B8] group-hover:text-[#D4AF37] group-hover:bg-[#D4AF37]/10 transition-all"
                  title="Inspect Dossier"
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
