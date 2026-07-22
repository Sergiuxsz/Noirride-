import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, UserCheck, Star, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { HourglassTimer } from '../../../components/ui/HourglassTimer';
import type { BookingFormState, Driver } from '../../../types';

interface Step3ChauffeurProps {
  bookingState: BookingFormState;
  selectDriver: (id: string) => void;
  updateField: (field: keyof BookingFormState, value: any) => void;
  errors: Record<string, string>;
  handleStep3Continue: () => void;
  goBack: () => void;
  drivers: Driver[];
}

export const Step3Chauffeur: React.FC<Step3ChauffeurProps> = ({
  bookingState,
  selectDriver,
  errors,
  handleStep3Continue,
  goBack,
  drivers,
}) => {
  const { t } = useTranslation();

  return (
    <div className="container-custom max-w-4xl pt-4 animate-fade-in">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-gold-500 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> {t('booking.back', 'Back')}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-content">{t('booking.selectChauffeur', 'Private Chauffeurs')}</h2>
          <p className="text-sm text-muted mt-1">{t('booking.choose_chauffeur', 'Select your preferred professional for the journey.')}</p>
        </div>
      </div>

      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        {drivers.map((driver) => {
          const isSelected = bookingState.selectedDriverId === driver.id;
          const isBusy = driver.status === 'BUSY';

          return (
            <motion.div 
              key={driver.id} 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
              }}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col p-4 ${
                isSelected
                  ? 'bg-primary border-gold-500 shadow-[0_0_20px_rgba(212,175,55,0.15)] scale-[1.02]'
                  : isBusy
                    ? 'bg-primary/80 border-white/5 opacity-60 cursor-not-allowed grayscale-[0.8]'
                    : 'bg-secondary border-border hover:border-border/50 cursor-pointer hover:bg-primary'
              }`}
              onClick={() => {
                if (!isBusy) {
                  selectDriver(driver.id);
                }
              }}
            >
              <div className="flex gap-4 items-start">
                {/* Driver Photo */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden border border-border flex-shrink-0">
                  <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Driver Info */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-content text-base">{driver.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={12} className="text-gold-500 fill-current" />
                        <span className="text-xs text-content font-semibold">{driver.rating}</span>
                        <span className="text-xs text-muted ml-1">({driver.completedRides} {t('booking.trips', 'trips')})</span>
                      </div>
                      {driver.tagline && (
                        <p className="text-[11px] text-gold-500 italic mt-1 font-serif">
                          "{driver.tagline}"
                        </p>
                      )}
                    </div>
                    {isBusy && driver.availableIn && (
                      <div className="scale-75 origin-top-right">
                        <HourglassTimer availableIn={driver.availableIn} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-muted text-xs">
                    <Car size={14} className="text-gold-500" />
                    <span className="truncate">{driver.vehicleMake} • {driver.licensePlate}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {driver.languages.map((lang) => (
                      <span key={lang} className="px-2 py-0.5 rounded-full bg-white/5 border border-border text-[10px] uppercase tracking-wider text-muted">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute top-4 right-4 text-gold-500">
                  <UserCheck size={20} />
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {errors.driver && (
        <p className="text-xs text-red-400 mb-4 animate-fade-in">{errors.driver}</p>
      )}

      <div className="p-5 rounded-2xl bg-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2.5 text-xs text-muted">
          <Star size={18} className="text-gold-500" />
          <span>{t('booking.chauffeur_info', 'All chauffeurs undergo rigorous background checks and executive driving training.')}</span>
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
