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

async function cancelAllRides() {
  const db = getFirestore('noirride');
  const ridesRef = db.collection('rides');
  const snapshot = await ridesRef.get();
  
  if (snapshot.empty) {
    console.log('No rides found.');
    return;
  }
  
  let canceledCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.status !== 'CANCELLED' && data.status !== 'COMPLETED') {
      await doc.ref.update({ status: 'CANCELLED', notes: 'Cancelled by administrator via batch script.' });
      canceledCount++;
      console.log(`Cancelled ride ${doc.id}`);
    }
  }
  
  console.log(`Successfully cancelled ${canceledCount} active reservations.`);
  process.exit(0);
}

cancelAllRides().catch(console.error);
