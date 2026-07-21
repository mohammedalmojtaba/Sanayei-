import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  let serviceAccount;
  try {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT;
    serviceAccount = JSON.parse(rawKey);
  } catch (e) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n'));
  }

  initializeApp({
    credential: cert(serviceAccount)
  });
}

export const db = getFirestore();
