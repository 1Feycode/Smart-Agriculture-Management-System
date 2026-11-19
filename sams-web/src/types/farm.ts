import type { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { AdministrativeLocation } from './user'

export const FARM_SIZE_UNITS = ['hectare', 'acre'] as const
export type FarmSizeUnit = (typeof FARM_SIZE_UNITS)[number]

export type FarmStatus = 'active' | 'archived'
export type FarmSort = 'updatedAt' | 'name'

export interface FarmInput {
  name: string
  location: AdministrativeLocation
  size: number
  sizeUnit: FarmSizeUnit
}

export interface Farm extends FarmInput {
  id: string
  ownerUid: string
  status: FarmStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FarmPage {
  farms: Farm[]
  nextCursor: QueryDocumentSnapshot<DocumentData> | null
}

export function isFarmSizeUnit(value: unknown): value is FarmSizeUnit {
  return FARM_SIZE_UNITS.some((unit) => unit === value)
}
