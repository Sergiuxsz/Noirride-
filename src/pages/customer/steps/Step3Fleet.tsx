import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { VehicleCard } from '../../../components/booking/VehicleCard';
import { RouteMap } from '../../../components/map/RouteMap';
import type { BookingFormState, Vehicle } from '../../../types';

interface Step3FleetProps {
  bookingState: BookingFormState;
  pickupInput: string;
  destinationInput: string;
  selectVehicle: (id: string) => void;
  calculatePrice: (id: string) => {
    total: number;
    base: number;
    serviceFee: number;
    tax: number;
  };
  updateField: (field: keyof BookingFormState, value: any) => void;
  errors: Record<string, string>;
  handleStep3Continue: () => void;
  goBack: () => void;
  vehicles: Vehicle[];
}

export const Step3Fleet: React.FC<Step3FleetProps> = ({
  bookingState,
  pickupInput,
  destinationInput,
  selectVehicle,
  calculatePrice,
  updateField,
  errors,
  handleStep3Continue,
  goBack,
  vehicles,
}) => {
  const { t } = useTranslation();

  return (
    <div className="container-custom max-w-4xl pt-4 animate-fade-in">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-gold-500 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> {t('common.back', 'Back')}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-content">{t('booking.select_fleet', 'Select Fleet Class')}</h2>
          <p className="text-sm text-muted mt-1">{t('booking.choose_vehicle', 'Choose the vehicle that suits your journey.')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-border text-xs text-content">
          <MapPin size={14} className="text-gold-500" />
          <span className="truncate max-w-[200px]">
            {(bookingState.pickupLocation || pickupInput).split(',')[0]} → {(bookingState.destination || destinationInput).split(',')[0]}
          </span>
        </div>
      </div>

      {bookingState.pickupCoordinates && bookingState.destinationCoordinates && (
        <div className="mb-8">
          <RouteMap 
            pickup={bookingState.pickupCoordinates} 
            destination={bookingState.destinationCoordinates}
            onRouteCalculated={(distanceMeters, durationSeconds) => {
              if (bookingState.distanceMeters !== distanceMeters) {
                updateField('distanceMeters', distanceMeters);
              }
              if (bookingState.durationSeconds !== durationSeconds) {
                updateField('durationSeconds', durationSeconds);
              }
            }}
            onLocationDragEnd={(type, newLocation) => {
              if (type === 'pickup') {
                updateField('pickupCoordinates', newLocation);
              } else {
                updateField('destinationCoordinates', newLocation);
              }
            }}
          />
          {bookingState.distanceMeters && bookingState.durationSeconds && (
            <div className="flex gap-4 mt-3 text-xs font-medium text-muted justify-end">
              <span>{t('booking.distance', 'Distance')}: {(bookingState.distanceMeters / 1000).toFixed(1)} km</span>
              <span>{t('booking.est_time', 'Est. Time')}: {Math.round(bookingState.durationSeconds / 60)} {t('common.min', 'min')}</span>
            </div>
          )}
        </div>
      )}

      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden" 
        animate="show" 
        className="flex flex-col gap-4 mb-6"
      >
        {vehicles.map((vehicle) => {
          const isSelected = bookingState.selectedVehicleId === vehicle.id;
          const price = calculatePrice(vehicle.id);
          return (
            <motion.div 
              key={vehicle.id} 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
              }}
            >
              <VehicleCard
                vehicle={vehicle}
                selected={isSelected}
                onSelect={() => selectVehicle(vehicle.id)}
                calculatedPrice={price.total}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {errors.vehicle && (
        <p className="text-xs text-red-400 mb-4 animate-fade-in">{errors.vehicle}</p>
      )}

      <div className="p-5 rounded-2xl bg-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2.5 text-xs text-muted">
          <Shield size={18} className="text-gold-500" />
          <span>{t('booking.fleet_info', 'All vehicles equipped with 5G Wi-Fi, mineral water & daily journals.')}</span>
        </div>
        <Button
          size="lg"
          onClick={handleStep3Continue}
          rightIcon={<ArrowRight size={18} />}
          className="w-full sm:w-auto"
        >
          {t('booking.reviewBooking', 'Review Booking')}
        </Button>
      </div>
    </div>
  );
};
