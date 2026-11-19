import type { Timestamp } from 'firebase/firestore'

export const USER_ROLES = ['farmer', 'expert', 'dataManager', 'admin', 'superadmin'] as const
export const MANAGED_USER_ROLES = ['expert', 'dataManager', 'admin', 'superadmin'] as const

export type UserRole = (typeof USER_ROLES)[number]
export type ManagedUserRole = (typeof MANAGED_USER_ROLES)[number]

export interface AdministrativeLocation {
  region: string
  district: string
  community: string
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  role: UserRole
  status: string
  location?: AdministrativeLocation
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export const roleLabels: Record<UserRole, string> = {
  farmer: 'Farmer',
  expert: 'Agricultural Expert',
  dataManager: 'Agricultural Data Manager',
  admin: 'Administrator',
  superadmin: 'Superadministrator',
}

export const roleDashboardPaths: Record<UserRole, string> = {
  farmer: '/farmer/dashboard',
  expert: '/expert/dashboard',
  dataManager: '/data/dashboard',
  admin: '/admin/dashboard',
  superadmin: '/superadmin/dashboard',
}

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.some((role) => role === value)
}

export function isManagedUserRole(value: unknown): value is ManagedUserRole {
  return MANAGED_USER_ROLES.some((role) => role === value)
}
