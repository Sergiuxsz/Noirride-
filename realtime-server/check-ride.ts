import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore('noirride');

async function checkRide() {
  const ridesSnapshot = await db.collection('rides').limit(5).get();
  ridesSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Ride ${doc.id}: status=${data.status}, routePolyline length=${data.routePolyline?.length}`);
    if (data.routePolyline) {
        console.log('Sample point:', data.routePolyline[0]);
    }
  });
  process.exit(0);
}

checkRide().catch(console.error);
