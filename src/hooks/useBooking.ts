import { useRideContext } from '../context/RideContext';

export const useBooking = () => {
  const {
    rides,
    vehicles,
    drivers,
    activeBooking,
    confirmedRide,
    updateBookingField,
    selectVehicle,
    calculatePrice,
    confirmBooking,
    cancelConfirmedRide,
    resetBooking,
    isRehydratingDraft,
  } = useRideContext();

  const validateBookingForm = () => {
    const errors: Record<string, string> = {};
    if (!activeBooking.pickupLocation.trim()) errors.pickupLocation = 'Pickup address is required';
    if (!activeBooking.destination.trim()) errors.destination = 'Destination is required';
    if (!activeBooking.date) errors.date = 'Date is required';
    if (!activeBooking.time) errors.time = 'Time is required';
    if (activeBooking.passengers < 1) errors.passengers = 'At least 1 passenger is required';
    return errors;
  };

  return {
    rides,
    vehicles,
    drivers,
    bookingState: activeBooking,
    confirmedRide,
    updateField: updateBookingField,
    selectVehicle,
    calculatePrice,
    validateBookingForm,
    confirmBooking,
    cancelConfirmedRide,
    resetBooking,
    isRehydratingDraft,
  };
};
