import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore('noirride');

const VALID_DRIVERS = ['drv-1', 'drv-2', 'drv-3', 'drv-4'];

async function purge() {
  console.log('Starting purge...');
  
  // 1. Delete all rides to provide a clean slate
  const ridesSnapshot = await db.collection('rides').get();
  let deletedRides = 0;
  
  // Create a batch to delete all rides efficiently
  const batch = db.batch();
  ridesSnapshot.forEach(doc => {
    batch.delete(doc.ref);
    deletedRides++;
  });
  await batch.commit();
  console.log(`Deleted ${deletedRides} rides from Firestore.`);

  // 2. Cleanup drivers
  const driversSnapshot = await db.collection('drivers').get();
  for (const doc of driversSnapshot.docs) {
    if (!VALID_DRIVERS.includes(doc.id)) {
      await doc.ref.delete();
      console.log(`Deleted ghost driver: ${doc.id}`);
    } else {
      await doc.ref.set({
        isAvailable: true,
        status: 'available',
        currentRideId: null,
        destination: null,
        queuedRide: null,
        // Keep the existing location
      }, { merge: true });
      console.log(`Reset driver: ${doc.id}`);
    }
  }

  console.log('Purge complete! Database is now clean.');
  process.exit(0);
}

purge().catch(err => {
  console.error('Error purging data:', err);
  process.exit(1);
});
