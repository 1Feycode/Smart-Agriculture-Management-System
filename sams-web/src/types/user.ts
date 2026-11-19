import type { Timestamp } from 'firebase/firestore'

export const USER_ROLES = ['farmer', 'expert', 'dataManager', 'admin'] as const

export type UserRole = (typeof USER_ROLES)[number]

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  role: UserRole
  status: string
  location?: Readonly<Record<string, unknown>>
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export const roleLabels: Record<UserRole, string> = {
  farmer: 'Farmer',
  expert: 'Agricultural Expert',
  dataManager: 'Agricultural Data Manager',
  admin: 'Administrator',
}

export const roleDashboardPaths: Record<UserRole, string> = {
  farmer: '/farmer/dashboard',
  expert: '/expert/dashboard',
  dataManager: '/data/dashboard',
  admin: '/admin/dashboard',
}

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.some((role) => role === value)
}
