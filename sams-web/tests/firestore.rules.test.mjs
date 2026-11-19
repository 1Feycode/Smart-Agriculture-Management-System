import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, test } from 'node:test'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

const testEnvironment = await initializeTestEnvironment({
  projectId: 'demo-sams-profile-rules',
  firestore: {
    rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
  },
})

after(async () => {
  await testEnvironment.cleanup()
})

test('farmers can create only their own farmer profile and change approved fields', async () => {
  const farmerDb = testEnvironment.authenticatedContext('farmer-1', {
    email: 'farmer@example.test',
  }).firestore()
  const otherFarmerDb = testEnvironment.authenticatedContext('farmer-2', {
    email: 'other@example.test',
  }).firestore()
  const noRoleDb = testEnvironment.authenticatedContext('farmer-3', {
    email: 'third@example.test',
  }).firestore()
  const anonymousDb = testEnvironment.unauthenticatedContext().firestore()
  const profileRef = doc(farmerDb, 'users/farmer-1')

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
  await assertFails(getDoc(doc(farmerDb, 'farms/farm-1')))

  await assertSucceeds(updateDoc(profileRef, {
    displayName: 'Amina Updated',
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
    location: { region: 'Unapproved field shape' },
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
    await setDoc(doc(context.firestore(), 'users/farmer-1'), { status: 'disabled' }, { merge: true })
  })
  await assertFails(getDoc(profileRef))
})
