# Noirride Codebase Architecture: Module by Module

This document provides a comprehensive, module-by-module breakdown of the Noirride project file tree. The application is divided into three primary modules: the **Frontend React Application**, the **Realtime Express Server**, and the **Firebase Cloud Functions**.

---

## 1. Frontend Application (`/src`)
The frontend is a modern React application built with Vite, TypeScript, and TailwindCSS. It provides the VIP customer booking interface and the dispatcher dashboard.

### `src/components/` (UI Building Blocks)
Contains reusable React components structured by their domain.
- **`layout/`**: Structural components like `Navbar` and `BottomNav` that wrap the application.
- **`auth/`**: Components handling authentication flows, including `ProtectedRoute` to restrict access to admin/dispatcher routes.
- **Generic UI**: Buttons, cards, and modal components used across different pages.

### `src/pages/` (Views & Routing)
Top-level page components rendered by React Router in `App.tsx`.
- **`customer/`**: The core VIP booking flow (`BookRidePage`, `VehicleSelectPage`, `BookingReviewPage`, `UpcomingRidePage`).
- **`dashboard/`**: The `DispatchDashboardPage` used by admins to monitor the fleet in real-time.
- **`auth/`**: `LoginPage` and `RegisterPage`.
- **`admin/` & `support/`**: Role management and help center pages.

### `src/context/` (Global State Management)
Handles application-wide state using React Context API.
- **`RideContext.tsx`**: The core state manager for the booking flow. It maintains the active booking state, synchronizes live fleet status via WebSockets, and caches pricing calculations.
- **`AuthContext.tsx`**: Manages user sessions, roles (VIP vs. Admin), and permissions using Firebase Auth.

### `src/services/` (External Integrations)
- **`api.ts`**: The API Gateway for the frontend. It abstracts all network calls, routing transactional requests (like booking creation) to Firebase Cloud Functions, and high-frequency requests (like pricing or simulation) to the Realtime Node.js Server.
- **`googlePlaces.ts`**: Handles interactions with the Google Maps Places API for address autocomplete and geocoding.

### `src/lib/` & `src/types/` (Core Configuration)
- **`firebase.ts`**: Initializes the Firebase SDK (Auth, Firestore, Functions) for the client.
- **`types/`**: Contains shared TypeScript interfaces (`Ride`, `Vehicle`, `Driver`, `BookingFormState`) ensuring type safety across the frontend.

---

## 2. Real-Time Backend Engine (`/realtime-server`)
A dedicated Node.js/Express server built for high-throughput, low-latency operations that serverless functions cannot handle efficiently (e.g., WebSockets, continuous simulations).

### `realtime-server/src/`
- **`index.ts`**: The entry point. Initializes the Express server, Firebase Admin SDK, and mounts REST endpoints and the WebSocket gateway.
- **`SimulationEngine.ts`**: The core algorithmic heart of the platform. Runs a 1-second interval loop (heartbeat) to simulate car movements along polyline routes. Implements rate-limiting/throttling to write to Firestore every 5 seconds while updating Redis/WebSockets instantly.
- **`FleetManager.ts`**: An in-memory data grid representing the live state of all drivers. Used for sub-millisecond dispatching and driver availability checks.
- **`redis.ts`**: A resilient, dual-engine Redis client. It attempts a fast TCP connection but gracefully degrades to an Upstash HTTPS REST API if the TCP socket is blocked by firewalls.
- **`FleetWebSocket.ts`**: A WebSocket server that subscribes to Redis pub/sub channels (`fleet_updates`) and broadcasts driver locations and statuses to connected frontend clients.
- **`BookingController.ts` & `PriceController.ts`**: Express route handlers for triggering ride simulations and calculating dynamic pricing (with Redis caching).

---

## 3. Serverless Backend (`/functions`)
Firebase Cloud Functions used for secure, transactional Remote Procedure Calls (RPC).

- **`functions/` directory**: Contains secure backend endpoints that don't require persistent real-time connections. Typical responsibilities include:
  - Creating and canceling bookings securely (interacting with Firestore).
  - Registering VIP users and assigning role-based access control (RBAC).
  - Generating and verifying session cookies.
- **`seed-db.js`**: A utility script used to populate the Firestore database with initial mock data (vehicles, drivers, admin users) during deployment or local testing.

---

## 4. Root Configuration Files
- **`vite.config.ts`**: Configuration for the Vite bundler (optimizations, plugins).
- **`tailwind.config.js` / `postcss.config.js`**: Styling definitions, custom color palettes (`#D4AF37` gold accents), and Tailwind plugins.
- **`firebase.json`**: Deployment configuration for Firebase Hosting (serves the built Vite frontend) and Firebase Functions.
- **`package.json`**: Dependency management and workspace scripts (e.g., `npm run dev`).
