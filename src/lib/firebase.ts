import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDD3Pf7qtX0cLgaL8JMU7yIj0aRqao4va4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "genial-charter-477621-j2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "genial-charter-477621-j2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "genial-charter-477621-j2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "121175564495",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:121175564495:web:9ba169170084c88d9897ba"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = initializeFirestore(app, {}, 'noirride');
export const functions = getFunctions(app, 'us-central1');

// Connect to Local Emulators ONLY when VITE_USE_EMULATOR is explicitly set to 'true'
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  try {
    // Connect to local Cloud Functions Emulator on default port 5001
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    // Connect to Auth and Firestore Emulators if running locally
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.info('[NOIRRIDE PROTOCOL] Connected to Firebase Local Emulator Suite.');
  } catch (err) {
    console.warn('[NOIRRIDE PROTOCOL] Emulator connection already initialized or skipped:', err);
  }
}
