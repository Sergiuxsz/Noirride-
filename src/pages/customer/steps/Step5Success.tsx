import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const Step5Success: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center container-custom animate-fade-in">
      <div className="p-8 rounded-2xl bg-[#12141C] border border-[#D4AF37] max-w-md text-center flex flex-col gap-4 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#F8FAFC]">
          Transfer Confirmed
        </h2>
        <p className="text-sm text-[#94A3B8]">
          Your executive dossier has been locked. Redirecting to live trip telemetry...
        </p>
      </div>
    </div>
  );
};
