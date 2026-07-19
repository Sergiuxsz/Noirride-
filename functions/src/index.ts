// NoirRide Cloud Functions Entry Point
// Exporting Callable Controller & HTTP API Routes

export {
  createBooking,
  cancelBooking,
  getRideDetails,
  updateRideStatus,
} from './controllers/booking.controller';

export {
  registerVIPUser,
  verifyVIPSession,
  createAuthSessionCookie,
  assignUserRole,
  adminSearchUsers,
  adminPromoteUser,
  adminRevokeUserRole,
  adminDeleteAccount,
  logoutAuthSession,
  sendVerificationCode,
  verifyProtocolCode,
  seedDatabase,
  authApi,
} from './controllers/session.controller';
