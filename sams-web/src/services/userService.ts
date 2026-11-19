import type { Timestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { initializeFirebase } from '../lib/firebase'
import { isUserRole, type ManagedUserRole, type UserProfile, type UserRole } from '../types/user'

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')
  const profileSnapshot = await firestoreSdk.getDoc(
    firestoreSdk.doc(services.firestore, 'users', uid),
  )

  if (!profileSnapshot.exists()) {
    throw new Error('Your account profile has not been provisioned yet.')
  }

  return parseUserProfile(profileSnapshot.data(), uid)
}

export async function observeUserProfile(
  uid: string,
  onChange: (profile: UserProfile) => void,
  onError: (error: Error) => void,
): Promise<() => void> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')

  return firestoreSdk.onSnapshot(
    firestoreSdk.doc(services.firestore, 'users', uid),
    (profileSnapshot) => {
      if (!profileSnapshot.exists()) {
        onError(new Error('Your account profile is not available.'))
        return
      }

      try {
        onChange(parseUserProfile(profileSnapshot.data(), uid))
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Your account profile is invalid.'))
      }
    },
    onError,
  )
}

export async function createFarmerProfileIfMissing(user: User): Promise<void> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')
  const profileRef = firestoreSdk.doc(services.firestore, 'users', user.uid)
  const displayName = user.displayName?.trim()
  const email = user.email?.trim()

  if (!displayName || !email) {
    throw new Error('A name and email address are required to create your profile.')
  }

  await firestoreSdk.runTransaction(services.firestore, async (transaction) => {
    const profileSnapshot = await transaction.get(profileRef)
    if (profileSnapshot.exists()) return

    transaction.set(profileRef, {
      uid: user.uid,
      displayName,
      email,
      role: 'farmer',
      status: 'active',
      createdAt: firestoreSdk.serverTimestamp(),
      updatedAt: firestoreSdk.serverTimestamp(),
    })
  })
}

export async function listUserProfiles(): Promise<UserProfile[]> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')
  const snapshot = await firestoreSdk.getDocs(
    firestoreSdk.collection(services.firestore, 'users'),
  )

  return snapshot.docs
    .map((profile) => parseUserProfile(profile.data(), profile.id))
    .sort((left, right) => left.displayName.localeCompare(right.displayName))
}

export async function createManagedUserProfile(
  profile: Pick<UserProfile, 'uid' | 'displayName' | 'email'> & { role: ManagedUserRole },
): Promise<void> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')
  const now = firestoreSdk.serverTimestamp()

  await firestoreSdk.setDoc(
    firestoreSdk.doc(services.firestore, 'users', profile.uid),
    {
      ...profile,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
  )
}

export async function updateManagedUserAccess(
  uid: string,
  role: UserRole,
  status: 'active' | 'inactive',
): Promise<void> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')

  await firestoreSdk.updateDoc(firestoreSdk.doc(services.firestore, 'users', uid), {
    role,
    status,
    updatedAt: firestoreSdk.serverTimestamp(),
  })
}

export async function updateUserProfile(uid: string, displayName: string): Promise<UserProfile> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')

  await firestoreSdk.updateDoc(firestoreSdk.doc(services.firestore, 'users', uid), {
    displayName,
    updatedAt: firestoreSdk.serverTimestamp(),
  })

  return getUserProfile(uid)
}

function parseUserProfile(value: unknown, expectedUid: string): UserProfile {
  if (!isRecord(value)) {
    throw new Error('The account profile has an invalid format.')
  }

  const { uid, displayName, email, role, status, location, createdAt, updatedAt } = value
  if (
    uid !== expectedUid
    || typeof displayName !== 'string'
    || typeof email !== 'string'
    || !isUserRole(role)
    || typeof status !== 'string'
  ) {
    throw new Error('The account profile is incomplete or invalid.')
  }

  return {
    uid,
    displayName,
    email,
    role,
    status,
    ...(isRecord(location) ? { location } : {}),
    ...(isTimestamp(createdAt) ? { createdAt } : {}),
    ...(isTimestamp(updatedAt) ? { updatedAt } : {}),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is Timestamp {
  return isRecord(value)
    && typeof value.seconds === 'number'
    && typeof value.nanoseconds === 'number'
    && 'toDate' in value
    && typeof value.toDate === 'function'
    && 'toMillis' in value
    && typeof value.toMillis === 'function'
}

async function getFirebaseServices() {
  const services = await initializeFirebase()
  if (!services) {
    throw new Error('Firebase is not configured. Add the required VITE_FIREBASE values to sams-web/.env.')
  }
  return services
}
