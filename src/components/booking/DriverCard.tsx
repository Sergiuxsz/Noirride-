import React, { useState } from 'react';
import { Star, Phone, MessageSquare, Shield, Award, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { useRideContext } from '../../context/RideContext';
import { useTranslation } from 'react-i18next';

interface DriverCardProps {
  driverName: string;
  driverId: string;
  vehicleName: string;
  licensePlate?: string;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  driverName,
  driverId,
  vehicleName,
  licensePlate,
}) => {
  const { drivers } = useRideContext();
  const { t } = useTranslation();
  const matchedDriver = drivers.find((d) => d.id === driverId || d.name === driverName);
  
  const photo = matchedDriver?.photo;
  const rating = matchedDriver?.rating || 5.0;
  const rides = matchedDriver?.completedRides || 1000;
  const plate = licensePlate || matchedDriver?.licensePlate || 'NOIR-VIP';
  const tagline = matchedDriver?.tagline;

  const [photoError, setPhotoError] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const handleCall = () => {
    setActionAlert(`${t('trip.initiatingCall', 'Initiating secure encrypted line with Chauffeur')} ${driverName}...`);
    setTimeout(() => setActionAlert(null), 3500);
  };

  const handleMessage = () => {
    setActionAlert(`${t('trip.dispatchingSMS', 'Dispatching priority SMS dossier to')} ${driverName}...`);
    setTimeout(() => setActionAlert(null), 3500);
  };

  return (
    <div className="p-6 rounded-2xl bg-secondary border border-border space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <span className="text-xs font-serif uppercase tracking-widest text-gold-500">
          {t('trip.assignedChauffeur', 'Assigned Executive Chauffeur')}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          <Shield size={12} /> {t('trip.vetted', 'Vetted & Uniformed')}
        </span>
      </div>

      {actionAlert && (
        <div className="p-3 bg-gold-500/15 border border-gold-500/30 rounded-lg text-xs text-gold-500 animate-fade-in text-center">
          {actionAlert}
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold-500 bg-tertiary flex items-center justify-center flex-shrink-0">
          {photo && !photoError ? (
            <img
              src={photo}
              alt={driverName}
              onError={() => setPhotoError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={28} className="text-gold-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-lg font-bold text-content truncate">
              {driverName || matchedDriver?.name || t('trip.executiveChauffeur', 'Executive Chauffeur')}
            </h4>
            <Award size={16} className="text-gold-500 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted mt-1">
            <span className="inline-flex items-center text-gold-500 font-semibold">
              <Star size={13} className="fill-current mr-1" /> {rating} {t('booking.rating', 'Rating')}
            </span>
            <span>• {rides.toLocaleString()} {t('booking.trips', 'Trips')}</span>
          </div>
          {tagline && (
            <p className="text-xs text-gold-500 italic mt-1 font-serif">
              "{tagline}"
            </p>
          )}
          <p className="text-xs text-content mt-1.5 truncate">
            {vehicleName} • <span className="font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] text-gold-500">{plate}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="outline" size="sm" leftIcon={<Phone size={14} />} onClick={handleCall}>
          {t('trip.directLine', 'Direct Line')}
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<MessageSquare size={14} />} onClick={handleMessage}>
          {t('trip.dispatchSMS', 'Dispatch SMS')}
        </Button>
      </div>
    </div>
  );
};
