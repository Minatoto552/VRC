import { initializeApp } from 'firebase/app';
import { browserSessionPersistence, getAuth, setPersistence } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export const app = firebaseReady ? initializeApp(firebaseConfig) : undefined;
export const auth = app ? getAuth(app) : undefined;

if (auth) {
  void setPersistence(auth, browserSessionPersistence);
}

export const db = app ? getFirestore(app) : undefined;
export const functions = app ? getFunctions(app, 'asia-northeast1') : undefined;

if (app && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  if (db) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }

  if (functions) {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  }
}
