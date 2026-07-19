const admin = require('firebase-admin');

// Initialize admin SDK for genial-charter-477621-j2
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'genial-charter-477621-j2'
  });
}

const db = admin.firestore();

const mockFleet = {
  'veh-4': {
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
  'veh-1': {
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
  'veh-2': {
    id: 'veh-2',
    name: 'Mercedes-Benz V-Class (VIP Lounge)',
    category: 'luxury-van',
    tagline: 'Moving Boardroom & Mobile Office',
    passengers: 7,
    luggage: 6,
    basePrice: 180,
    ratePerHour: 140,
    image: '/assets/fleet/vclass.png',
    features: ['Face-to-Face Conference Seating', 'Wi-Fi & Apple TV'],
    isAvailable: true,
  }
};

const mockDrivers = {
  'drv-1': {
    id: 'drv-1',
    name: 'Alistair Vance',
    phone: '+44 7700 900088',
    isAvailable: true,
    rating: 4.9,
    vehicleId: 'veh-4'
  },
  'drv-2': {
    id: 'drv-2',
    name: 'Marcus Sterling',
    phone: '+44 7700 900099',
    isAvailable: true,
    rating: 4.8,
    vehicleId: 'veh-1'
  }
};

async function seed() {
  console.log('Starting Firestore Seeding for genial-charter-477621-j2...');
  
  // Seed Vehicles
  for (const [id, vehicle] of Object.entries(mockFleet)) {
    await db.collection('vehicles').doc(id).set(vehicle);
    console.log(`Successfully seeded vehicle: ${vehicle.name} (${id})`);
  }

  // Seed Drivers
  for (const [id, driver] of Object.entries(mockDrivers)) {
    await db.collection('drivers').doc(id).set(driver);
    console.log(`Successfully seeded driver: ${driver.name} (${id})`);
  }

  console.log('Database seeding successfully completed!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
});
