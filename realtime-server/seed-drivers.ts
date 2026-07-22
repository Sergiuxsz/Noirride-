import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore('noirride');

const DEFAULT_VIP_DRIVERS = [
  { id: 'drv-1', name: 'Vin Diesel', location: { lat: 44.4268, lng: 26.1025 }, isAvailable: true, status: 'available' },
  { id: 'drv-2', name: 'Jason Statham', location: { lat: 44.4411, lng: 26.0964 }, isAvailable: true, status: 'available' },
  { id: 'drv-3', name: 'Jeremy Meeks', location: { lat: 44.4172, lng: 26.0664 }, isAvailable: true, status: 'available' },
  { id: 'drv-4', name: 'Baroian Sergiu-Ioan', location: { lat: 44.4715, lng: 26.0822 }, isAvailable: true, status: 'available' }
];

async function seedDrivers() {
  console.log('Seeding VIP drivers into Firestore...');
  
  for (const driver of DEFAULT_VIP_DRIVERS) {
    await db.collection('drivers').doc(driver.id).set(driver, { merge: true });
    console.log(`Updated ${driver.id} -> ${driver.name}`);
  }

  console.log('Successfully moved hardcoded drivers to Firestore!');
  process.exit(0);
}

seedDrivers().catch(err => {
  console.error('Error seeding drivers:', err);
  process.exit(1);
});
