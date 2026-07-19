import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Car, Activity, User, Sparkles } from 'lucide-react';
import telemetryImg from '../../assets/live_telemetry.png';
import { useRideContext } from '../../context/RideContext';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmedRide } = useRideContext();
  const isDispatch = location.pathname.startsWith('/dispatch');

  // Hide bottom nav on dispatch operator dashboard for clean workspace separation
  if (isDispatch) return null;

  const currentPath = location.pathname;

  const navItems = [
    {
      id: 'home',
      label: 'HOME',
      icon: <Home size={22} />,
      active: currentPath === '/' && !window.location.hash,
      onClick: () => {
        if (currentPath === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate('/');
        }
      },
    },
    {
      id: 'fleet',
      label: 'FLEET',
      icon: <Car size={22} />,
      active: currentPath === '/fleet',
      onClick: () => {
        navigate('/fleet');
      },
    },
    {
      id: 'activity',
      label: 'ACTIVITY',
      icon: <Activity size={22} />,
      active: currentPath === '/trip-details',
      onClick: () => {
        navigate('/trip-details');
      },
    },
    {
      id: 'account',
      label: 'ACCOUNT',
      icon: <User size={22} />,
      active: window.location.hash === '#account',
      onClick: () => {
        alert('Executive Account Dossier: VIP Gold Member (Verified 5G Protocol)');
      },
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
      {/* Active Booking attached right above the bottom nav grid */}
      {confirmedRide && confirmedRide.status !== 'CANCELLED' && confirmedRide.status !== 'COMPLETED' && (
        <div className="w-full flex justify-center px-0">
          <div
            onClick={() => navigate('/trip-details')}
            className="w-full max-w-md bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#C89B3C] rounded-t-2xl p-3 shadow-[0_-5px_20px_rgba(0,0,0,0.6)] flex items-center justify-between cursor-pointer pointer-events-auto group border-t border-[#FCE79E]/40"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/20 flex-shrink-0 bg-black">
                <img src={telemetryImg} alt="Active Booking Preview" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans text-xs font-black tracking-wider uppercase text-black">
                    ACTIVE BOOKING
                  </span>
                  <span className="font-sans text-[10px] font-bold tracking-wide uppercase text-black/80 flex items-center">
                    • {confirmedRide.status ? confirmedRide.status.replace('_', ' ') : 'EN ROUTE'}
                  </span>
                </div>
                <p className="font-sans text-[11px] font-bold text-black uppercase tracking-tight truncate leading-tight">
                  {confirmedRide.driverName || 'Chauffeur'} • {confirmedRide.vehicleName || 'Vehicle'}
                </p>
              </div>
            </div>
            <div className="pl-2 text-black/80 group-hover:scale-110 transition-transform flex-shrink-0">
              <Sparkles size={20} />
            </div>
          </div>
        </div>
      )}

      <nav className="w-full bg-[#0A0B0E] border-t border-white/10 pt-2.5 pb-3 px-4 flex justify-center shadow-2xl pointer-events-auto">
        <div className="w-full max-w-md grid grid-cols-4 gap-1 items-center">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`col-span-1 w-full flex flex-col items-center justify-center gap-1.5 py-1 px-1 transition-all select-none ${
                item.active
                  ? 'text-[#D4AF37] font-bold'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <div className={`transition-transform ${item.active ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-widest uppercase font-sans font-bold truncate w-full text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};