// Firebase client setup. Imported only from client components.
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True once every Firebase value in .env.local has been filled in. */
export const isFirebaseConfigured = Object.values(config).every(Boolean);

// Reuse the existing app during hot reloads instead of initialising twice.
const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null;

/**
 * In the browser, Firestore keeps a copy of your data in IndexedDB, so profiles,
 * My List and Continue Watching still show when you're offline, and changes
 * made offline sync once you reconnect. (On the server it stays in memory.)
 */
function createDb(app: FirebaseApp): Firestore {
  if (typeof window === "undefined") return getFirestore(app);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Already initialised (hot reload): reuse it.
    return getFirestore(app);
  }
}

export const auth = app ? getAuth(app) : null;
export const db = app ? createDb(app) : null;
