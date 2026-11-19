import type { User } from 'firebase/auth'
import type { UserProfile, UserRole } from './user'

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  authLoading: boolean
  profileLoading: boolean
  accessError: string | null
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string, rememberSession: boolean) => Promise<UserRole>
  register: (displayName: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerificationEmail: () => Promise<void>
  refreshSession: () => Promise<UserRole>
  updateProfile: (displayName: string) => Promise<void>
}
