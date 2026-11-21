import { initializeFirebase } from '../lib/firebase'
import {
  isSoilSourceType,
  isSoilVerificationStatus,
  type SoilNutrientValue,
  type SoilTest,
  type SoilTestInput,
  type SoilTestPage,
  type SoilVerificationStatus,
} from '../types/soil'

const pageSize = 50

export async function listFarmerSoilTests(
  ownerUid: string,
  farmId: string,
  cursor?: SoilTestPage['nextCursor'],
): Promise<SoilTestPage> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const constraints = [
    sdk.where('ownerUid', '==', ownerUid),
    sdk.where('farmId', '==', farmId),
    sdk.orderBy('testDate', 'desc'),
    ...(cursor ? [sdk.startAfter(cursor)] : []),
    sdk.limit(pageSize),
  ]
  return readPage(sdk, firestore, constraints)
}

export async function listAssignedSoilTests(
  expertUid: string,
  cursor?: SoilTestPage['nextCursor'],
): Promise<SoilTestPage> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const constraints = [
    sdk.where('assignedExpertUid', '==', expertUid),
    sdk.orderBy('testDate', 'desc'),
    ...(cursor ? [sdk.startAfter(cursor)] : []),
    sdk.limit(pageSize),
  ]
  return readPage(sdk, firestore, constraints)
}

export async function listRecentSoilTests(
  cursor?: SoilTestPage['nextCursor'],
): Promise<SoilTestPage> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const constraints = [
    sdk.orderBy('testDate', 'desc'),
    ...(cursor ? [sdk.startAfter(cursor)] : []),
    sdk.limit(pageSize),
  ]
  return readPage(sdk, firestore, constraints)
}

export async function getSoilTest(soilTestId: string): Promise<SoilTest | null> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const snapshot = await sdk.getDoc(sdk.doc(firestore, 'soilTests', soilTestId))
  return snapshot.exists() ? parseSoilTest(snapshot.data(), snapshot.id) : null
}

export async function createSoilTest(ownerUid: string, input: SoilTestInput): Promise<string> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const testDate = parseTestDate(input.testDate)
  const now = sdk.serverTimestamp()
  const record = await sdk.addDoc(sdk.collection(firestore, 'soilTests'), {
    ownerUid,
    farmId: input.farmId,
    testDate: sdk.Timestamp.fromDate(testDate),
    sourceType: input.sourceType,
    sourceName: input.sourceName.trim(),
    ...(input.ph !== undefined ? { ph: input.ph } : {}),
    ...(input.nutrients ? { nutrients: input.nutrients } : {}),
    ...(input.soilType ? { soilType: input.soilType.trim() } : {}),
    ...(input.texture ? { texture: input.texture.trim() } : {}),
    verificationStatus: 'unverified',
    createdAt: now,
    updatedAt: now,
  })
  return record.id
}

export async function assignSoilTest(
  soilTestId: string,
  assignedExpertUid: string | null,
): Promise<void> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  await sdk.updateDoc(sdk.doc(firestore, 'soilTests', soilTestId), {
    assignedExpertUid,
    updatedAt: sdk.serverTimestamp(),
  })
}

export async function reviewSoilTest(
  soilTestId: string,
  verificationStatus: SoilVerificationStatus,
  reviewNotes: string,
): Promise<void> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  await sdk.updateDoc(sdk.doc(firestore, 'soilTests', soilTestId), {
    verificationStatus,
    reviewNotes: reviewNotes.trim() || sdk.deleteField(),
    updatedAt: sdk.serverTimestamp(),
  })
}

async function readPage(
  sdk: typeof import('firebase/firestore'),
  firestore: import('firebase/firestore').Firestore,
  constraints: import('firebase/firestore').QueryConstraint[],
): Promise<SoilTestPage> {
  const snapshot = await sdk.getDocs(sdk.query(sdk.collection(firestore, 'soilTests'), ...constraints))
  return {
    records: snapshot.docs.map((item) => parseSoilTest(item.data(), item.id)),
    nextCursor: snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null,
  }
}

function parseSoilTest(value: unknown, id: string): SoilTest {
  if (!isRecord(value)) throw new Error('This soil-test record has an invalid format.')
  const {
    ownerUid,
    farmId,
    testDate,
    sourceType,
    sourceName,
    ph,
    nutrients,
    soilType,
    texture,
    verificationStatus,
    reviewNotes,
    assignedExpertUid,
    createdAt,
    updatedAt,
  } = value
  const parsedNutrients = parseNutrients(nutrients)

  if (
    !isNonEmptyString(ownerUid)
    || !isNonEmptyString(farmId)
    || !isTimestamp(testDate)
    || !isSoilSourceType(sourceType)
    || !isNonEmptyString(sourceName)
    || !isOptionalNumberOrNull(ph)
    || !isOptionalTextOrNull(soilType)
    || !isOptionalTextOrNull(texture)
    || !isSoilVerificationStatus(verificationStatus)
    || !isOptionalTextOrNull(reviewNotes)
    || !isOptionalTextOrNull(assignedExpertUid)
    || !isTimestamp(createdAt)
    || !isTimestamp(updatedAt)
  ) {
    throw new Error('This soil-test record is incomplete or invalid.')
  }

  return {
    id,
    ownerUid,
    farmId,
    testDate,
    sourceType,
    sourceName,
    ...(ph !== undefined ? { ph } : {}),
    ...(parsedNutrients ? { nutrients: parsedNutrients } : {}),
    ...(soilType !== undefined ? { soilType } : {}),
    ...(texture !== undefined ? { texture } : {}),
    verificationStatus,
    ...(reviewNotes !== undefined ? { reviewNotes } : {}),
    ...(assignedExpertUid !== undefined ? { assignedExpertUid } : {}),
    createdAt,
    updatedAt,
  }
}

function parseNutrients(value: unknown): Record<string, SoilNutrientValue> | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) throw new Error('Soil nutrient data has an invalid format.')

  return Object.fromEntries(Object.entries(value).map(([name, entry]) => {
    if (
      !name.trim()
      || !isRecord(entry)
      || typeof entry.value !== 'number'
      || !Number.isFinite(entry.value)
      || !isNonEmptyString(entry.unit)
      || (entry.method !== undefined && typeof entry.method !== 'string')
      || Object.keys(entry).some((key) => !['value', 'unit', 'method'].includes(key))
    ) {
      throw new Error(`The nutrient result "${name}" is incomplete or invalid.`)
    }

    return [name, {
      value: entry.value,
      unit: entry.unit,
      ...(typeof entry.method === 'string' ? { method: entry.method } : {}),
    }]
  }))
}

function parseTestDate(date: string): Date {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || Number.isNaN(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== date
    || date > new Date().toISOString().slice(0, 10)
  ) {
    throw new Error('Enter a valid test date that is not in the future.')
  }
  return parsed
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalTextOrNull(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string'
}

function isOptionalNumberOrNull(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is SoilTest['testDate'] {
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

export function soilErrorMessage(error: unknown): string {
  const code = getErrorCode(error)
  if (code === 'permission-denied') {
    return 'You do not have permission to access this soil record. Confirm that your account is active and the record is assigned to you when required.'
  }
  if (code === 'unavailable' || code === 'deadline-exceeded' || code === 'network-request-failed') {
    return 'The soil-record service could not be reached. Check your connection and try again.'
  }
  return error instanceof Error ? error.message : 'The soil-record request could not be completed.'
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined
  return typeof error.code === 'string' ? error.code.replace(/^firestore\//, '') : undefined
}
