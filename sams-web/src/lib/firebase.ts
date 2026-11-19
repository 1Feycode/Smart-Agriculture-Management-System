import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'

const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim()

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(storageBucket ? { storageBucket } : {}),
}

export const missingFirebaseKeys = Object.entries({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
})
  .filter(([, value]) => !value?.trim())
  .map(([key]) => key)

export const isFirebaseConfigured = missingFirebaseKeys.length === 0

export interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  firestore: Firestore
}

let servicesPromise: Promise<FirebaseServices> | undefined
let storagePromise: Promise<FirebaseStorage> | undefined

export function initializeFirebase(): Promise<FirebaseServices> | null {
  if (!isFirebaseConfigured) return null

  servicesPromise ??= loadFirebaseServices()
  return servicesPromise
}

export function initializeFirebaseStorage(): Promise<FirebaseStorage> | null {
  if (!storageBucket) return null

  const services = initializeFirebase()
  if (!services) return null

  storagePromise ??= services.then(async ({ app }) => {
    const storageSdk = await import('firebase/storage')
    return storageSdk.getStorage(app)
  })

  return storagePromise
}

async function loadFirebaseServices(): Promise<FirebaseServices> {
  const [appSdk, authSdk, firestoreSdk] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ])
  const app = appSdk.getApps().length > 0 ? appSdk.getApp() : appSdk.initializeApp(config)

  return {
    app,
    auth: authSdk.getAuth(app),
    firestore: firestoreSdk.getFirestore(app),
  }
}
