import { Platform } from 'react-native';
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists at runtime but is missing from some type defs
import { getReactNativePersistence } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, type Firestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { connectAuthEmulator } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let auth: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

// Firebase (namely getAuth/initializeAuth) throws synchronously when the API key is
// missing or malformed, which would otherwise crash the whole app at import time when
// the developer hasn't set up their .env yet. Everything below is guarded so the app can
// still boot and show a friendly message instead of a white/error screen.
if (isFirebaseConfigured) {
  try {
    const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

    if (Platform.OS === 'web') {
      auth = getAuth(app);
    } else {
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        auth = getAuth(app);
      }
    }

    // ignoreUndefinedProperties lets forms omit optional fields (e.g. no photo, no
    // teacher assigned) without Firestore rejecting the write for containing `undefined`.
    dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
    storageInstance = getStorage(app);

    if (useEmulator) {
      connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(dbInstance, emulatorHost, 8080);
      connectStorageEmulator(storageInstance, emulatorHost, 9199);
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

export const firebaseAuth = auth as Auth;
export const db = dbInstance as Firestore;
export const storage = storageInstance as FirebaseStorage;
