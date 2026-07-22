import React from 'react';
import { MapPin, Navigation, Calendar, Users, Shield, Award } from 'lucide-react';
import type { BookingFormState, Vehicle } from '../../types';
import { useTranslation } from 'react-i18next';

interface PriceSummaryProps {
  bookingState: BookingFormState;
  vehicle: Vehicle;
  priceBreakdown: { base: number; serviceFee: number; tax: number; total: number };
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  bookingState,
  vehicle,
  priceBreakdown,
}) => {
  const { t } = useTranslation();
  return (
    <div className="p-6 rounded-2xl bg-secondary border border-border space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-gold-500 font-semibold">
            {t('trip.serviceDossier', 'Service Dossier')}
          </span>
          <h3 className="font-serif text-lg font-bold text-content">{t('trip.executiveDispatchSummary', 'Executive Dispatch Summary')}</h3>
        </div>
        <div className="px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-500 text-xs font-semibold uppercase">
          {bookingState.serviceType}
        </div>
      </div>

      {/* Itinerary */}
      <div className="space-y-3.5 text-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-gold-500 mt-0.5">
            <MapPin size={16} />
          </div>
          <div>
            <span className="block text-xs uppercase text-muted">{t('booking.pickupAddress', 'Pickup Address')}</span>
            <span className="font-medium text-content">{bookingState.pickupLocation}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-gold-500 mt-0.5">
            <Navigation size={16} />
          </div>
          <div>
            <span className="block text-xs uppercase text-muted">{t('booking.destination', 'Destination')}</span>
            <span className="font-medium text-content">{bookingState.destination}</span>
          </div>
        </div>
      </div>

      {/* Date & Vehicle Info */}
      <div className="grid grid-cols-2 gap-4 py-4 border-y border-border text-xs">
        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-gold-500" />
          <div>
            <span className="block text-muted">{t('booking.dateTime', 'Date & Time')}</span>
            <span className="font-semibold text-content">{bookingState.date} • {bookingState.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Users size={16} className="text-gold-500" />
          <div>
            <span className="block text-muted">{t('booking.partySize', 'Party Size')}</span>
            <span className="font-semibold text-content">{bookingState.passengers} {t('booking.passengers', 'Passengers')}</span>
          </div>
        </div>
      </div>

      {/* Selected Vehicle Card Mini */}
      <div className="p-3.5 rounded-xl bg-tertiary/60 border border-border flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-gold-500">{t(`fleet.${vehicle.category.toLowerCase()}`, vehicle.category)}</span>
          <p className="font-serif text-sm font-bold text-content">{vehicle.name}</p>
          <p className="text-xs text-muted">{vehicle.makeModel}</p>
        </div>
        <Award className="text-gold-500" size={24} />
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2.5 pt-2 text-sm">
        <div className="flex justify-between text-muted">
          <span>{t('booking.baseFare', 'Chauffeur & Vehicle Base Fare')}</span>
          <span className="text-content font-medium">${priceBreakdown.base}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>{t('booking.serviceFee', 'White-Glove Service & Wait Protocol (12%)')}</span>
          <span className="text-content font-medium">${priceBreakdown.serviceFee}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>{t('booking.taxes', 'Taxes & Airport Surcharge')}</span>
          <span className="text-content font-medium">${priceBreakdown.tax}</span>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div>
            <span className="font-serif text-base font-bold text-content">{t('booking.totalFare', 'Total Guaranteed Fare')}</span>
            <span className="block text-[11px] text-muted">{t('booking.totalDesc', 'All tolls, gratuity & insurance included')}</span>
          </div>
          <span className="font-serif text-3xl font-bold text-gold-500">${priceBreakdown.total}</span>
        </div>
      </div>

      {/* Guarantee badge */}
      <div className="flex items-center gap-2 text-xs text-muted pt-2">
        <Shield size={16} className="text-emerald-400 flex-shrink-0" />
        <span>{t('booking.cancellationPolicy', 'Complimentary cancellation up to 2 hours prior to scheduled pickup.')}</span>
      </div>
    </div>
  );
};
