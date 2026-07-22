import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRideContext } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSelector } from '../ui/LanguageSelector';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { resetBooking } = useRideContext();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const isDashboard = location.pathname.startsWith('/dispatch');

  const handleResetDemo = () => {
    localStorage.clear();
    resetBooking();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-primary pt-4 pb-2 transition-colors">
      <div className={isDashboard ? "container-custom flex items-center justify-between" : "max-w-md mx-auto px-4 flex items-center justify-between relative"}>
        {/* Brand Logo — NOIR(gold)RIDE(white) */}
        <Link to="/" onClick={() => window.dispatchEvent(new Event('resetBookingStep'))} className="flex items-center">
          <span className="font-serif text-[24px] font-bold tracking-tight leading-none flex items-center">
            <span className="text-gold-500">NOIR</span>
            <span className="text-content">RIDE</span>
          </span>
        </Link>

        {/* Dynamic actions based on dashboard context */}
        {isDashboard ? (
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSelector />
            <button
              onClick={handleResetDemo}
              title={t('nav.resetMock', 'Reset Mock Data')}
              className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-muted hover:text-gold-500 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            <ThemeToggle />
            <LanguageSelector />

            {/* Help Link */}
            <Link
              to="/help"
              className="text-muted hover:text-gold-500 transition-colors py-1 font-medium hidden sm:block"
            >
              {t('nav.support', 'Help')}
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-500 font-semibold tracking-wider uppercase text-[10px] shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse"></span>
                  {user.vipTier || 'Gold'} · {user.fullName.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-muted hover:text-content transition-colors py-1 font-medium text-[11px] sm:text-xs"
                >
                  {t('auth.logout', 'Log Out')}
                </button>
              </div>
            ) : (
              <>
                {/* Log In Link */}
                <Link
                  to="/login"
                  className="text-muted hover:text-gold-500 transition-colors py-1 font-medium"
                >
                  {t('auth.login', 'Log In')}
                </Link>

                {/* Register Button - Golden Pill Shaped */}
                <Link
                  to="/register"
                  className="bg-gold-500 text-white dark:text-black font-sans font-bold text-[9px] sm:text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-full hover:bg-[#E5C158] transition-colors duration-200 shadow-md shadow-gold-500/20 inline-flex items-center justify-center"
                >
                  {t('auth.register', 'Register')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
