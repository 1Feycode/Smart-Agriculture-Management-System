import type { SoilTestDraft, SoilTestInput } from '../types/soil'

export function validateSoilTestDraft(draft: SoilTestDraft, today?: string): string[]
export function toSoilTestInput(draft: SoilTestDraft): SoilTestInput
