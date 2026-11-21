import { initializeFirebase } from '../lib/firebase'
import {
  isCropReviewStatus,
  isCropStatus,
  type Crop,
  type CropCategory,
  type CropCategoryInput,
  type CropInput,
} from '../types/crop'

export async function listPublicCrops(): Promise<Crop[]> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const snapshot = await sdk.getDocs(sdk.query(
    sdk.collection(firestore, 'crops'),
    sdk.where('isPublic', '==', true),
    sdk.where('status', '==', 'active'),
    sdk.where('reviewStatus', '==', 'approved'),
    sdk.orderBy('name'),
  ))
  return snapshot.docs.map((item) => parseCrop(item.data(), item.id))
}

export async function getPublicCrop(cropId: string): Promise<Crop | null> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const snapshot = await sdk.getDoc(sdk.doc(firestore, 'crops', cropId))
  return snapshot.exists() ? parseCrop(snapshot.data(), snapshot.id) : null
}

export async function listPublicCropCategories(): Promise<CropCategory[]> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const snapshot = await sdk.getDocs(sdk.query(
    sdk.collection(firestore, 'cropCategories'),
    sdk.where('status', '==', 'active'),
    sdk.orderBy('name'),
  ))
  return snapshot.docs.map((item) => parseCategory(item.data(), item.id))
}

export async function listManagedCrops(): Promise<Crop[]> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const snapshot = await sdk.getDocs(sdk.query(
    sdk.collection(firestore, 'crops'),
    sdk.orderBy('name'),
  ))
  return snapshot.docs.map((item) => parseCrop(item.data(), item.id))
}

export async function listManagedCropCategories(): Promise<CropCategory[]> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const snapshot = await sdk.getDocs(sdk.query(
    sdk.collection(firestore, 'cropCategories'),
    sdk.orderBy('name'),
  ))
  return snapshot.docs.map((item) => parseCategory(item.data(), item.id))
}

export async function getManagedCrop(cropId: string): Promise<Crop | null> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const snapshot = await sdk.getDoc(sdk.doc(firestore, 'crops', cropId))
  return snapshot.exists() ? parseCrop(snapshot.data(), snapshot.id) : null
}

export async function createCrop(input: CropInput, editorUid: string): Promise<string> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const now = sdk.serverTimestamp()
  const record = await sdk.addDoc(sdk.collection(firestore, 'crops'), {
    ...compactCropInput(input),
    createdAt: now,
    updatedAt: now,
    updatedByUid: editorUid,
  })
  return record.id
}

export async function updateCrop(
  cropId: string,
  input: CropInput,
  editorUid: string,
): Promise<void> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  await sdk.updateDoc(sdk.doc(firestore, 'crops', cropId), {
    ...compactCropInput(input),
    updatedAt: sdk.serverTimestamp(),
    updatedByUid: editorUid,
  })
}

export async function createCropCategory(input: CropCategoryInput): Promise<string> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  const now = sdk.serverTimestamp()
  const record = await sdk.addDoc(sdk.collection(firestore, 'cropCategories'), {
    ...input,
    createdAt: now,
    updatedAt: now,
  })
  return record.id
}

export async function updateCropCategory(
  categoryId: string,
  input: CropCategoryInput,
): Promise<void> {
  const { firestore } = await getFirebaseServices()
  const sdk = await import('firebase/firestore')
  await sdk.updateDoc(sdk.doc(firestore, 'cropCategories', categoryId), {
    ...input,
    updatedAt: sdk.serverTimestamp(),
  })
}

function compactCropInput(input: CropInput): CropInput {
  return {
    name: input.name.trim(),
    categoryId: input.categoryId,
    source: input.source.trim(),
    reviewStatus: input.reviewStatus,
    isPublic: input.isPublic,
    status: input.status,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(input.soilGuidance?.trim() ? { soilGuidance: input.soilGuidance.trim() } : {}),
    ...(input.plantingSeason?.trim() ? { plantingSeason: input.plantingSeason.trim() } : {}),
    ...(input.waterGuidance?.trim() ? { waterGuidance: input.waterGuidance.trim() } : {}),
    ...(input.growthDuration?.trim() ? { growthDuration: input.growthDuration.trim() } : {}),
    ...(input.harvestPeriod?.trim() ? { harvestPeriod: input.harvestPeriod.trim() } : {}),
  }
}

function parseCrop(value: unknown, id: string): Crop {
  if (!isRecord(value)) throw new Error('This crop record has an invalid format.')
  const { name, categoryId, source, updatedByUid } = value

  if (
    !isNonEmptyString(name)
    || !isNonEmptyString(categoryId)
    || !isNonEmptyString(source)
    || !isNonEmptyString(updatedByUid)
    || !isOptionalString(value.description)
    || !isOptionalString(value.soilGuidance)
    || !isOptionalString(value.plantingSeason)
    || !isOptionalString(value.waterGuidance)
    || !isOptionalString(value.growthDuration)
    || !isOptionalString(value.harvestPeriod)
    || !isCropReviewStatus(value.reviewStatus)
    || !isCropStatus(value.status)
    || typeof value.isPublic !== 'boolean'
    || !isTimestamp(value.createdAt)
    || !isTimestamp(value.updatedAt)
  ) {
    throw new Error('This crop record is incomplete or invalid.')
  }

  return {
    id,
    name,
    categoryId,
    source,
    reviewStatus: value.reviewStatus,
    isPublic: value.isPublic,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    updatedByUid,
    ...(typeof value.description === 'string' ? { description: value.description } : {}),
    ...(typeof value.soilGuidance === 'string' ? { soilGuidance: value.soilGuidance } : {}),
    ...(typeof value.plantingSeason === 'string' ? { plantingSeason: value.plantingSeason } : {}),
    ...(typeof value.waterGuidance === 'string' ? { waterGuidance: value.waterGuidance } : {}),
    ...(typeof value.growthDuration === 'string' ? { growthDuration: value.growthDuration } : {}),
    ...(typeof value.harvestPeriod === 'string' ? { harvestPeriod: value.harvestPeriod } : {}),
  }
}

function parseCategory(value: unknown, id: string): CropCategory {
  if (!isRecord(value)) throw new Error('This crop category has an invalid format.')
  if (
    !isNonEmptyString(value.name)
    || typeof value.description !== 'string'
    || !isCropStatus(value.status)
    || !isTimestamp(value.createdAt)
    || !isTimestamp(value.updatedAt)
  ) {
    throw new Error('This crop category is incomplete or invalid.')
  }
  return {
    id,
    name: value.name,
    description: value.description,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is Crop['createdAt'] {
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
