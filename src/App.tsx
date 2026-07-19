import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RideProvider } from './context/RideContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { BookRidePage } from './pages/customer/BookRidePage';
import { UpcomingRidePage } from './pages/customer/UpcomingRidePage';
import { VehicleSelectPage } from './pages/customer/VehicleSelectPage';
import { BookingReviewPage } from './pages/customer/BookingReviewPage';
import { DispatchDashboardPage } from './pages/dashboard/DispatchDashboardPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LoginPage } from './pages/auth/LoginPage';
import { HelpPage } from './pages/support/HelpPage';
import { LanguagePage } from './pages/preferences/LanguagePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRolesPage } from './pages/admin/AdminRolesPage';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isDispatch = location.pathname.startsWith('/dispatch') || location.pathname.startsWith('/adminroles');

  return (
    <div className="min-h-screen text-[#F8FAFC] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#0A0B0E] relative pb-16">
      {/* Background Starry sky overlay that pulses on the dispatch page */}
      <div
        className={`fixed inset-0 pointer-events-none -z-20 bg-[url('./assets/starry-bg.png')] bg-[length:500px] bg-repeat bg-center bg-fixed transition-all ${isDispatch ? 'animate-bg-pulse-seconds' : ''
          }`}
      />

      <Navbar />
      <main className="flex-1 z-10">
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
