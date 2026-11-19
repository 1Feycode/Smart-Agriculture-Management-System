import { initializeFirebase } from '../lib/firebase'
import {
  isFarmSizeUnit,
  type Farm,
  type FarmInput,
  type FarmPage,
  type FarmSort,
  type FarmStatus,
} from '../types/farm'
import type { AdministrativeLocation } from '../types/user'
import type { QueryConstraint } from 'firebase/firestore'

const pageSize = 25

export async function listFarms(
  ownerUid: string,
  status: FarmStatus,
  options: {
    cursor?: FarmPage['nextCursor']
    search?: string
    sort?: FarmSort
  } = {},
): Promise<FarmPage> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')
  const search = options.search?.trim() ?? ''
  const constraints: QueryConstraint[] = [
    firestoreSdk.where('ownerUid', '==', ownerUid),
    firestoreSdk.where('status', '==', status),
  ]
  if (search) {
    constraints.push(
      firestoreSdk.where('name', '>=', search),
      firestoreSdk.where('name', '<=', `${search}\uf8ff`),
      firestoreSdk.orderBy('name'),
    )
  } else if (options.sort === 'name') {
    constraints.push(firestoreSdk.orderBy('name'))
  } else {
    constraints.push(firestoreSdk.orderBy('updatedAt', 'desc'))
  }
  if (options.cursor) constraints.push(firestoreSdk.startAfter(options.cursor))
  constraints.push(firestoreSdk.limit(pageSize))

  const snapshot = await firestoreSdk.getDocs(
    firestoreSdk.query(firestoreSdk.collection(services.firestore, 'farms'), ...constraints),
  )

  return {
    farms: snapshot.docs.map((farmSnapshot) => parseFarm(farmSnapshot.data(), farmSnapshot.id)),
    nextCursor: snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null,
  }
}

export async function countActiveFarms(ownerUid: string): Promise<number> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')
  const farmsQuery = firestoreSdk.query(
    firestoreSdk.collection(services.firestore, 'farms'),
    firestoreSdk.where('ownerUid', '==', ownerUid),
    firestoreSdk.where('status', '==', 'active'),
  )
  const snapshot = await firestoreSdk.getCountFromServer(farmsQuery)
  return snapshot.data().count
}

export async function getFarm(farmId: string): Promise<Farm | null> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')
  const snapshot = await firestoreSdk.getDoc(
    firestoreSdk.doc(services.firestore, 'farms', farmId),
  )

  return snapshot.exists() ? parseFarm(snapshot.data(), snapshot.id) : null
}

export async function createFarm(ownerUid: string, input: FarmInput): Promise<string> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')
  const now = firestoreSdk.serverTimestamp()
  const farm = await firestoreSdk.addDoc(
    firestoreSdk.collection(services.firestore, 'farms'),
    {
      ...input,
      ownerUid,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
  )
  return farm.id
}

export async function updateFarm(farmId: string, input: FarmInput): Promise<void> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')

  await firestoreSdk.updateDoc(firestoreSdk.doc(services.firestore, 'farms', farmId), {
    ...input,
    updatedAt: firestoreSdk.serverTimestamp(),
  })
}

export async function setFarmStatus(farmId: string, status: FarmStatus): Promise<void> {
  const services = await getFirebaseServices()
  const firestoreSdk = await import('firebase/firestore')

  await firestoreSdk.updateDoc(firestoreSdk.doc(services.firestore, 'farms', farmId), {
    status,
    updatedAt: firestoreSdk.serverTimestamp(),
  })
}

function parseFarm(value: unknown, id: string): Farm {
  if (!isRecord(value)) throw new Error('This farm record has an invalid format.')

  const { ownerUid, name, location, size, sizeUnit, status, createdAt, updatedAt } = value
  if (
    typeof ownerUid !== 'string'
    || typeof name !== 'string'
    || !isAdministrativeLocation(location)
    || typeof size !== 'number'
    || !Number.isFinite(size)
    || size <= 0
    || !isFarmSizeUnit(sizeUnit)
    || (status !== 'active' && status !== 'archived')
    || !isTimestamp(createdAt)
    || !isTimestamp(updatedAt)
  ) {
    throw new Error('This farm record is incomplete or invalid.')
  }

  return { id, ownerUid, name, location, size, sizeUnit, status, createdAt, updatedAt }
}

function isAdministrativeLocation(value: unknown): value is AdministrativeLocation {
  return isRecord(value)
    && Object.keys(value).length === 3
    && isValidLocationText(value.region)
    && isValidLocationText(value.district)
    && isValidLocationText(value.community)
}

function isValidLocationText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 100
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is Farm['createdAt'] {
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

export function farmErrorMessage(error: unknown): string {
  const code = getErrorCode(error)
  if (code === 'permission-denied') {
    return 'Firestore denied this request. Confirm the latest Rules are deployed and that your verified farmer profile is active.'
  }
  if (code === 'unavailable' || code === 'deadline-exceeded' || code === 'network-request-failed') {
    return 'The farm service could not be reached. Check your connection and try again.'
  }
  return error instanceof Error ? error.message : 'The farm request could not be completed.'
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined
  return typeof error.code === 'string' ? error.code.replace(/^firestore\//, '') : undefined
}
