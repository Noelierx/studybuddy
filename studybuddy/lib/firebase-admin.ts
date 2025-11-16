import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "study-buddy-6d0b7",
};

let firebaseAdminApp;
const existingApps = getApps();

const adminAppExists = existingApps.find(app => app.name === 'admin');

if (adminAppExists) {
  firebaseAdminApp = adminAppExists;
} else {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseAdminApp = initializeApp({
        ...firebaseAdminConfig,
        credential: cert(serviceAccount)
      }, 'admin');
    } else {
      firebaseAdminApp = initializeApp(firebaseAdminConfig, 'admin');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    const existingDefaultApp = existingApps.find(app => app.name === '[DEFAULT]');
    if (existingDefaultApp) {
      firebaseAdminApp = existingDefaultApp;
    } else {
      firebaseAdminApp = initializeApp(firebaseAdminConfig, 'admin-fallback');
    }
  }
}

export const adminDb = getFirestore(firebaseAdminApp);
export { firebaseAdminApp as adminApp };
