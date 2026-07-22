import React from 'react';
import { ArrowLeft, Plane, Compass, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AddressAutocomplete } from '../../../components/booking/AddressAutocomplete';
import type { BookingFormState, ServiceType } from '../../../types';

interface Step1DestinationProps {
  destinationInput: string;
  setDestinationInput: (val: string) => void;
  pickupTimeOption: string;
  setPickupTimeOption: (val: string) => void;
  applyTimeSelection: (opt: string) => void;
  customDate: string;
  setCustomDate: (val: string) => void;
  customTime: string;
  setCustomTime: (val: string) => void;
  bookingState: BookingFormState;
  updateField: (field: keyof BookingFormState, value: any) => void;
  errors: Record<string, string>;
  handleStep1Submit: (e: React.FormEvent) => void;
  goBack: () => void;
}

export const Step1Destination: React.FC<Step1DestinationProps> = ({
  destinationInput,
  setDestinationInput,
  pickupTimeOption,
  setPickupTimeOption,
  applyTimeSelection,
  customDate,
  setCustomDate,
  customTime,
  setCustomTime,
  bookingState,
  updateField,
  errors,
  handleStep1Submit,
  goBack,
}) => {
  const { t } = useTranslation();

  return (
    <div className="container-custom max-w-xl pt-4 animate-fade-in">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-gold-500 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> {t('booking.back', 'Back')}
      </button>

      <div className="space-y-2 mb-8">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-content">{t('booking.whereHeading', 'Where are you heading?')}</h2>
        <p className="text-sm text-muted">{t('booking.enterDestination', 'Enter your destination and select when you\'d like to be picked up.')}</p>
      </div>

      <form onSubmit={handleStep1Submit} className="flex flex-col gap-6">
        <AddressAutocomplete
          value={destinationInput}
          onChange={setDestinationInput}
          onSelectCoordinates={(lat, lng) => updateField('destinationCoordinates', { lat, lng })}
          placeholder={t('booking.destinationPlaceholder', 'Airport, hotel, or address...')}
          showTimeSelect
          timeOption={pickupTimeOption}
          onChangeTimeOption={(opt) => {
            setPickupTimeOption(opt);
            applyTimeSelection(opt);
          }}
          error={errors.destination}
        />
        
        <button
          type="submit"
          className="bg-[#D4AF37] hover:bg-[#C5A030] text-[#0A0B0E] px-6 py-3.5 rounded-xl font-serif text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#D4AF37]/10 w-full"
        >
          {t('common.continue', 'Continue')}
        </button>

        {pickupTimeOption === 'later' && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary border border-border animate-fade-in">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5 font-semibold">{t('booking.date', 'Date')}</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  updateField('date', e.target.value);
                }}
                className="w-full bg-tertiary border border-border rounded-lg p-2 text-xs text-content focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5 font-semibold">{t('booking.time', 'Time')}</label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  updateField('time', e.target.value);
                }}
                className="w-full bg-tertiary border border-border rounded-lg p-2 text-xs text-content focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        )}

        {/* Service Type Pills */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted font-semibold">{t('booking.serviceType', 'Service Type')}</span>
          <div className="flex gap-2">
            {([
              { key: 'airport' as ServiceType, icon: <Plane size={14} />, label: t('booking.airport', 'Airport') },
              { key: 'hourly' as ServiceType, icon: <Compass size={14} />, label: t('booking.hourly', 'Hourly') },
              { key: 'intercity' as ServiceType, icon: <ShieldCheck size={14} />, label: t('booking.intercity', 'Intercity') },
            ]).map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => updateField('serviceType', key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  bookingState.serviceType === key
                    ? 'bg-[#D4AF37]/15 text-gold-500 border-gold-500/50'
                    : 'bg-secondary text-muted border-border hover:border-border/50 hover:text-content'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
