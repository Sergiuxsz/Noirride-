import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRideContext } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { resetBooking } = useRideContext();
  const { user, isAuthenticated, logout } = useAuth();
  const isDashboard = location.pathname.startsWith('/dispatch');

  const handleResetDemo = () => {
    localStorage.clear();
    resetBooking();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0B0E] pt-4 pb-2">
      <div className={isDashboard ? "container-custom flex items-center justify-between" : "max-w-md mx-auto px-4 flex items-center justify-between relative"}>
        {/* Brand Logo — NOIR(gold)RIDE(white) */}
        <Link to="/" className="flex items-center">
          <span className="font-serif text-[24px] font-bold tracking-tight leading-none flex items-center">
            <span className="text-[#D4AF37]">NOIR</span>
            <span className="text-[#F8FAFC]">RIDE</span>
          </span>
        </Link>

        {/* Dynamic actions based on dashboard context */}
        {isDashboard ? (
          <button
            onClick={handleResetDemo}
            title="Reset Mock Data"
            className="p-2 rounded-lg bg-white/5 text-[#94A3B8] hover:text-[#D4AF37] hover:bg-white/10 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            {/* Language Selector Dropdown */}
            <div className="relative group">
              <Link to="/language" className="flex items-center gap-0.5 text-[#94A3B8] hover:text-[#D4AF37] transition-colors py-1">
                <span>EN</span>
                <span className="text-[8px] opacity-70">▼</span>
              </Link>
              {/* Dropdown Menu on Hover */}
              <div className="absolute right-0 top-7 hidden group-hover:block bg-[#12141C] border border-white/10 rounded-lg p-1 shadow-xl z-50 text-[10px] min-w-[85px]">
                <Link to="/language" className="block w-full text-left px-2 py-1.5 hover:bg-white/5 rounded text-[#D4AF37] font-semibold">EN (EUR)</Link>
                <Link to="/language" className="block w-full text-left px-2 py-1.5 hover:bg-white/5 rounded text-[#94A3B8]">RO (RON)</Link>
                <Link to="/language" className="block w-full text-left px-2 py-1.5 hover:bg-white/5 rounded text-[#D4AF37]/80 border-t border-white/10 mt-1 pt-1 font-medium">All Options →</Link>
              </div>
            </div>

            {/* Help Link */}
            <Link
              to="/help"
              className="text-[#94A3B8] hover:text-[#D4AF37] transition-colors py-1 font-medium"
            >
              Help
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold tracking-wider uppercase text-[10px] shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
                  {user.vipTier || 'Gold'} · {user.fullName.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors py-1 font-medium text-[11px] sm:text-xs"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <>
                {/* Log In Link */}
                <Link
                  to="/login"
                  className="text-[#94A3B8] hover:text-[#D4AF37] transition-colors py-1 font-medium"
                >
                  Log In
                </Link>

                {/* Register Button - Golden Pill Shaped */}
                <Link
                  to="/register"
                  className="bg-[#D4AF37] text-black font-sans font-bold text-[9px] sm:text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-full hover:bg-[#E5C158] transition-colors duration-200 shadow-md shadow-[#D4AF37]/20 inline-flex items-center justify-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
