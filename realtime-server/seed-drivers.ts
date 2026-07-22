import { initializeApp, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_RTDB_URL = process.env.FIREBASE_DATABASE_URL || 'https://genial-charter-477621-j2-default-rtdb.firebaseio.com/';

if (!getApps().length) {
  initializeApp({
    databaseURL: DEFAULT_RTDB_URL
  });
}

const DEFAULT_VIP_DRIVERS = [
  { id: 'drv-1', name: 'Vin Diesel', location: { lat: 44.4268, lng: 26.1025 }, isAvailable: true, status: 'available' },
  { id: 'drv-2', name: 'Jason Statham', location: { lat: 44.4411, lng: 26.0964 }, isAvailable: true, status: 'available' },
  { id: 'drv-3', name: 'Jeremy Meeks', location: { lat: 44.4172, lng: 26.0664 }, isAvailable: true, status: 'available' },
  { id: 'drv-4', name: 'Baroian Sergiu-Ioan', location: { lat: 44.4715, lng: 26.0822 }, isAvailable: true, status: 'available' }
];

async function seedDrivers() {
  console.log('Seeding VIP drivers into Firebase Realtime Database (RTDB)...');
  
  const rtdb = getDatabase();
  const driversRef = rtdb.ref('drivers');
  const driversMap: Record<string, any> = {};
  
  for (const driver of DEFAULT_VIP_DRIVERS) {
    driversMap[driver.id] = driver;
    console.log(`Prepared ${driver.id} -> ${driver.name}`);
  }

  await driversRef.update(driversMap);
  console.log('Successfully seeded VIP drivers to RTDB!');
  process.exit(0);
}

seedDrivers().catch(err => {
  console.error('Error seeding drivers to RTDB:', err);
  process.exit(1);
});
