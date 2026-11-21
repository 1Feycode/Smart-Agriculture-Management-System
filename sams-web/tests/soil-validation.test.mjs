import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toSoilTestInput, validateSoilTestDraft } from '../src/utils/soilValidation.js'

const today = '2025-03-10'

function validDraft(overrides = {}) {
  return {
    farmId: 'farm-1',
    testDate: '2025-03-09',
    sourceType: 'laboratory',
    sourceName: 'Local soil laboratory',
    ph: '',
    soilType: '',
    texture: '',
    nutrients: [],
    ...overrides,
  }
}

test('allows an unmeasured soil test and keeps unknown numeric fields absent', () => {
  const draft = validDraft()
  assert.deepEqual(validateSoilTestDraft(draft, today), [])

  const input = toSoilTestInput(draft)
  assert.equal('ph' in input, false)
  assert.equal('nutrients' in input, false)
})

test('accepts zero only when it was explicitly entered as a measured value', () => {
  const draft = validDraft({
    ph: '0',
    nutrients: [{ name: 'Reported measure', value: '0', unit: 'source unit', method: '' }],
  })
  assert.deepEqual(validateSoilTestDraft(draft, today), [])

  const input = toSoilTestInput(draft)
  assert.equal(input.ph, 0)
  assert.equal(input.nutrients?.['Reported measure'].value, 0)
})

test('rejects invalid and future dates, missing sources, and nonnumeric measurements', () => {
  const errors = validateSoilTestDraft(validDraft({
    testDate: '2025-03-11',
    sourceType: '',
    sourceName: ' ',
    ph: 'not-a-number',
  }), today)

  assert.ok(errors.some((error) => error.includes('not in the future')))
  assert.ok(errors.some((error) => error.includes('source type')))
  assert.ok(errors.some((error) => error.includes('source name')))
  assert.ok(errors.some((error) => error.includes('pH')))
  assert.ok(validateSoilTestDraft(validDraft({ testDate: '2025-02-30' }), today).length > 0)
})

test('requires a value and explicit unit for each entered nutrient and rejects duplicate names', () => {
  assert.ok(validateSoilTestDraft(validDraft({
    nutrients: [{ name: 'Nutrient X', value: '2', unit: '', method: '' }],
  }), today).some((error) => error.includes('explicit unit')))

  assert.ok(validateSoilTestDraft(validDraft({
    nutrients: [
      { name: 'Nutrient X', value: '2', unit: 'unit', method: '' },
      { name: 'nutrient x', value: '3', unit: 'unit', method: '' },
    ],
  }), today).some((error) => error.includes('unique')))
})
