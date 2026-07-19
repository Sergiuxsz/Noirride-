import React, { useState } from 'react';
import { Star, Phone, MessageSquare, Shield, Award, User } from 'lucide-react';
import { Button } from '../ui/Button';

interface DriverCardProps {
  driverName: string;
  driverId: string;
  vehicleName: string;
  licensePlate?: string;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  driverName,
  vehicleName,
  licensePlate = 'NOIR-VIP',
}) => {
  const [photoError, setPhotoError] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const handleCall = () => {
    setActionAlert(`Initiating secure encrypted line with Chauffeur ${driverName}...`);
    setTimeout(() => setActionAlert(null), 3500);
  };

  const handleMessage = () => {
    setActionAlert(`Dispatching priority SMS dossier to ${driverName}...`);
    setTimeout(() => setActionAlert(null), 3500);
  };

  return (
    <div className="p-6 rounded-2xl bg-[#12141C] border border-white/10 space-y-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <span className="text-xs font-serif uppercase tracking-widest text-[#D4AF37]">
          Assigned Executive Chauffeur
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          <Shield size={12} /> Vetted & Uniformed
        </span>
      </div>

      {actionAlert && (
        <div className="p-3 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-lg text-xs text-[#D4AF37] animate-fade-in text-center">
          {actionAlert}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37] bg-[#1A1D28] flex items-center justify-center flex-shrink-0">
          {!photoError ? (
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
              alt={driverName}
              onError={() => setPhotoError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={28} className="text-[#D4AF37]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-lg font-bold text-[#F8FAFC] truncate">
              {driverName}
            </h4>
            <Award size={16} className="text-[#D4AF37] flex-shrink-0" />
          </div>
          <div className="flex items-center gap-3 text-xs text-[#94A3B8] mt-1">
            <span className="inline-flex items-center text-[#D4AF37] font-semibold">
              <Star size={13} className="fill-current mr-1" /> 4.99 Rating
            </span>
            <span>• 1,400+ Rides</span>
          </div>
          <p className="text-xs text-[#E2E8F0] mt-1 truncate">
            {vehicleName} • <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[11px] text-[#D4AF37]">{licensePlate}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="outline" size="sm" leftIcon={<Phone size={14} />} onClick={handleCall}>
          Direct Line
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<MessageSquare size={14} />} onClick={handleMessage}>
          Dispatch SMS
        </Button>
      </div>
    </div>
  );
};
