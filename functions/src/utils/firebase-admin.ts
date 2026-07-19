import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'genial-charter-477621-j2',
  });
}

export const db = getFirestore('noirride');
export const auth = admin.auth();
export const adminSdk = admin;
