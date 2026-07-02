import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const hasFirebaseConfig =
  Boolean(import.meta.env.VITE_FIREBASE_API_KEY) &&
  Boolean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) &&
  Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID) &&
  Boolean(import.meta.env.VITE_FIREBASE_APP_ID);

const firebaseConfig = useEmulators
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'emulator-api-key',
      authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'event-cafe-2026.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'event-cafe-2026',
      storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'event-cafe-2026.firebasestorage.app',
      messagingSenderId:
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '67193431354',
      appId:
        import.meta.env.VITE_FIREBASE_APP_ID || '1:67193431354:web:62a0367b774407709cdc03',
    }
  : hasFirebaseConfig
    ? {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      }
    : null;

let auth: Auth | null = null;
let functions: Functions | null = null;

if (firebaseConfig) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  functions = getFunctions(app, 'asia-northeast1');

  if (useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  }
}

export const runtimeMode = useEmulators
  ? 'emulator'
  : hasFirebaseConfig
    ? 'firebase'
    : 'sample';

export const firebaseServices = {
  auth,
  functions,
};
