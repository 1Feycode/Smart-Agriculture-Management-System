import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const missingFirebaseKeys = Object.entries(config)
  .filter(([, value]) => !value?.trim())
  .map(([key]) => key)

export const isFirebaseConfigured = missingFirebaseKeys.length === 0

export interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  firestore: Firestore
  storage: FirebaseStorage
}

let servicesPromise: Promise<FirebaseServices> | undefined

export function initializeFirebase(): Promise<FirebaseServices> | null {
  if (!isFirebaseConfigured) return null

  servicesPromise ??= loadFirebaseServices()
  return servicesPromise
}

async function loadFirebaseServices(): Promise<FirebaseServices> {
  const [appSdk, authSdk, firestoreSdk, storageSdk] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
    import('firebase/storage'),
  ])
  const app = appSdk.getApps().length > 0 ? appSdk.getApp() : appSdk.initializeApp(config)

  return {
    app,
    auth: authSdk.getAuth(app),
    firestore: firestoreSdk.getFirestore(app),
    storage: storageSdk.getStorage(app),
  }
}
