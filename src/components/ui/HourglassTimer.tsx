import React from 'react';
import { motion } from 'framer-motion';

interface HourglassTimerProps {
  availableIn?: number; // minutes until available
}

export const HourglassTimer: React.FC<HourglassTimerProps> = ({ availableIn = 15 }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative w-8 h-10 flex items-center justify-center">
        {/* Glass outline */}
        <svg 
          viewBox="0 0 24 32" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          className="absolute inset-0 w-full h-full text-[#D4AF37]/40 z-10"
        >
          <path d="M4 2 L20 2 M4 30 L20 30" strokeLinecap="round" />
          <path d="M5 2 C5 12, 10 14, 12 16 C14 14, 19 12, 19 2" />
          <path d="M5 30 C5 20, 10 18, 12 16 C14 18, 19 20, 19 30" />
        </svg>

        {/* Top Sand */}
        <svg viewBox="0 0 24 32" className="absolute inset-0 w-full h-full text-[#D4AF37] z-0">
          <motion.path 
            fill="currentColor"
            d="M5 2 C5 12, 10 14, 12 16 C14 14, 19 12, 19 2 Z"
            initial={{ scaleY: 1, transformOrigin: 'top' }}
            animate={{ scaleY: 0.1 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        {/* Bottom Sand */}
        <svg viewBox="0 0 24 32" className="absolute inset-0 w-full h-full text-[#D4AF37] z-0">
          <motion.path 
            fill="currentColor"
            d="M5 30 C5 20, 10 18, 12 16 C14 18, 19 20, 19 30 Z"
            initial={{ scaleY: 0.1, transformOrigin: 'bottom' }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        {/* Falling Sand stream */}
        <motion.div
          className="absolute left-[50%] top-[16px] w-[2px] bg-[#D4AF37] z-0"
          style={{ x: '-50%' }}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 10, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* Time display */}
      <span className="text-[10px] font-sans font-bold text-[#D4AF37] uppercase tracking-wider bg-[#12141C]/80 px-2 py-0.5 rounded-full border border-[#D4AF37]/30 mt-1">
        {availableIn}m wait
      </span>
    </div>
  );
};
