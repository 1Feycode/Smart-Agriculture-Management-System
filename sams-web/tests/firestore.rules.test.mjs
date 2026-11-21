import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, test } from 'node:test'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

const testEnvironment = await initializeTestEnvironment({
  projectId: 'demo-sams-profile-rules',
  firestore: {
    rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
  },
})

after(async () => {
  await testEnvironment.cleanup()
})

test('farmers self-register and only superadmins can manage user roles and status', async () => {
  const farmerDb = testEnvironment.authenticatedContext('farmer-1', {
    email: 'farmer@example.test',
    email_verified: true,
  }).firestore()
  const otherFarmerDb = testEnvironment.authenticatedContext('farmer-2', {
    email: 'other@example.test',
    email_verified: true,
  }).firestore()
  const noRoleDb = testEnvironment.authenticatedContext('farmer-3', {
    email: 'third@example.test',
    email_verified: true,
  }).firestore()
  const unverifiedFarmerDb = testEnvironment.authenticatedContext('farmer-4', {
    email: 'unverified@example.test',
  }).firestore()
  const anonymousDb = testEnvironment.unauthenticatedContext().firestore()
  const adminDb = testEnvironment.authenticatedContext('admin-1', {
    email: 'admin@example.test',
    email_verified: true,
  }).firestore()
  const dataManagerDb = testEnvironment.authenticatedContext('data-manager-1', {
    email: 'manager@example.test',
    email_verified: true,
  }).firestore()
  const superadminDb = testEnvironment.authenticatedContext('superadmin-1', {
    email: 'superadmin@example.test',
  }).firestore()
  const profileRef = doc(farmerDb, 'users/farmer-1')

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'users/admin-1'), {
      uid: 'admin-1',
      displayName: 'Catalog Administrator',
      email: 'admin@example.test',
      role: 'admin',
      status: 'active',
    })
    await setDoc(doc(db, 'users/data-manager-1'), {
      uid: 'data-manager-1',
      displayName: 'Data Manager',
      email: 'manager@example.test',
      role: 'dataManager',
      status: 'active',
    })
    await setDoc(doc(db, 'cropCategories/grains'), {
      name: 'Grains',
      description: 'Grain crops',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'crops/maize'), {
      name: 'Maize',
      categoryId: 'grains',
      description: 'Approved crop catalog test record',
      source: 'Test source',
      reviewStatus: 'approved',
      isPublic: true,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: 'admin-1',
    })
    await setDoc(doc(db, 'crops/draft'), {
      name: 'Draft crop',
      categoryId: 'grains',
      source: 'Test source',
      reviewStatus: 'pending',
      isPublic: false,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: 'admin-1',
    })
  })

  await assertSucceeds(runTransaction(farmerDb, async (transaction) => {
    const snapshot = await transaction.get(profileRef)
    assert.equal(snapshot.exists(), false)
    transaction.set(profileRef, {
      uid: 'farmer-1',
      displayName: 'Amina Farmer',
      email: 'farmer@example.test',
      role: 'farmer',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }))

  await assertSucceeds(getDoc(profileRef))
  await assertFails(getDoc(doc(otherFarmerDb, 'users/farmer-1')))
  await assertFails(getDoc(doc(anonymousDb, 'users/farmer-1')))
  await assertFails(getDoc(doc(noRoleDb, 'users/farmer-1')))
  await assertFails(getDocs(collection(farmerDb, 'users')))
  await assertFails(getDoc(doc(farmerDb, 'farms/farm-1')))
  await assertFails(setDoc(doc(unverifiedFarmerDb, 'farms/unverified-farm'), {
    ownerUid: 'farmer-4',
    name: 'Unverified Farm',
    location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
    size: 1,
    sizeUnit: 'acre',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))

  await assertSucceeds(updateDoc(profileRef, {
    displayName: 'Amina Updated',
    location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(profileRef, {
    role: 'admin',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(profileRef, {
    status: 'disabled',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(profileRef, {
    email: 'changed@example.test',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(profileRef, {
    location: { region: 'Ashanti' },
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(farmerDb, 'users/farmer-admin'), {
    uid: 'farmer-admin',
    displayName: 'Self-promoted',
    email: 'farmer@example.test',
    role: 'admin',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(setDoc(doc(noRoleDb, 'users/farmer-3'), {
    uid: 'farmer-3',
    displayName: 'No Role',
    email: 'third@example.test',
    role: 'farmer',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/farmer-2'), {
      uid: 'farmer-2',
      displayName: 'Other Farmer',
      email: 'other@example.test',
      role: 'farmer',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  const farmRef = doc(farmerDb, 'farms/farm-1')
  await assertSucceeds(setDoc(farmRef, {
    ownerUid: 'farmer-1',
    name: 'North Plot',
    location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
    size: 2.5,
    sizeUnit: 'hectare',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(getDoc(farmRef))
  await assertSucceeds(updateDoc(farmRef, {
    cropIds: ['maize'],
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(farmRef, {
    cropIds: 'maize',
    updatedAt: serverTimestamp(),
  }))
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'farms/farm-other'), {
      ownerUid: 'farmer-2',
      name: 'Other Farmer Farm',
      location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
      size: 1,
      sizeUnit: 'acre',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  await assertSucceeds(getDocs(query(
    collection(farmerDb, 'farms'),
    where('ownerUid', '==', 'farmer-1'),
    where('status', '==', 'active'),
    orderBy('updatedAt', 'desc'),
  )))
  const activeFarmCount = await getCountFromServer(query(
    collection(farmerDb, 'farms'),
    where('ownerUid', '==', 'farmer-1'),
    where('status', '==', 'active'),
  ))
  assert.equal(activeFarmCount.data().count, 1)
  await assertFails(getDocs(collection(farmerDb, 'farms')))
  await assertFails(getDoc(doc(otherFarmerDb, 'farms/farm-1')))
  await assertFails(getDoc(doc(farmerDb, 'farms/farm-other')))
  await assertFails(updateDoc(doc(farmerDb, 'farms/farm-other'), {
    name: 'Changed by another farmer',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(farmerDb, 'farms/farm-spoof'), {
    ownerUid: 'farmer-2',
    name: 'Spoofed Farm',
    location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
    size: 1,
    sizeUnit: 'acre',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(farmerDb, 'farms/farm-invalid-size'), {
    ownerUid: 'farmer-1',
    name: 'Invalid Farm',
    location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
    size: 0,
    sizeUnit: 'acre',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(farmerDb, 'farms/farm-invalid-unit'), {
    ownerUid: 'farmer-1',
    name: 'Invalid Unit',
    location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
    size: 1,
    sizeUnit: 'square-meter',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(farmerDb, 'farms/farm-invalid-location'), {
    ownerUid: 'farmer-1',
    name: 'Invalid Farm',
    location: { region: 'Ashanti', district: 'Kumasi' },
    size: 1,
    sizeUnit: 'acre',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(farmRef, {
    ownerUid: 'farmer-2',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(farmRef, {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(farmRef, {
    size: -2,
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(updateDoc(farmRef, {
    name: 'North Plot Updated',
    size: 3,
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(updateDoc(farmRef, {
    status: 'archived',
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(getDocs(query(
    collection(farmerDb, 'farms'),
    where('ownerUid', '==', 'farmer-1'),
    where('status', '==', 'archived'),
  )))
  await assertSucceeds(updateDoc(farmRef, {
    status: 'active',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(deleteDoc(farmRef))
  await assertFails(setDoc(doc(farmerDb, 'farms/farm-delete'), {
    ownerUid: 'farmer-1',
    name: 'Delete Attempt',
    location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
    size: 1,
    sizeUnit: 'acre',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unexpected: true,
  }))
  await assertFails(setDoc(doc(anonymousDb, 'farms/anonymous'), {
    ownerUid: 'anonymous',
    name: 'Anonymous Farm',
    location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
    size: 1,
    sizeUnit: 'acre',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(farmerDb, 'users/farmer-expert'), {
    uid: 'farmer-expert',
    displayName: 'Self-promoted',
    email: 'farmer@example.test',
    role: 'expert',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(anonymousDb, 'users/visitor'), {
    uid: 'visitor',
    displayName: 'Visitor',
    email: 'visitor@example.test',
    role: 'farmer',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/superadmin-1'), {
      uid: 'superadmin-1',
      displayName: 'SAMS Owner',
      email: 'superadmin@example.test',
      role: 'superadmin',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  await assertSucceeds(getDocs(collection(superadminDb, 'users')))
  await assertSucceeds(getDoc(doc(anonymousDb, 'crops/maize')))
  await assertFails(getDoc(doc(anonymousDb, 'crops/draft')))
  await assertSucceeds(getDoc(doc(adminDb, 'crops/draft')))
  await assertSucceeds(getDocs(query(
    collection(anonymousDb, 'crops'),
    where('isPublic', '==', true),
    where('status', '==', 'active'),
    where('reviewStatus', '==', 'approved'),
    orderBy('name'),
  )))
  await assertFails(getDocs(collection(anonymousDb, 'crops')))
  await assertSucceeds(getDocs(query(
    collection(anonymousDb, 'cropCategories'),
    where('status', '==', 'active'),
  )))
  await assertFails(setDoc(doc(farmerDb, 'crops/farmer-created'), {
    name: 'Farmer crop',
    categoryId: 'grains',
    source: 'Untrusted source',
    reviewStatus: 'approved',
    isPublic: true,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedByUid: 'farmer-1',
  }))
  await assertFails(setDoc(doc(dataManagerDb, 'crops/manager-created'), {
    name: 'Manager crop',
    categoryId: 'grains',
    source: 'Untrusted source',
    reviewStatus: 'pending',
    isPublic: false,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedByUid: 'data-manager-1',
  }))
  const cropRef = doc(adminDb, 'crops/admin-created')
  await assertSucceeds(setDoc(cropRef, {
    name: 'Sorghum',
    categoryId: 'grains',
    source: 'Approved source',
    reviewStatus: 'pending',
    isPublic: false,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedByUid: 'admin-1',
  }))
  await assertSucceeds(updateDoc(cropRef, {
    reviewStatus: 'approved',
    isPublic: true,
    updatedAt: serverTimestamp(),
    updatedByUid: 'admin-1',
  }))
  await assertFails(updateDoc(cropRef, {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedByUid: 'admin-1',
  }))
  await assertFails(deleteDoc(cropRef))
  await assertSucceeds(setDoc(doc(adminDb, 'cropCategories/legumes'), {
    name: 'Legumes',
    description: 'Legume crops',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(deleteDoc(doc(adminDb, 'cropCategories/legumes')))
  await assertFails(getDoc(doc(superadminDb, 'farms/farm-1')))
  await assertFails(updateDoc(doc(superadminDb, 'farms/farm-1'), {
    status: 'archived',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(superadminDb, 'farms/superadmin-farm'), {
    ownerUid: 'superadmin-1',
    name: 'Superadmin Farm',
    location: { region: 'Ashanti', district: 'Kumasi', community: 'Bantama' },
    size: 1,
    sizeUnit: 'acre',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(setDoc(doc(superadminDb, 'users/staff-1'), {
    uid: 'staff-1',
    displayName: 'Agricultural Expert',
    email: 'expert@example.test',
    role: 'expert',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(superadminDb, 'users/farmer-created-by-admin'), {
    uid: 'farmer-created-by-admin',
    displayName: 'Admin-created Farmer',
    email: 'new-farmer@example.test',
    role: 'farmer',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(updateDoc(doc(superadminDb, 'users/farmer-3'), {
    role: 'admin',
    status: 'active',
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(updateDoc(doc(superadminDb, 'users/farmer-3'), {
    role: 'admin',
    status: 'inactive',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(doc(superadminDb, 'users/superadmin-1'), {
    role: 'admin',
    status: 'active',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(doc(superadminDb, 'users/superadmin-1'), {
    role: 'superadmin',
    status: 'inactive',
    updatedAt: serverTimestamp(),
  }))

  await assertSucceeds(getDoc(doc(noRoleDb, 'users/farmer-3')))
  const deactivatedProfile = await getDoc(doc(noRoleDb, 'users/farmer-3'))
  assert.equal(deactivatedProfile.data()?.status, 'inactive')
  await assertSucceeds(getDoc(profileRef))
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/farmer-1'), { status: 'inactive' }, { merge: true })
  })
  await assertSucceeds(getDoc(profileRef))
  await assertFails(getDoc(farmRef))
})
