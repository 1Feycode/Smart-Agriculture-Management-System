import type { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import { SOIL_SOURCE_TYPES, SOIL_VERIFICATION_STATUSES } from './soilValues.js'

export { SOIL_SOURCE_TYPES, SOIL_VERIFICATION_STATUSES }
export type SoilSourceType = (typeof SOIL_SOURCE_TYPES)[number]
export type SoilVerificationStatus = (typeof SOIL_VERIFICATION_STATUSES)[number]

export interface SoilNutrientValue {
  value: number
  unit: string
  method?: string
}

export interface SoilNutrientDraft {
  name: string
  value: string
  unit: string
  method: string
}

export interface SoilTestDraft {
  farmId: string
  testDate: string
  sourceType: SoilSourceType | ''
  sourceName: string
  ph: string
  soilType: string
  texture: string
  nutrients: SoilNutrientDraft[]
}

export interface SoilTestInput {
  farmId: string
  testDate: string
  sourceType: SoilSourceType
  sourceName: string
  ph?: number
  nutrients?: Record<string, SoilNutrientValue>
  soilType?: string
  texture?: string
}

export interface SoilTest {
  id: string
  ownerUid: string
  farmId: string
  testDate: Timestamp
  sourceType: SoilSourceType
  sourceName: string
  ph?: number | null
  nutrients?: Record<string, SoilNutrientValue>
  soilType?: string | null
  texture?: string | null
  verificationStatus: SoilVerificationStatus
  reviewNotes?: string | null
  assignedExpertUid?: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface SoilTestPage {
  records: SoilTest[]
  nextCursor: QueryDocumentSnapshot<DocumentData> | null
}

export function isSoilSourceType(value: unknown): value is SoilSourceType {
  return SOIL_SOURCE_TYPES.some((sourceType) => sourceType === value)
}

export function isSoilVerificationStatus(value: unknown): value is SoilVerificationStatus {
  return SOIL_VERIFICATION_STATUSES.some((status) => status === value)
}
