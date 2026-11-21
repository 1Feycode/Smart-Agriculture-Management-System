import { SOIL_SOURCE_TYPES } from '../types/soilValues.js'

const soilTextLimit = 120
const soilSourceTypes = new Set(SOIL_SOURCE_TYPES)

export function validateSoilTestDraft(draft, today = new Date().toISOString().slice(0, 10)) {
  const errors = []

  if (!draft.farmId.trim()) errors.push('Select a farm.')
  if (!isValidPastOrCurrentDate(draft.testDate, today)) {
    errors.push('Enter a valid test date that is not in the future.')
  }
  if (!soilSourceTypes.has(draft.sourceType)) errors.push('Select the source type.')

  const sourceName = draft.sourceName.trim()
  if (!sourceName || sourceName.length > soilTextLimit) {
    errors.push(`Enter a source name between 1 and ${soilTextLimit} characters.`)
  }

  if (draft.ph.trim() && !Number.isFinite(Number(draft.ph))) {
    errors.push('pH must be a valid number or left blank.')
  }

  if (!isOptionalTextValid(draft.soilType) || !isOptionalTextValid(draft.texture)) {
    errors.push(`Soil type and texture must be no longer than ${soilTextLimit} characters.`)
  }

  errors.push(...validateNutrients(draft.nutrients))
  return errors
}

export function toSoilTestInput(draft) {
  if (!soilSourceTypes.has(draft.sourceType)) {
    throw new Error('Select a soil information source type before saving.')
  }

  const nutrients = draft.nutrients.reduce((result, row) => {
    if (!row.name.trim()) return result
    result[row.name.trim()] = {
      value: Number(row.value),
      unit: row.unit.trim(),
      ...(row.method.trim() ? { method: row.method.trim() } : {}),
    }
    return result
  }, {})

  return {
    farmId: draft.farmId,
    testDate: draft.testDate,
    sourceType: draft.sourceType,
    sourceName: draft.sourceName.trim(),
    ...(draft.ph.trim() ? { ph: Number(draft.ph) } : {}),
    ...(Object.keys(nutrients).length ? { nutrients } : {}),
    ...(draft.soilType.trim() ? { soilType: draft.soilType.trim() } : {}),
    ...(draft.texture.trim() ? { texture: draft.texture.trim() } : {}),
  }
}

function validateNutrients(rows) {
  const filledRows = rows.filter((row) => (
    row.name.trim() || row.value.trim() || row.unit.trim() || row.method.trim()
  ))
  const errors = []
  const seenNames = new Set()

  for (const row of filledRows) {
    const name = row.name.trim()
    const unit = row.unit.trim()
    if (!name || name.length > soilTextLimit || !unit || unit.length > soilTextLimit) {
      errors.push('Each nutrient result needs a name and explicit unit, each no longer than 120 characters.')
      break
    }
    if (!row.value.trim() || !Number.isFinite(Number(row.value))) {
      errors.push(`Enter a numeric value for ${name}.`)
      break
    }
    if (row.method.trim().length > soilTextLimit) {
      errors.push('A nutrient method must be no longer than 120 characters.')
      break
    }
    const normalizedName = name.toLocaleLowerCase()
    if (seenNames.has(normalizedName)) {
      errors.push('Nutrient names must be unique within a test.')
      break
    }
    seenNames.add(normalizedName)
  }
  return errors
}

function isOptionalTextValid(value) {
  return value.trim().length <= soilTextLimit
}

function isValidPastOrCurrentDate(value, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime())
    && parsed.toISOString().slice(0, 10) === value
    && value <= today
}
