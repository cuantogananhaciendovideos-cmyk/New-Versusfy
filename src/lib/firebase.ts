// Versusfy Firebase - v2.2.0-OMNI (Tactical Sync)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const runtimeConfig = (window as any).VERSUSFY_RUNTIME_CONFIG || {};

const getEnv = (key: string) => {
  const baseKey = key.replace('VITE_FIREBASE_', '').replace('FIREBASE_', '');
  
  // Transform DATABASE_ID -> databaseId
  const parts = baseKey.toLowerCase().split('_');
  const camelKey = parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  
  return runtimeConfig[camelKey] || 
         runtimeConfig[baseKey] ||
         runtimeConfig[baseKey.toLowerCase()] ||
         runtimeConfig[key] ||
         process.env[key] || 
         (import.meta as any).env?.[key];
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

const databaseId = getEnv('VITE_FIREBASE_DATABASE_ID') || runtimeConfig.databaseId || runtimeConfig.firestoreDatabaseId;
const projectId = firebaseConfig.projectId;

let app: any = null;
let db: any = null;
let auth: any = null;

console.log(`Versusfy v2.2.0-OMNI: Systems Check [PID: ${projectId ? projectId.slice(0, 4) + '***' : 'MISSING'}, DB: ${databaseId || 'DEFAULT'}]`);

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    
    // Use the detected database ID or default if none/invalid.
    // TACTICAL FIX: If the user provided the Project ID as the Database ID, it's likely a mistake.
    // Most users should use '(default)'.
    let effectiveDbId: string | undefined = undefined;
    
    if (databaseId && databaseId !== '(default)') {
      // If databaseId is exactly the same as projectId, it's suspicious but we'll try it
      // unless it's clearly a placeholder.
      effectiveDbId = databaseId;
    }

    if (effectiveDbId) {
      db = getFirestore(app, effectiveDbId);
      console.log(`✅ Firebase: Connected to database ID: ${effectiveDbId}`);
    } else {
      db = getFirestore(app);
      console.log(`✅ Firebase: Using (default) database.`);
    }
    
    auth = getAuth(app);
  } else {
    console.warn("Versusfy: Configuration missing. Please verify your VITE_ environment variables.");
  }
} catch (error: any) {
  if (error.message?.includes('could not reach')) {
    console.error("❌ Firebase Connection Error: Could not reach Firestore. Ad-blockers detected.");
  } else {
    console.error("❌ Firebase v2.2.0-OMNI: Tactical Lock Failure.", error);
  }
}

export { db, auth };
