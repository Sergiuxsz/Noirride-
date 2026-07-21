import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, UserCheck, Star, Car } from 'lucide-react';
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
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#F8FAFC]">Private Chauffeurs</h2>
          <p className="text-sm text-[#94A3B8] mt-1">Select your preferred professional for the journey.</p>
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
                  ? 'bg-[#181A20] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)] scale-[1.02]'
                  : isBusy
                    ? 'bg-[#0A0B0E]/80 border-white/5 opacity-60 cursor-not-allowed grayscale-[0.8]'
                    : 'bg-[#12141C] border-white/10 hover:border-white/30 cursor-pointer hover:bg-[#181A20]'
              }`}
              onClick={() => {
                if (!isBusy) {
                  selectDriver(driver.id);
                }
              }}
            >
              <div className="flex gap-4 items-start">
                {/* Driver Photo */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Driver Info */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-[#F8FAFC] text-base">{driver.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={12} className="text-[#D4AF37] fill-current" />
                        <span className="text-xs text-[#E2E8F0] font-semibold">{driver.rating}</span>
                        <span className="text-xs text-[#64748B] ml-1">({driver.completedRides} trips)</span>
                      </div>
                      {driver.tagline && (
                        <p className="text-[11px] text-[#D4AF37] italic mt-1 font-serif">
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

                  <div className="flex items-center gap-2 mt-3 text-[#94A3B8] text-xs">
                    <Car size={14} className="text-[#D4AF37]" />
                    <span className="truncate">{driver.vehicleMake} • {driver.licensePlate}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {driver.languages.map((lang) => (
                      <span key={lang} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-[#94A3B8]">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute top-4 right-4 text-[#D4AF37]">
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

      <div className="p-5 rounded-2xl bg-[#12141C]/60 backdrop-blur-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
          <Star size={18} className="text-[#D4AF37]" />
          <span>All chauffeurs undergo rigorous background checks and executive driving training.</span>
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
