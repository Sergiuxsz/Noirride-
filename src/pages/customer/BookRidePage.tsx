import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingState } from '../../components/ui/LoadingState';
import { useBooking } from '../../hooks/useBooking';
import { useAuth } from '../../context/AuthContext';
import { reverseGeocode } from '../../services/googlePlaces';
import type { ServiceType } from '../../types';

import { Step0Home } from './steps/Step0Home';
import { Step1Destination } from './steps/Step1Destination';
import { Step2Pickup } from './steps/Step2Pickup';
import { Step3Fleet } from './steps/Step3Fleet';
import { Step3Chauffeur } from './steps/Step3Chauffeur';
import { Step4Review } from './steps/Step4Review';
import { Step5Success } from './steps/Step5Success';

export const BookRidePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    bookingState, updateField,
    selectVehicle, calculatePrice, confirmBooking, vehicles, drivers,
    isRehydratingDraft
  } = useBooking();

  // Step machine: 0 = homepage (cards visible), 1-5 = booking steps
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Destination
  const [destinationInput, setDestinationInput] = useState('');
  const [pickupTimeOption, setPickupTimeOption] = useState('now');
  const [customDate, setCustomDate] = useState(bookingState.date || new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState(bookingState.time || '19:30');

  // Step 2: Pickup & Passengers
  const [pickupInput, setPickupInput] = useState(bookingState.pickupLocation || '');
  const [passengers, setPassengers] = useState(bookingState.passengers || 2);

  // Step 4: Credentials
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');

  // Sync state once rehydration completes
  useEffect(() => {
    if (!isRehydratingDraft) {
      setCurrentStep(bookingState.currentStep || 0);
      setDestinationInput(bookingState.destination || '');
      setPickupInput(bookingState.pickupLocation || '');
      setPassengers(bookingState.passengers || 2);
      if (bookingState.date) setCustomDate(bookingState.date);
      if (bookingState.time) setCustomTime(bookingState.time);
    }
  }, [isRehydratingDraft]);

  useEffect(() => {
    if (user) {
      setCustomerName(prev => prev || user.fullName || '');
      setCustomerEmail(prev => prev || user.email || '');
      setCustomerPhone(prev => prev || user.phone || '');
    }
  }, [user]);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isSubmittingRef = useRef(false);

  // Auto-detect location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('[Geolocation] Detected coordinates:', latitude, longitude);
        const address = await reverseGeocode(latitude, longitude);
        console.log('[Geolocation] Reversed Address:', address);
        if (address) {
          updateField('pickupLocation', address);
          updateField('pickupCoordinates', { lat: latitude, lng: longitude });
          setPickupInput(address);
        }
      }, (error) => {
        console.warn('[Geolocation] failed or denied:', error);
      });
    }
  }, []);

  // Global reset listener for navigation buttons (Home mid-flow)
  useEffect(() => {
    const handleReset = () => {
      setCurrentStep(0);
      updateField('currentStep', 0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('resetBookingStep', handleReset);
    return () => window.removeEventListener('resetBookingStep', handleReset);
  }, []);

  const applyTimeSelection = (option: string) => {
    const now = new Date();
    if (option === 'now') {
      updateField('date', now.toISOString().split('T')[0]);
      updateField('time', now.toTimeString().split(' ')[0].slice(0, 5));
    } else if (option === '15min') {
      const f = new Date(now.getTime() + 15 * 60000);
      updateField('date', f.toISOString().split('T')[0]);
      updateField('time', f.toTimeString().split(' ')[0].slice(0, 5));
    } else if (option === '30min') {
      const f = new Date(now.getTime() + 30 * 60000);
      updateField('date', f.toISOString().split('T')[0]);
      updateField('time', f.toTimeString().split(' ')[0].slice(0, 5));
    } else if (option === '1hour') {
      const f = new Date(now.getTime() + 60 * 60000);
      updateField('date', f.toISOString().split('T')[0]);
      updateField('time', f.toTimeString().split(' ')[0].slice(0, 5));
    } else if (option === 'later') {
      updateField('date', customDate);
      updateField('time', customTime);
    }
  };

  const goTo = (step: number) => {
    setCurrentStep(step);
    updateField('currentStep', step);
  };

  const goBack = () => {
    if (currentStep <= 1) {
      goTo(0);
    } else {
      goTo(currentStep - 1);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationInput.trim()) {
      setErrors({ destination: 'Destination is required' });
      return;
    }
    if (!bookingState.destinationCoordinates) {
      setErrors({ destination: 'Please select a specific location from the dropdown suggestions' });
      return;
    }

    if (pickupTimeOption === 'later') {
      const selectedDateTime = new Date(`${customDate}T${customTime}`);
      const now = new Date();
      // Allow 15 minutes grace period
      if (selectedDateTime.getTime() < now.getTime() + 15 * 60000) {
        setErrors({ destination: 'Custom schedule must be at least 15 minutes in the future' });
        return;
      }
    }

    setErrors({});

    // Upstream Invalidation: if destination changed, clear previously selected vehicle/driver
    if (destinationInput !== bookingState.destination) {
      updateField('selectedVehicleId', undefined);
      updateField('selectedDriverId', undefined);
    }

    updateField('destination', destinationInput);
    applyTimeSelection(pickupTimeOption);
    goTo(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupInput.trim()) {
      setErrors({ pickup: 'Pickup address is required' });
      return;
    }
    setErrors({});

    // Upstream Invalidation: if pickup changed, clear previously selected vehicle/driver
    if (pickupInput !== bookingState.pickupLocation) {
      updateField('selectedVehicleId', undefined);
      updateField('selectedDriverId', undefined);
    }

    updateField('pickupLocation', pickupInput);
    updateField('passengers', passengers);
    goTo(3);
  };

  const handleStep3FleetContinue = () => {
    if (!bookingState.selectedVehicleId) {
      setErrors({ vehicle: 'Please select a vehicle' });
      return;
    }
    setErrors({});
    goTo(4);
  };

  const handleStep4ChauffeurContinue = () => {
    if (!bookingState.selectedDriverId) {
      setErrors({ driver: 'Please select a chauffeur' });
      return;
    }
    setErrors({});
    goTo(5);
  };

  const handleStep4Confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.name = 'Full name is required';
    if (!customerEmail.trim() || !customerEmail.includes('@')) errs.email = 'Valid email required';
    if (!customerPhone.trim() || customerPhone.length < 7) errs.phone = 'Valid phone required';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (isSubmittingRef.current) return;
    
    setErrors({});
    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      await confirmBooking({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        specialRequests,
      });
      setIsLoading(false);
      setIsSuccess(true);
      goTo(6);
      setTimeout(() => navigate('/trip-details'), 1800);
    } catch (err: any) {
      setIsLoading(false);
      isSubmittingRef.current = false;
      setErrors({ submit: err.message || 'Failed to dispatch reservation. Please try again.' });
    }
  };

  const handleServiceCardClick = (type: ServiceType, overrideDestination?: string) => {
    updateField('serviceType', type);
    if (overrideDestination) {
      setDestinationInput(overrideDestination);
      updateField('destination', overrideDestination);
    } else {
      setDestinationInput(bookingState.destination || '');
    }
    setPickupInput(bookingState.pickupLocation || '');
    goTo(1);
  };

  const selectedVehicle = vehicles.length > 0 
    ? (vehicles.find(v => v.id === bookingState.selectedVehicleId) || vehicles[0])
    : null;
  const priceBreakdown = selectedVehicle ? calculatePrice(selectedVehicle.id) : { base: 0, serviceFee: 0, tax: 0, total: 0 };

  if (isLoading || isRehydratingDraft) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center container-custom">
        <LoadingState message={isRehydratingDraft ? "Restoring your secure session..." : "Dispatching reservation to secure chauffeur network..."} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {currentStep === 0 && (
            <Step0Home
              destinationInput={destinationInput}
              setDestinationInput={setDestinationInput}
              pickupTimeOption={pickupTimeOption}
              setPickupTimeOption={setPickupTimeOption}
              applyTimeSelection={applyTimeSelection}
              handleServiceCardClick={handleServiceCardClick}
              goTo={goTo}
            />
          )}

          {currentStep === 1 && (
            <Step1Destination
              destinationInput={destinationInput}
              setDestinationInput={setDestinationInput}
              pickupTimeOption={pickupTimeOption}
              setPickupTimeOption={setPickupTimeOption}
              applyTimeSelection={applyTimeSelection}
              customDate={customDate}
              setCustomDate={setCustomDate}
              customTime={customTime}
              setCustomTime={setCustomTime}
              bookingState={bookingState}
              updateField={updateField}
              errors={errors}
              handleStep1Submit={handleStep1Submit}
              goBack={goBack}
            />
          )}

          {currentStep === 2 && (
            <Step2Pickup
              bookingState={bookingState}
              updateField={updateField}
              destinationInput={destinationInput}
              pickupInput={pickupInput}
              setPickupInput={setPickupInput}
              passengers={passengers}
              setPassengers={setPassengers}
              errors={errors}
              handleStep2Submit={handleStep2Submit}
              goBack={goBack}
            />
          )}

          {currentStep === 3 && (
            <Step3Fleet
              bookingState={bookingState}
              pickupInput={pickupInput}
              destinationInput={destinationInput}
              selectVehicle={selectVehicle}
              calculatePrice={calculatePrice}
              updateField={updateField}
              errors={errors}
              handleStep3Continue={handleStep3FleetContinue}
              goBack={goBack}
              vehicles={vehicles}
            />
          )}

          {currentStep === 4 && (
            <Step3Chauffeur
              bookingState={bookingState}
              selectDriver={(id) => updateField('selectedDriverId', id)}
              updateField={updateField}
              errors={errors}
              handleStep3Continue={handleStep4ChauffeurContinue}
              goBack={goBack}
              drivers={drivers}
            />
          )}

          {currentStep === 5 && (
            <Step4Review
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              specialRequests={specialRequests}
              setSpecialRequests={setSpecialRequests}
              bookingState={bookingState}
              selectedVehicle={selectedVehicle as any}
              priceBreakdown={priceBreakdown}
              errors={errors}
              handleStep4Confirm={handleStep4Confirm}
              goBack={goBack}
            />
          )}

          {currentStep === 6 && isSuccess && <Step5Success />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BookRidePage;
