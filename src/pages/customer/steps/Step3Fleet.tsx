import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, Shield } from 'lucide-react';
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
  return (
    <div className="container-custom max-w-4xl pt-4 animate-fade-in">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#D4AF37] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#F8FAFC]">Select Fleet Class</h2>
          <p className="text-sm text-[#94A3B8] mt-1">Choose the vehicle that suits your journey.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12141C] border border-white/10 text-xs text-[#E2E8F0]">
          <MapPin size={14} className="text-[#D4AF37]" />
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
              // Update state only if values changed to avoid infinite loops
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
            <div className="flex gap-4 mt-3 text-xs font-medium text-[#94A3B8] justify-end">
              <span>Distance: {(bookingState.distanceMeters / 1000).toFixed(1)} km</span>
              <span>Est. Time: {Math.round(bookingState.durationSeconds / 60)} min</span>
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

      <div className="p-5 rounded-2xl bg-[#12141C]/60 backdrop-blur-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
          <Shield size={18} className="text-[#D4AF37]" />
          <span>All vehicles equipped with 5G Wi-Fi, mineral water & daily journals.</span>
        </div>
        <Button
          size="lg"
          onClick={handleStep3Continue}
          rightIcon={<ArrowRight size={18} />}
          className="w-full sm:w-auto"
        >
          Review Booking
        </Button>
      </div>
    </div>
  );
};
