import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_RTDB_URL = process.env.FIREBASE_DATABASE_URL || 'https://genial-charter-477621-j2-default-rtdb.firebaseio.com/';

if (!getApps().length) {
  initializeApp({
    databaseURL: DEFAULT_RTDB_URL
  });
}

async function fixTestingState() {
  const db = getFirestore('noirride');
  const rtdb = getDatabase();
  
  console.log('1. Canceling all active rides in Firestore...');
  const ridesRef = db.collection('rides');
  const snapshot = await ridesRef.get();
  
  let canceledCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.status !== 'CANCELLED' && data.status !== 'COMPLETED') {
      await doc.ref.update({ status: 'CANCELLED', notes: 'Force cancelled for testing.' });
      canceledCount++;
    }
  }
  console.log(`Cancelled ${canceledCount} rides in Firestore.`);

  console.log('2. Resetting all drivers in RTDB to AVAILABLE...');
  const driversSnapshot = await rtdb.ref('drivers').once('value');
  const driversData = driversSnapshot.val() || {};
  for (const driverId of Object.keys(driversData)) {
    await rtdb.ref(`drivers/${driverId}`).update({
      isAvailable: true,
      status: 'AVAILABLE',
      currentRideId: null,
      destination: null,
      queuedRide: null
    });
  }
  console.log('Drivers reset.');

  console.log('3. Pushing CANCELLED updates to fleet_updates for any active rides...');
  for (const doc of snapshot.docs) {
      await rtdb.ref('fleet_updates').push({
        type: 'RIDE_STATUS_CHANGE',
        rideId: doc.id,
        status: 'CANCELLED',
        timestamp: Date.now()
      });
  }
  console.log('Fleet updates pushed.');

  process.exit(0);
}

fixTestingState().catch(console.error);
