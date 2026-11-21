import type { Timestamp } from 'firebase/firestore'

export type CropStatus = 'active' | 'inactive'
export type CropReviewStatus = 'pending' | 'approved' | 'rejected'

export interface CropInput {
  name: string
  categoryId: string
  description?: string
  soilGuidance?: string
  plantingSeason?: string
  waterGuidance?: string
  growthDuration?: string
  harvestPeriod?: string
  source: string
  reviewStatus: CropReviewStatus
  isPublic: boolean
  status: CropStatus
}

export interface Crop extends CropInput {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
  updatedByUid: string
}

export interface CropCategoryInput {
  name: string
  description: string
  status: CropStatus
}

export interface CropCategory extends CropCategoryInput {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function isCropStatus(value: unknown): value is CropStatus {
  return value === 'active' || value === 'inactive'
}

export function isCropReviewStatus(value: unknown): value is CropReviewStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected'
}
