import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore('noirride');

async function checkData() {
  console.log('Fetching data from Firestore...');
  
  const driversSnapshot = await db.collection('drivers').get();
  console.log(`\n--- Drivers Collection (${driversSnapshot.size} documents) ---`);
  driversSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Name: ${data.name} | Status: ${data.status || (data.isAvailable ? 'available' : 'busy')}`);
  });

  const ridesSnapshot = await db.collection('rides').get();
  let enRouteCount = 0;
  console.log(`\n--- Rides Collection (${ridesSnapshot.size} documents) ---`);
  ridesSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.status === 'EN_ROUTE') enRouteCount++;
    console.log(`ID: ${doc.id} | Status: ${data.status} | Driver: ${data.driverName}`);
  });

  console.log(`\nSummary: ${driversSnapshot.size} drivers, ${ridesSnapshot.size} rides (of which ${enRouteCount} are EN_ROUTE).`);
  process.exit(0);
}

checkData().catch(err => {
  console.error('Error fetching data:', err);
  process.exit(1);
});
