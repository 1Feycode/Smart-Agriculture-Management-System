import type { User } from 'firebase/auth'
import { initializeFirebase, initializeSecondaryFirebaseAuth } from '../lib/firebase'
import type { ManagedUserRole, UserRole } from '../types/user'
import {
  createFarmerProfileIfMissing,
  createManagedUserProfile,
  getUserProfile,
} from './userService'

export interface ResolvedUserAccess {
  role: UserRole
  profile: Awaited<ReturnType<typeof getUserProfile>>
}

export class AuthServiceError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AuthServiceError'
    this.code = code
  }
}

export function observeAuthChanges(
  onChange: (user: User | null) => void,
  onError: (error: Error) => void,
): () => void {
  let cancelled = false
  let unsubscribe: (() => void) | undefined
  const servicesPromise = initializeFirebase()

  if (!servicesPromise) return () => undefined

  void servicesPromise
    .then(({ auth }) => {
      if (cancelled) return
      return import('firebase/auth').then(({ onIdTokenChanged }) => {
        if (cancelled) return
        unsubscribe = onIdTokenChanged(auth, onChange, onError)
      })
    })
    .catch(onError)

  return () => {
    cancelled = true
    unsubscribe?.()
  }
}

export async function registerWithEmail(
  displayName: string,
  email: string,
  password: string,
): Promise<void> {
  const { auth } = await getFirebaseServices()
  const authSdk = await import('firebase/auth')
  const credential = await authSdk.createUserWithEmailAndPassword(auth, email, password)

  try {
    await authSdk.updateProfile(credential.user, { displayName })
  } catch (error) {
    throw new AuthServiceError(
      'app/registration-profile-failed',
      `Your Firebase account was created, but profile initialization failed. Do not register again; contact the project owner. ${firebaseAuthErrorMessage(error)}`,
    )
  }

  try {
    await authSdk.sendEmailVerification(credential.user)
  } catch (error) {
    throw new AuthServiceError(
      'app/registration-verification-failed',
      `Your Firebase account was created, but the verification email could not be sent. Sign in to request another email; do not register again. ${firebaseAuthErrorMessage(error)}`,
    )
  }

  try {
    await createFarmerProfileIfMissing(credential.user)
    const profile = await getUserProfile(credential.user.uid)
    if (profile.role !== 'farmer' || profile.status !== 'active') {
      throw new AuthServiceError(
        'app/profile-role-mismatch',
        'The account profile is not enabled for farmer access.',
      )
    }
  } catch (error) {
    throw new AuthServiceError(
      'app/registration-profile-sync-failed',
      `Your Firebase account was created, but farmer profile setup did not finish. Do not register again; contact the project owner. ${firebaseAuthErrorMessage(error)}`,
    )
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
  rememberSession: boolean,
): Promise<{ user: User; access: ResolvedUserAccess }> {
  const { auth } = await getFirebaseServices()
  const authSdk = await import('firebase/auth')
  await authSdk.setPersistence(
    auth,
    rememberSession ? authSdk.browserLocalPersistence : authSdk.browserSessionPersistence,
  )

  const credential = await authSdk.signInWithEmailAndPassword(auth, email, password)
  const access = await resolveUserAccess(credential.user)
  return { user: credential.user, access }
}

export async function resolveUserAccess(user: User): Promise<ResolvedUserAccess> {
  if (!user.emailVerified) {
    throw new AuthServiceError(
      'auth/email-not-verified',
      'Verify your email address before accessing your dashboard.',
    )
  }

  await createFarmerProfileIfMissing(user)
  const profile = await getUserProfile(user.uid)
  if (profile.status !== 'active') {
    throw new AuthServiceError(
      'app/account-inactive',
      'This account is not active. Contact the project owner for assistance.',
    )
  }
  return { role: profile.role, profile }
}

export async function createManagedAccount(
  displayName: string,
  email: string,
  role: ManagedUserRole,
): Promise<void> {
  const services = await getFirebaseServices()
  const secondaryAuth = await initializeSecondaryFirebaseAuth()
  const authSdk = await import('firebase/auth')
  let createdUser: User | undefined

  try {
    const credential = await authSdk.createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      createTemporaryPassword(),
    )
    createdUser = credential.user

    try {
      await authSdk.updateProfile(createdUser, { displayName })
      if (!createdUser.email) throw new Error('The created account has no email address.')
      await createManagedUserProfile({
        uid: createdUser.uid,
        displayName,
        email: createdUser.email,
        role,
      })
    } catch (error) {
      try {
        await authSdk.deleteUser(createdUser)
      } catch (cleanupError) {
        throw new AuthServiceError(
          'app/managed-user-cleanup-failed',
          `Account setup failed and its new Firebase Auth account could not be cleaned up. UID: ${createdUser.uid}. Setup error: ${firebaseAuthErrorMessage(error)} Cleanup error: ${firebaseAuthErrorMessage(cleanupError)}`,
        )
      }
      throw new AuthServiceError(
        'app/managed-user-profile-failed',
        `The staff account could not be fully set up. The incomplete Firebase Auth account was removed. ${firebaseAuthErrorMessage(error)}`,
      )
    }

    try {
      await authSdk.sendEmailVerification(createdUser)
      await authSdk.sendPasswordResetEmail(services.auth, email)
    } catch (error) {
      throw new AuthServiceError(
        'app/managed-user-invitation-failed',
        `The account and profile were created, but an invitation email could not be sent. Use "Send password reset" on this page; after signing in, the user can request another verification email. ${firebaseAuthErrorMessage(error)}`,
      )
    }
  } finally {
    if (secondaryAuth.currentUser) await authSdk.signOut(secondaryAuth)
  }
}

export async function sendManagedUserPasswordReset(email: string): Promise<void> {
  const { auth } = await getFirebaseServices()
  const { sendPasswordResetEmail } = await import('firebase/auth')
  await sendPasswordResetEmail(auth, email)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { auth } = await getFirebaseServices()
  const { sendPasswordResetEmail } = await import('firebase/auth')
  await sendPasswordResetEmail(auth, email)
}

export async function resendVerificationEmail(user: User): Promise<void> {
  const { sendEmailVerification } = await import('firebase/auth')
  await sendEmailVerification(user)
}

export async function logoutUser(): Promise<void> {
  const { auth } = await getFirebaseServices()
  const { signOut } = await import('firebase/auth')
  await signOut(auth)
}

export function firebaseAuthErrorMessage(error: unknown): string {
  const code = getErrorCode(error)
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.'
    case 'auth/email-already-in-use':
      return 'An account already uses this email. Sign in or reset your password instead.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/weak-password':
      return 'Choose a stronger password that meets the configured password policy.'
    case 'auth/too-many-requests':
      return 'Too many attempts were made. Wait a little and try again.'
    case 'auth/user-disabled':
      return 'This account is disabled. Contact the project owner for assistance.'
    case 'auth/email-not-verified':
    case 'app/account-inactive':
    case 'app/profile-role-mismatch':
    case 'app/registration-profile-failed':
    case 'app/registration-verification-failed':
    case 'app/registration-profile-sync-failed':
    case 'app/managed-user-cleanup-failed':
    case 'app/managed-user-profile-failed':
    case 'app/managed-user-invitation-failed':
      return error instanceof Error ? error.message : 'Account access could not be verified.'
    case 'permission-denied':
      return 'Your account does not have permission to complete this request.'
    default:
      return error instanceof Error
        ? error.message
        : 'The request could not be completed. Please try again.'
  }
}

async function getFirebaseServices() {
  const services = await initializeFirebase()
  if (!services) {
    throw new Error('Firebase is not configured. Add the required VITE_FIREBASE values to sams-web/.env.')
  }
  return services
}

function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AuthServiceError) return error.code
  if (isRecord(error) && typeof error.code === 'string') return error.code
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function createTemporaryPassword(): string {
  const randomBytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(randomBytes)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const randomPart = Array.from(randomBytes, (byte) => alphabet[byte % alphabet.length]).join('')
  return `${randomPart}Aa1!`
}
