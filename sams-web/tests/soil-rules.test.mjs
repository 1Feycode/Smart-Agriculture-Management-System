import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, test } from 'node:test'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

const soilEnvironment = await initializeTestEnvironment({
  projectId: 'demo-sams-soil-rules',
  firestore: {
    rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
  },
})

after(async () => {
  await soilEnvironment.cleanup()
})

test('soil tests enforce farmer ownership, admin assignment, and assigned-expert review', async () => {
  const farmerDb = soilEnvironment.authenticatedContext('soil-farmer-1', {
    email: 'farmer@example.test',
    email_verified: true,
  }).firestore()
  const otherFarmerDb = soilEnvironment.authenticatedContext('soil-farmer-2', {
    email: 'other@example.test',
    email_verified: true,
  }).firestore()
  const adminDb = soilEnvironment.authenticatedContext('soil-admin', {
    email: 'admin@example.test',
    email_verified: true,
  }).firestore()
  const assignedExpertDb = soilEnvironment.authenticatedContext('soil-expert-1', {
    email: 'expert@example.test',
    email_verified: true,
  }).firestore()
  const otherExpertDb = soilEnvironment.authenticatedContext('soil-expert-2', {
    email: 'other-expert@example.test',
    email_verified: true,
  }).firestore()
  const dataManagerDb = soilEnvironment.authenticatedContext('soil-data-manager', {
    email: 'data@example.test',
    email_verified: true,
  }).firestore()
  const anonymousDb = soilEnvironment.unauthenticatedContext().firestore()

  await soilEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const profileFixtures = [
      ['soil-farmer-1', 'farmer', 'active'],
      ['soil-farmer-2', 'farmer', 'active'],
      ['soil-admin', 'admin', 'active'],
      ['soil-expert-1', 'expert', 'active'],
      ['soil-expert-2', 'expert', 'active'],
      ['soil-expert-inactive', 'expert', 'inactive'],
      ['soil-data-manager', 'dataManager', 'active'],
    ]
    for (const [uid, role, status] of profileFixtures) {
      await setDoc(doc(db, `users/${uid}`), { uid, role, status })
    }

    await setDoc(doc(db, 'farms/soil-farm-1'), {
      ownerUid: 'soil-farmer-1',
      name: 'Farmer One Farm',
      location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
      size: 2,
      sizeUnit: 'hectare',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'farms/soil-farm-2'), {
      ownerUid: 'soil-farmer-2',
      name: 'Farmer Two Farm',
      location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
      size: 1,
      sizeUnit: 'acre',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  const farmRef = doc(farmerDb, 'farms/soil-farm-1')
  await assertSucceeds(updateDoc(farmRef, {
    soilType: 'Farmer-reported soil type',
    soilTexture: 'Farmer-reported texture',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(doc(otherFarmerDb, 'farms/soil-farm-1'), {
    soilType: 'Unauthorized change',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(farmRef, {
    soilType: 'x'.repeat(121),
    updatedAt: serverTimestamp(),
  }))

  const testDate = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))
  const soilTestData = {
    ownerUid: 'soil-farmer-1',
    farmId: 'soil-farm-1',
    testDate,
    sourceType: 'laboratory',
    sourceName: 'Regional soil laboratory',
    ph: 6.5,
    nutrients: {
      'Reported nutrient': { value: 12, unit: 'source-provided unit', method: 'source-provided method' },
    },
    verificationStatus: 'unverified',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const soilTestRef = doc(farmerDb, 'soilTests/soil-test-1')

  await assertSucceeds(setDoc(soilTestRef, soilTestData))
  await assertSucceeds(getDoc(soilTestRef))
  await assertSucceeds(getDocs(query(
    collection(farmerDb, 'soilTests'),
    where('ownerUid', '==', 'soil-farmer-1'),
    where('farmId', '==', 'soil-farm-1'),
    orderBy('testDate', 'desc'),
  )))
  await assertFails(getDoc(doc(otherFarmerDb, 'soilTests/soil-test-1')))
  await assertFails(getDoc(doc(anonymousDb, 'soilTests/soil-test-1')))
  await assertFails(getDoc(doc(dataManagerDb, 'soilTests/soil-test-1')))
  await assertFails(deleteDoc(soilTestRef))

  await assertFails(setDoc(doc(farmerDb, 'soilTests/foreign-farm-test'), {
    ...soilTestData,
    farmId: 'soil-farm-2',
  }))
  await assertFails(setDoc(doc(farmerDb, 'soilTests/future-test'), {
    ...soilTestData,
    testDate: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  }))
  await assertFails(setDoc(doc(farmerDb, 'soilTests/verified-at-submit'), {
    ...soilTestData,
    verificationStatus: 'verified',
  }))
  await assertFails(setDoc(doc(farmerDb, 'soilTests/self-assigned'), {
    ...soilTestData,
    assignedExpertUid: 'soil-expert-1',
  }))
  await assertFails(setDoc(doc(farmerDb, 'soilTests/self-reviewed'), {
    ...soilTestData,
    reviewNotes: 'Self-approved',
  }))
  await assertFails(setDoc(doc(farmerDb, 'soilTests/invalid-nutrients'), {
    ...soilTestData,
    nutrients: 'not a map',
  }))
  await assertFails(setDoc(doc(farmerDb, 'soilTests/invalid-source'), {
    ...soilTestData,
    sourceType: 'unapproved-source',
  }))

  await assertSucceeds(getDoc(doc(adminDb, 'soilTests/soil-test-1')))
  await assertFails(updateDoc(doc(adminDb, 'soilTests/soil-test-1'), {
    verificationStatus: 'verified',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(doc(adminDb, 'soilTests/soil-test-1'), {
    assignedExpertUid: 'soil-expert-inactive',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(doc(adminDb, 'soilTests/soil-test-1'), {
    assignedExpertUid: 'soil-farmer-2',
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(updateDoc(doc(adminDb, 'soilTests/soil-test-1'), {
    assignedExpertUid: 'soil-expert-1',
    updatedAt: serverTimestamp(),
  }))

  const expertTestRef = doc(assignedExpertDb, 'soilTests/soil-test-1')
  await assertSucceeds(getDoc(expertTestRef))
  await assertSucceeds(getDocs(query(
    collection(assignedExpertDb, 'soilTests'),
    where('assignedExpertUid', '==', 'soil-expert-1'),
    orderBy('testDate', 'desc'),
  )))
  await assertFails(getDocs(collection(assignedExpertDb, 'soilTests')))
  await assertFails(getDoc(doc(otherExpertDb, 'soilTests/soil-test-1')))
  await assertSucceeds(updateDoc(expertTestRef, {
    verificationStatus: 'verified',
    reviewNotes: 'Source and results reviewed by the assigned expert.',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(expertTestRef, {
    sourceName: 'Changed laboratory',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(expertTestRef, {
    ownerUid: 'soil-farmer-2',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(doc(farmerDb, 'soilTests/soil-test-1'), {
    verificationStatus: 'verified',
    updatedAt: serverTimestamp(),
  }))
})
