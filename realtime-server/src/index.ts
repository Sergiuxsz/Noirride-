import express from 'express';
import cors from 'cors';
import http from 'http';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

import { getDatabase } from 'firebase-admin/database';
import { dispatchBooking } from './BookingController';
import { calculatePriceHandler } from './PriceController';
import { FleetManager } from './FleetManager';
import { SimulationEngine } from './SimulationEngine';

const DEFAULT_RTDB_URL = process.env.FIREBASE_DATABASE_URL || 'https://genial-charter-477621-j2-default-rtdb.firebaseio.com/';

// Inițializare Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      databaseURL: DEFAULT_RTDB_URL
    });
    console.log(`[RealtimeServer] Firebase Admin initializat cu succes. (DB: ${DEFAULT_RTDB_URL})`);
  } catch (err: any) {
    console.warn('[RealtimeServer] Firebase initialization failed:', err.message);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Init fleet state and seed active dispatch routes
FleetManager.initialize().then(() => {
  // Listen to Firestore Rides for cancellations / SSOT
  try {
    const db = getFirestore('noirride');
    db.collection('rides').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const rtdb = getDatabase();
        if (change.type === 'modified') {
          const data = change.doc.data();
          rtdb.ref('fleet_updates').push({
            type: 'RIDE_STATUS_CHANGE',
            rideId: change.doc.id,
            status: data.status,
            notes: data.notes,
            timestamp: Date.now()
          });

          // Decouple rider & driver on completion/cancellation
          if (data.status === 'CANCELLED' || data.status === 'COMPLETED') {
            if (data.driverId) {
              FleetManager.setDriverAvailable(data.driverId);
              SimulationEngine.stopSimulation(data.driverId);
            }
          }

        } else if (change.type === 'added') {
          const data = change.doc.data();
          rtdb.ref('fleet_updates').push({
            type: 'RIDE_ADDED',
            ride: { id: change.doc.id, ...data },
            timestamp: Date.now()
          });
          
          if (data.status === 'SCHEDULED' && !data.routePolyline) {
            console.log(`[Dispatch] Triggering local simulation for new ride: ${change.doc.id}`);
            const axios = require('axios');
            axios.post('http://127.0.0.1:8080/api/dispatch', {
              rideId: change.doc.id,
              pickupLocation: data.pickupLocation,
              destination: data.destination,
              preferredDriverId: data.driverId
            }).catch((e: any) => console.error('[Local Trigger] Dispatch failed', e.message));
          }
        }
      });
    });
  } catch (err: any) {
    console.warn('[RealtimeServer] Firestore SSOT sync failed:', err.message);
  }
}).catch(err => console.error('[FleetManager] Init failed:', err));

app.post('/api/dispatch', dispatchBooking);
app.post('/api/rides/calculate-price', calculatePriceHandler);

app.get('/api/rides/active', async (req, res) => {
  try {
    const db = getFirestore('noirride');
    const ridesSnapshot = await db.collection('rides').where('status', 'in', ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS']).get();
    const activeRides: any[] = [];
    ridesSnapshot.forEach(doc => {
      activeRides.push({ id: doc.id, ...doc.data() });
    });
    res.json(activeRides);
  } catch (err) {
    console.error('[RealtimeServer] Error fetching active rides:', err);
    res.status(500).json({ error: 'Failed to fetch active rides' });
  }
});

// Deprecated /api/rides/:id endpoint removed — use Firestore onSnapshot instead.

app.get('/api/fleet', async (req, res) => {
  try {
    const drivers = FleetManager.getDrivers();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fleet status' });
  }
});



const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    try {
      const db = getDatabase();
      await db.ref('.info/connected').once('value');
      console.log('[Server Boot] RTDB connected successfully');
    } catch (err: any) {
      console.warn('[Server Boot] RTDB connection failed, continuing with in-memory fallbacks:', err.message || err);
    }

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server] Port ${PORT} is already in use. Kill the other process or use a different port.`);
        process.exit(1);
      } else {
        console.error('[Server] HTTP server error:', err);
        process.exit(1);
      }
    });

    server.listen(PORT, () => {
      console.log(`[Server] Real-Time Engine & Price Calculator listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start HTTP server:', error);
    process.exit(1);
  }
};

startServer();
