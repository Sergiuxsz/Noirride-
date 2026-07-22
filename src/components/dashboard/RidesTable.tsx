import React from 'react';
import { Eye, ArrowRight } from 'lucide-react';
import type { Ride } from '../../types';
import { RideStatusBadge } from './RideStatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { useTranslation } from 'react-i18next';
import { useRideContext } from '../../context/RideContext';

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
  const { t } = useTranslation();
  const { drivers } = useRideContext();

  if (rides.length === 0) {
    return (
      <EmptyState
        title={t('dispatch.noRecords', 'No Dispatch Records Found')}
        description={t('dispatch.noRecordsDesc', 'Your current search parameters or operational status filters did not return any active transfer telemetry.')}
        actionLabel={onResetFilters ? t('dispatch.resetFilters', 'Reset Operational Filters') : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-secondary">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted bg-tertiary/40">
            <th className="py-4 px-5">{t('dispatch.dossierId', 'Dossier ID')}</th>
            <th className="py-4 px-5">{t('dispatch.vipClient', 'VIP Client')}</th>
            <th className="py-4 px-5 min-w-[240px]">{t('dispatch.itineraryRoute', 'Itinerary Route')}</th>
            <th className="py-4 px-5">{t('dispatch.schedule', 'Schedule')}</th>
            <th className="py-4 px-5">{t('dispatch.classDriver', 'Class & Driver')}</th>
            <th className="py-4 px-5">{t('dispatch.telemetryStatus', 'Telemetry Status')}</th>
            <th className="py-4 px-5 text-right">{t('dispatch.guaranteedFare', 'Guaranteed Fare')}</th>
            <th className="py-4 px-5 text-center">{t('dispatch.command', 'Command')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-xs text-content">
          {Array.from(new Map(rides.map(r => [r.id, r])).values()).map((ride) => (
            <tr
              key={ride.id}
              onClick={() => onSelectRide(ride)}
              className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer group"
            >
              {/* ID */}
              <td className="py-4 px-5 font-mono font-semibold text-gold-500">
                {ride.id}
              </td>

              {/* Passenger */}
              <td className="py-4 px-5">
                <div className="font-semibold text-content">{ride.customerName}</div>
                {ride.vipTier && (
                  <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 text-gold-500 border border-gold-500/20">
                    {ride.vipTier} {t('dispatch.vip', 'VIP')}
                  </span>
                )}
              </td>

              {/* Route */}
              <td className="py-4 px-5">
                <div className="flex items-center gap-1.5 text-content font-medium truncate max-w-[260px]">
                  <span>{(ride.pickupLocation || '').split(',')[0]}</span>
                  <ArrowRight size={12} className="text-gold-500 flex-shrink-0" />
                  <span>{(ride.destination || '').split(',')[0]}</span>
                </div>
                <div className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">
                  {ride.serviceType} {t('dispatch.protocol', 'Protocol')}
                </div>
              </td>

              {/* Schedule */}
              <td className="py-4 px-5 whitespace-nowrap">
                <div className="font-medium text-content">{ride.time}</div>
                <div className="text-muted">{ride.date}</div>
              </td>

              {/* Vehicle & Driver */}
              <td className="py-4 px-5">
                <div className="font-medium text-content">{ride.vehicleName}</div>
                <div className="text-muted flex items-center gap-2">
                  {(() => {
                    const activeDriver = drivers.find(d => d.id === ride.driverId);
                    return activeDriver ? (
                      <>
                        <img src={activeDriver.photo} alt={activeDriver.name} className="w-5 h-5 rounded-full object-cover border border-border" />
                        <span>{activeDriver.name}</span>
                      </>
                    ) : (
                      <span>{ride.driverName}</span>
                    );
                  })()}
                </div>
              </td>

              {/* Status */}
              <td className="py-4 px-5">
                <RideStatusBadge status={ride.status} />
              </td>

              {/* Price */}
              <td className="py-4 px-5 text-right font-serif text-sm font-bold text-content">
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
                  className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-muted group-hover:text-gold-500 group-hover:bg-gold-500/10 transition-all"
                  title={t('dispatch.inspectDossier', 'Inspect Dossier')}
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
