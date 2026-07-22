import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Shield, Award } from 'lucide-react';
import { VehicleCard } from '../../components/booking/VehicleCard';
import { Button } from '../../components/ui/Button';
import { useBooking } from '../../hooks/useBooking';

export const VehicleSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookingState, selectVehicle, calculatePrice, vehicles } = useBooking();

  const handleSelect = (vehicleId: string) => {
    selectVehicle(vehicleId);
  };

  const handleContinue = () => {
    navigate('/review-booking');
  };

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16 animate-fade-in">
      <div className="container-custom max-w-4xl pt-8 space-y-6">
        {/* Navigation & Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-gold-500 mb-2 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Itinerary
            </button>
            <span className="block text-xs uppercase tracking-widest text-gold-500 font-semibold">
              Step 2 of 3
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-content">
              Select Fleet Class
            </h1>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-border text-xs text-content">
            <Award size={16} className="text-gold-500" />
            <span>{bookingState.pickupLocation.split(',')[0]} → {bookingState.destination.split(',')[0]}</span>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="space-y-4">
          {vehicles.map((vehicle) => {
            const isSelected = bookingState.selectedVehicleId === vehicle.id;
            const priceBreakdown = calculatePrice(vehicle.id);
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={isSelected}
                onSelect={() => handleSelect(vehicle.id)}
                calculatedPrice={priceBreakdown.total}
              />
            );
          })}
        </div>

        {/* Sticky/Bottom Actions */}
        <div className="p-5 rounded-2xl bg-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-muted">
            <Shield size={18} className="text-gold-500" />
            <span>All vehicles equipped with onboard 5G Wi-Fi, bottled mineral water & daily journals.</span>
          </div>
          <Button
            size="lg"
            onClick={handleContinue}
            rightIcon={<ArrowRight size={18} />}
            className="w-full sm:w-auto"
          >
            Review & Finalize Booking
          </Button>
        </div>
      </div>
    </div>
  );
};
