import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
  initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'genial-charter-477621-j2',
  });
}

const mockFleet = [
  {
    id: 'veh-4',
    name: 'Rolls-Royce Phantom VIII',
    category: 'executive',
    tagline: 'Flagship Executive Luxury',
    passengers: 3,
    luggage: 3,
    basePrice: 450,
    ratePerHour: 350,
    image: '/assets/fleet/phantom.png',
    features: ['Armored Body', 'Champagne Bar', 'Starlight Headliner'],
    isAvailable: true,
  },
  {
    id: 'veh-1',
    name: 'Mercedes-Benz S-Class (Maybach Executive)',
    category: 'executive',
    tagline: 'Precision German Chauffeur Suite',
    passengers: 3,
    luggage: 3,
    basePrice: 220,
    ratePerHour: 180,
    image: '/assets/fleet/maybach.png',
    features: ['Executive Rear Seating', 'Burmester 4D Audio'],
    isAvailable: true,
  },
];

async function seedVehicles() {
  console.log('Seeding VIP vehicles into Firestore...');
  const db = getFirestore();
  const batch = db.batch();
  const collection = db.collection('vehicles');

  for (const vehicle of mockFleet) {
    const docRef = collection.doc(vehicle.id);
    batch.set(docRef, vehicle);
    console.log(`Prepared ${vehicle.id} -> ${vehicle.name}`);
  }

  await batch.commit();
  console.log('Successfully seeded VIP vehicles to Firestore!');
  process.exit(0);
}

seedVehicles().catch(err => {
  console.error('Error seeding vehicles to Firestore:', err);
  process.exit(1);
});
