import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

initializeApp();

async function test() {
  try {
    const db = getFirestore('noirride');
    await db.collection('test').doc('test').set({ test: true });
    console.log('SUCCESS');
  } catch (err: any) {
    console.error('ERROR:', err.message);
  }
}
test();
