import React, { useState } from 'react';
import { Users, Briefcase, Check, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Vehicle } from '../../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  selected: boolean;
  onSelect: () => void;
  calculatedPrice: number;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  selected,
  onSelect,
  calculatedPrice,
}) => {
  const [imageError, setImageError] = useState(false);
  const { t } = useTranslation();

  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col md:flex-row items-center justify-between p-5 md:p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
        selected
          ? 'bg-tertiary border-gold-500 shadow-[0_0_20px_rgba(212,175,55,0.15)] translate-y-[-2px]'
          : 'bg-secondary border-border hover:border-border/50 hover:bg-tertiary hover:shadow-lg'
      }`}
    >
      {selected && (
        <div className="absolute top-4 right-4 bg-gold-500 text-black p-1.5 rounded-full shadow-md z-10">
          <Check size={16} strokeWidth={3} />
        </div>
      )}

      {/* Vehicle Image / Fallback */}
      <div className="w-full md:w-56 h-36 flex items-center justify-center rounded-xl overflow-hidden bg-primary/60 border border-border mb-4 md:mb-0 md:mr-6 flex-shrink-0">
        {!imageError ? (
          <img
            src={vehicle.image}
            alt={vehicle.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center text-muted">
            <Car size={36} className="text-gold-500 mb-2" />
            <span className="text-xs font-serif font-medium">{vehicle.category}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 space-y-2 pr-0 md:pr-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest px-2 py-0.5 rounded bg-gold-500/15 text-gold-500 border border-gold-500/30 font-semibold">
            {vehicle.category}
          </span>
        </div>
        <h3 className="font-serif text-lg md:text-xl font-bold text-content tracking-wide">
          {vehicle.name}
        </h3>
        <p className="text-xs md:text-sm text-muted leading-relaxed line-clamp-2">
          {vehicle.description}
        </p>

        {/* Capacity & Amenities */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-content">
          <span className="inline-flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-md border border-border">
            <Users size={14} className="text-gold-500" />
            {t('booking.max', 'Max')} {vehicle.passengerCapacity} {t('booking.pax', 'Pax')}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-md border border-border">
            <Briefcase size={14} className="text-gold-500" />
            {vehicle.luggageCapacity} {t('booking.bags', 'Bags')}
          </span>
          <span className="hidden sm:inline text-xs text-muted">
            • {vehicle.features[0]}
          </span>
        </div>
      </div>

      {/* Price CTA */}
      <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between md:justify-center mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border flex-shrink-0">
        <div className="text-left md:text-right">
          <span className="block text-[10px] uppercase tracking-widest text-muted">{t('booking.estimatedFare', 'Estimated Fare')}</span>
          <span className="font-serif text-2xl md:text-3xl font-bold text-content">
            ${calculatedPrice}
          </span>
        </div>
        <span
          className={`mt-0 md:mt-3 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
            selected
              ? 'bg-gold-500 text-black'
              : 'bg-black/5 dark:bg-white/10 text-content hover:bg-black/10 dark:hover:bg-white/20'
          }`}
        >
          {selected ? t('booking.selected', 'Selected') : t('booking.selectClass', 'Select Class')}
        </span>
      </div>
    </div>
  );
};
