import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RideProvider } from './context/RideContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
const BookRidePage = React.lazy(() => import('./pages/customer/BookRidePage').then(module => ({ default: module.BookRidePage })));
const UpcomingRidePage = React.lazy(() => import('./pages/customer/UpcomingRidePage').then(module => ({ default: module.UpcomingRidePage })));
const VehicleSelectPage = React.lazy(() => import('./pages/customer/VehicleSelectPage').then(module => ({ default: module.VehicleSelectPage })));
const BookingReviewPage = React.lazy(() => import('./pages/customer/BookingReviewPage').then(module => ({ default: module.BookingReviewPage })));
const DispatchDashboardPage = React.lazy(() => import('./pages/dashboard/DispatchDashboardPage').then(module => ({ default: module.DispatchDashboardPage })));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage').then(module => ({ default: module.RegisterPage })));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const HelpPage = React.lazy(() => import('./pages/support/HelpPage').then(module => ({ default: module.HelpPage })));
const LanguagePage = React.lazy(() => import('./pages/preferences/LanguagePage').then(module => ({ default: module.LanguagePage })));
const AdminRolesPage = React.lazy(() => import('./pages/admin/AdminRolesPage').then(module => ({ default: module.AdminRolesPage })));
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isDispatch = location.pathname.startsWith('/dispatch') || location.pathname.startsWith('/adminroles');

  return (
    <div className="min-h-screen text-content flex flex-col font-sans selection:bg-gold-500 selection:text-primary relative pb-16 bg-primary transition-colors">
      {/* Background Starry sky overlay that pulses on the dispatch page */}
      <div
        className={`fixed inset-0 pointer-events-none -z-20 bg-[url('./assets/starry-bg.webp')] bg-[length:500px] bg-repeat bg-center bg-fixed transition-all ${isDispatch ? 'animate-bg-pulse-seconds' : ''
          }`}
      />

      <Navbar />
      <main className="flex-1 z-10">
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center pt-20"><div className="animate-pulse-ring w-16 h-16 rounded-full border-2 border-[#D4AF37]"></div></div>}>
          <Routes>
          {/* Customer Experience Surface — Unified Booking Flow */}
          <Route path="/" element={<BookRidePage />} />
          <Route path="/trip-details" element={<UpcomingRidePage />} />
          <Route path="/fleet" element={<VehicleSelectPage />} />
          <Route path="/review-booking" element={<BookingReviewPage />} />

          {/* Authentication, Support & Preference Surface */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/language" element={<LanguagePage />} />

          {/* Operator Dispatch Command & Secret Administration Surfaces */}
          <Route
            path="/dispatch"
            element={
              <ProtectedRoute requireAdmin>
                <DispatchDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminroles"
            element={
              <ProtectedRoute requireAdmin>
                <AdminRolesPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </React.Suspense>
      </main>
      <BottomNav />
    </div>
  );
};

import { AuthProvider } from './context/AuthContext';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RideProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </RideProvider>
    </AuthProvider>
  );
};

export default App;
