import express from 'express';
import cors from 'cors';
import http from 'http';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { connectRedis } from './redis';
import { FleetWebSocket } from './FleetWebSocket';
import { dispatchBooking } from './BookingController';
import { calculatePriceHandler } from './PriceController';
import { FleetManager } from './FleetManager';

dotenv.config();

// Inițializare Firebase Admin
if (!getApps().length) {
  try {
    initializeApp();
    console.log('[RealtimeServer] Firebase Admin initializat cu succes.');
  } catch (err: any) {
    console.warn('[RealtimeServer] Firebase initialization failed:', err.message);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
import axios from 'axios';

// Inițializare WebSocket Gateway cu Redis Pub/Sub
const fleetWs = new FleetWebSocket(server);

// Init fleet state and seed active dispatch routes
FleetManager.initialize().then(() => {
  // Listen to Firestore Rides for cancellations / SSOT
  try {
    const db = getFirestore('noirride');
    db.collection('rides').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          
          // Broadcast status change to clients securely
          fleetWs.broadcast(JSON.stringify({
            type: 'RIDE_STATUS_CHANGE',
            rideId: change.doc.id,
            status: data.status,
            notes: data.notes
          }));
        } else if (change.type === 'added') {
          const data = change.doc.data();
          fleetWs.broadcast(JSON.stringify({
            type: 'RIDE_ADDED',
            ride: { id: change.doc.id, ...data }
          }));
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

app.get('/api/rides/:id', (req, res) => {
  res.status(404).json({ error: 'Endpoint deprecated' });
});

app.get('/api/fleet', async (req, res) => {
  try {
    const drivers = await FleetManager.getDriversFromRedis();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fleet status' });
  }
});



const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    // Attempt Redis connection without aborting server if Redis is down/unreachable
    await connectRedis().catch((err) => {
      console.warn('[Server Boot] Redis connection failed, continuing with in-memory fallbacks:', err.message || err);
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
