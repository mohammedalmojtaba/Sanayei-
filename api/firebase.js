import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  let serviceAccount;
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
  try {
    serviceAccount = JSON.parse(rawKey);
  } catch (e) {
    try {
      serviceAccount = JSON.parse(rawKey.replace(/\\n/g, '\n'));
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable');
    }
  }

  if (serviceAccount && serviceAccount.project_id) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
}

export const db = getFirestore();
