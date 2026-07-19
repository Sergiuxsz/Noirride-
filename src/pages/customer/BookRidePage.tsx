import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingState } from '../../components/ui/LoadingState';
import { useBooking } from '../../hooks/useBooking';
import type { ServiceType } from '../../types';

import { Step0Home } from './steps/Step0Home';
import { Step1Destination } from './steps/Step1Destination';
import { Step2Pickup } from './steps/Step2Pickup';
import { Step3Fleet } from './steps/Step3Fleet';
import { Step4Review } from './steps/Step4Review';
import { Step5Success } from './steps/Step5Success';

export const BookRidePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    bookingState, updateField,
    selectVehicle, calculatePrice, confirmBooking, vehicles
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
  const [customerName, setCustomerName] = useState('Victoria Kensington');
  const [customerEmail, setCustomerEmail] = useState('v.kensington@kensington-capital.com');
  const [customerPhone, setCustomerPhone] = useState('+1 (555) 234-5678');
  const [specialRequests, setSpecialRequests] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    setErrors({});
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
    updateField('pickupLocation', pickupInput);
    updateField('passengers', passengers);
    goTo(3);
  };

  const handleStep3Continue = () => {
    if (!bookingState.selectedVehicleId) {
      setErrors({ vehicle: 'Please select a vehicle' });
      return;
    }
    setErrors({});
    goTo(4);
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
    setErrors({});
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
      goTo(5);
      setTimeout(() => navigate('/trip-details'), 1800);
    } catch {
      setIsLoading(false);
    }
  };

  const handleServiceCardClick = (type: ServiceType) => {
    updateField('serviceType', type);
    setDestinationInput(bookingState.destination || '');
    setPickupInput(bookingState.pickupLocation || '');
    goTo(1);
  };

  const selectedVehicle = vehicles.find(v => v.id === bookingState.selectedVehicleId) || vehicles[3];
  const priceBreakdown = calculatePrice(selectedVehicle.id);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center container-custom">
        <LoadingState message="Dispatching reservation to secure chauffeur network..." />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16 animate-fade-in">
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
          errors={errors}
          handleStep3Continue={handleStep3Continue}
          goBack={goBack}
          vehicles={vehicles}
        />
      )}

      {currentStep === 4 && (
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
          selectedVehicle={selectedVehicle}
          priceBreakdown={priceBreakdown}
          errors={errors}
          handleStep4Confirm={handleStep4Confirm}
          goBack={goBack}
        />
      )}

      {currentStep === 5 && isSuccess && <Step5Success />}
    </div>
  );
};

export default BookRidePage;
