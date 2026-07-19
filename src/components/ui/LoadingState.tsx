import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Securing your executive transfer...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-2 rounded-full border-[#D4AF37]/20"></div>
        <div className="absolute inset-0 border-2 border-t-[#D4AF37] rounded-full animate-spin"></div>
        <div className="absolute inset-2 border border-dashed rounded-full border-[#D4AF37]/40 animate-pulse"></div>
      </div>
      <p className="font-serif text-base font-medium tracking-wide text-[#F8FAFC] animate-pulse">
        {message}
      </p>
      <p className="text-xs text-[#94A3B8] mt-2">Connecting with private dispatch protocol</p>
    </div>
  );
};
