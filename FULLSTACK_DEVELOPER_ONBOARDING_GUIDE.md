# Noirride - Fullstack Developer Onboarding & Architecture Guide

Welcome to **Noirride**, an ultra-premium chauffeur booking and real-time dispatch management platform. 

This document is designed to get any new fullstack developer completely up to speed on the system architecture, codebase structure, data flows, and technical decisions within **30 minutes**.

---

## 1. High-Level Architectural Philosophy

Noirride employs a **Dual-Architecture Strategy** to optimize cost, latency, and operational reliability:

```text
+-----------------------------------------------------------------------------------+
|                                 SYSTEM ARCHITECTURE                               |
+-----------------------------------------------------------------------------------+

 [ CLIENT APP (React / Vite) ]              [ DISPATCH DASHBOARD (React / Vite) ]
        |                                                 |
        | 1. Create Booking (Callable HTTP)               | Poll /api/rides/active
        v                                                 v
 +-----------------------------+              +-------------------------------------+
 |  FIREBASE CLOUD FUNCTIONS   |              |   NODE.JS REALTIME SERVER           |
 |  (Serverless Control Plane) |              |   (High-Frequency Data Plane)       |
 +-----------------------------+              +-------------------------------------+
        |                                                 |
        | 2. Trigger Simulation (HTTP POST)               | 3. Query Route (Directions API)
        +------------------------------------------------>|
        |                                                 v
        |                                     +-------------------------------------+
        |                                     |    GOOGLE MAPS DIRECTIONS API       |
        |                                     +-------------------------------------+
        |                                                 |
        |                                                 | 4. Returns Raw Geometry
        v                                                 v
 +-----------------------------+              +-------------------------------------+
 |    FIREBASE FIRESTORE       |<-------------|          SIMULATION ENGINE          |
 |  (Persistent Storage)       | 5. Throttled |        (1-Second Telemetry Loop)    |
 |                             |    Sync (5s) +-------------------------------------+
 | - rides                     |                          |                 |
 | - drivers                   |       Real-Time Push     |                 | State Sync
 | - vehicles                  |       (1s WebSocket)     v                 v
 +-----------------------------+         +------------------+     +-----------------+
                                         | WEBSOCKET SERVER |     | UPSTASH REDIS   |
                                         |  (ws/fleet)      |     | (Pub/Sub & Cache|
                                         +------------------+     +-----------------+
                                                  |                         |
                                                  +-------------------------+
                                                               |
                                                               v
                                                  [ Live GPS & Route Polylines ]
```

### Why a Dual Architecture?
- **Control Plane (Firebase Functions & Firestore)**: Used for transactional, low-frequency operations requiring authorization, role-based security, and document persistence (e.g., placing bookings, updating account details, managing user roles).
- **Data Plane (Realtime Node.js Server & Redis)**: Used for high-frequency telemetry, 60fps-like vehicle animation simulation, and low-latency WebSocket streaming. Direct writing to Firestore at 60Hz per car would blow past database quotas and freeze UI listeners.

---

## 2. Directory & Module Breakdown

The repository is structured into three main modules:

### 📱 Frontend Application (`/src`)
A modern React SPA powered by Vite, TypeScript, TailwindCSS, and Google Maps API.

- **`src/context/RideContext.tsx`**: Central state engine for bookings, vehicle lists, active dispatches, and polling `realtime-server` endpoints (`/api/fleet`, `/api/rides/active`).
- **`src/services/api.ts`**: Unified frontend API gateway. Routes transactional tasks to Firebase Functions and live data tasks to the Node.js server.
- **`src/components/booking/ClientLiveMap.tsx`**: Renders live client trip map, listens to native WebSockets (`ws/fleet`), smoothly interpolates marker movements, and draws polyline paths (`rawGeometry`).
- **`src/components/dashboard/FleetLiveMap.tsx`**: Renders the Dispatcher fleet operations map, tracking multiple active vehicles simultaneously.
- **`src/pages/dashboard/DispatchDashboardPage.tsx`**: Executive command center showing total operations, active transfers, revenue, and live dispatch table.

### ⚡ Realtime Engine (`/realtime-server`)
A dedicated Express & WebSocket server written in TypeScript.

- **`src/index.ts`**: Express server bootstrap, mounts REST endpoints (`/api/fleet`, `/api/rides/active`, `/api/rides/simulate`).
- **`src/SimulationEngine.ts`**: Runs the 1-second interval loop for active trips. Emits WebSockets, syncs Redis pipelines every 1s, and throttles Firestore document updates to every 5s.
- **`src/FleetManager.ts`**: In-memory and Redis-synced registry of all 4 VIP drivers (`Vin Diesel`, `Jason Statham`, `Jeremy Meeks`, `Baroian Sergiu-Ioan`).
- **`src/redis.ts`**: Dual-engine Redis connection. Attempts TCP connection via `node-redis`, falling back seamlessly to `@upstash/redis` HTTP REST if TCP is blocked.
- **`src/GoogleMapsService.ts`**: Integrates with Google Maps Directions API to fetch polyline points (`rawGeometry`) and step-by-step route coordinates.

### 🛡️ Serverless Control Plane (`/functions`)
Firebase Cloud Functions v2 for RPC backend logic.

- **`src/controllers/booking.controller.ts`**: Handles `createBooking`, `cancelBooking`, `updateRideStatus`, `getRideDetails`.
- **`src/services/booking.service.ts`**: Computes base prices, creates Firestore records, and triggers the `realtime-server` simulation via HTTP POST.
- **`src/utils/rbac.ts`**: Role-based access control (Admin, Dispatcher, VIP Customer).

---

## 3. Core Data Flow Walkthroughs

### Scenario A: VIP Client Books a Chauffeur Ride
1. **User Request**: Client fills pickup, destination, vehicle, and hits "Confirm Reservation" on the frontend.
2. **Callable Function**: `api.createBooking()` invokes Firebase Function `createBooking`.
3. **Persist Order**: `bookingService.createBooking()` writes a new document to Firestore under collection `rides/{rideId}` with status `SCHEDULED`.
4. **Trigger Simulation**: The Firebase Function makes an asynchronous HTTP POST to `http://<realtime-server>/api/rides/simulate`.
5. **Route Calculation**: `BookingController` on the Realtime Server calls `GoogleMapsService.getRoute()`, generating `routeGeometry` (1-sec steps) and `rawGeometry` (polyline control points).
6. **Simulation Loop**: `SimulationEngine.startSimulation()` registers the trip and sets the driver to `BUSY`.
7. **Client Telemetry**: User is redirected to `/trip-details`. `ClientLiveMap` connects to `ws://<realtime-server>/ws/fleet`, receives `LOCATION_UPDATE` events containing `rawGeometry` and current coordinates, rendering the car moving in real time.

### Scenario B: Operator Manages Dispatch Command Center
1. **Dashboard Load**: Operator opens `/dispatch`.
2. **Active Rides Fetch**: `RideContext` calls `api.getActiveRides()`, which hits `/api/rides/active` on the Realtime Server.
3. **State Merge**: `RideContext` merges active simulations into the local rides list.
4. **WebSocket Stream**: `FleetLiveMap` connects to `ws/fleet`. On every tick (1s), driver locations and route polylines are updated on the map without page refreshes or manual polling.

---

## 4. Primary Data Schemas & Storage Keys

### Firestore Collections

#### Collection: `rides`
```json
{
  "id": "NR-8942",
  "userId": "usr_123",
  "customerName": "Victoria Kensington",
  "customerEmail": "victoria@kensington.co.uk",
  "pickupLocation": "Mayfair Hotel, London",
  "destination": "Heathrow Airport Terminal 5",
  "status": "EN_ROUTE",
  "driverId": "drv-1",
  "driverName": "Vin Diesel",
  "price": 380,
  "routePolyline": [{ "lat": 51.5074, "lng": -0.1278 }],
  "currentLocation": { "lat": 51.5080, "lng": -0.1285 },
  "currentEta": 142
}
```

#### Collection: `drivers`
```json
{
  "id": "drv-1",
  "name": "Vin Diesel",
  "isAvailable": false,
  "currentRideId": "NR-8942",
  "location": { "lat": 51.5080, "lng": -0.1285 },
  "lastUpdate": 1753142000000
}
```

### Redis Keys
- **`fleet_state`**: Stringified JSON array of all drivers and their availability (`FleetManager.syncToRedis()`).
- **`driver:{driverId}:location`**: Last known coordinate object `{ lat, lng }`.
- **`ride:{rideId}:state`**: Object containing `{ status, currentEta }`.
- **Pub/Sub Channel `fleet_updates`**: Broadcasts `STATUS_CHANGE` and `LOCATION_UPDATE` events.

---

## 5. Developer Cheat Sheet & Gotchas

> [!IMPORTANT]
> **Firestore Throttling**: The `SimulationEngine` runs every 1 second, but only writes to Firestore every **5 seconds**. Do not assume Firestore has 1-second accuracy. For 1-second accuracy, rely on WebSockets or Redis.

> [!TIP]
> **Dual Redis Fallback**: If standard Redis TCP fails (port 6379 blocked), `redis.ts` will silently failover to Upstash REST API. Always test both when modifying database drivers.

> [!WARNING]
> **Canonical Driver Names**: Driver names are strictly tied to VIP profiles (`Vin Diesel`, `Jason Statham`, `Jeremy Meeks`, `Baroian Sergiu-Ioan`). Ensure driver IDs (`drv-1` through `drv-4`) match across both `DEFAULT_DRIVERS` in the frontend and `FleetManager` in the server.

---

## 6. How to Run Locally

1. **Install Dependencies**:
   ```bash
   npm install
   cd realtime-server && npm install
   cd ../functions && npm install
   ```

2. **Start Development Stack**:
   - **Terminal 1 (Frontend Vite)**: `npm run dev` (Runs on `http://localhost:5173`)
   - **Terminal 2 (Realtime Server)**: `cd realtime-server && npm run dev` (Runs on `http://localhost:8080`)

3. **Verify System Status**:
   - `http://localhost:8080/health` -> Returns `{ status: 'OK' }`.
   - `http://localhost:5173/dispatch` -> Renders Executive Command Center with active fleet drivers.
