import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { FormField } from '../forms/FormField'
import { useAuth } from '../hooks/useAuth'
import { farmErrorMessage, getFarm, listAllFarms } from '../services/farmService'
import { createSoilTest, soilErrorMessage } from '../services/soilService'
import {
  isSoilSourceType,
  SOIL_SOURCE_TYPES,
  type SoilNutrientDraft,
  type SoilTestDraft,
} from '../types/soil'
import type { Farm } from '../types/farm'
import { formatLabel } from '../utils/formatLabel'
import { toSoilTestInput, validateSoilTestDraft } from '../utils/soilValidation'

const today = new Date().toISOString().slice(0, 10)

export function SoilTestFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedFarmId = searchParams.get('farmId') ?? ''
  const [farms, setFarms] = useState<Farm[]>([])
  const [draft, setDraft] = useState<SoilTestDraft>({
    farmId: requestedFarmId,
    testDate: today,
    sourceType: '',
    sourceName: '',
    ph: '',
    soilType: '',
    texture: '',
    nutrients: [],
  })
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const loadKey = `${user?.uid ?? 'pending'}|${requestedFarmId}`

  useEffect(() => {
    if (!user) return
    const ownerUid = user.uid
    let active = true

    async function loadForm() {
      try {
        const farmRecords = await listAllFarms(ownerUid, 'active')
        if (!active) return
        setFarms(farmRecords)
        if (requestedFarmId) {
          const farm = await getFarm(requestedFarmId)
          if (!active) return
          if (!farm || farm.ownerUid !== ownerUid || farm.status !== 'active') {
            setLoadError('Choose one of your active farms to add a soil-test record.')
            return
          }
          setDraft((current) => ({ ...current, farmId: farm.id }))
        } else {
          setDraft((current) => ({
            ...current,
            farmId: farmRecords.some((farm) => farm.id === current.farmId) ? current.farmId : '',
          }))
        }
        setLoadError(null)
      } catch (loadError) {
        if (!active) return
        setLoadError(requestedFarmId ? soilErrorMessage(loadError) : farmErrorMessage(loadError))
      } finally {
        if (active) setLoadedKey(loadKey)
      }
    }

    void loadForm()
    return () => {
      active = false
    }
  }, [user, requestedFarmId, loadKey])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors([])
    if (!event.currentTarget.reportValidity()) return

    const validationErrors = validateSoilTestDraft(draft)
    if (validationErrors.length) {
      setErrors(validationErrors)
      return
    }
    if (!user || !farms.some((farm) => farm.id === draft.farmId)) {
      setErrors(['Select one of your active farms.'])
      return
    }

    setSubmitting(true)
    try {
      const soilTestId = await createSoilTest(user.uid, toSoilTestInput(draft))
      navigate(`/farmer/soil-tests/${soilTestId}`, {
        replace: true,
        state: { soilNotice: 'Soil-test record saved as unverified.' },
      })
    } catch (saveError) {
      setErrors([soilErrorMessage(saveError)])
    } finally {
      setSubmitting(false)
    }
  }

  function updateDraft<Key extends keyof SoilTestDraft>(key: Key, value: SoilTestDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function updateNutrient(index: number, patch: Partial<SoilNutrientDraft>) {
    setDraft((current) => ({
      ...current,
      nutrients: current.nutrients.map((row, rowIndex) => (
        rowIndex === index ? { ...row, ...patch } : row
      )),
    }))
  }

  const loading = loadedKey !== loadKey
  if (loading) return <LoadingState label="Loading your farms..." />
  if (loadError) {
    return <ErrorState message={loadError} action={<Link className="button button--secondary" to="/farmer/soil-tests">Back to soil tests</Link>} />
  }
  if (farms.length === 0) {
    return <ErrorState message="Add an active farm before recording a soil test." action={<Link className="button button--primary" to="/farmer/farms/new">Add farm</Link>} />
  }

  return (
    <div className="soil-form-page">
      <p className="profile-page__intro">
        Enter only measured or reported information. Leave unknown values blank; an absent value is not zero.
      </p>
      {errors.length > 0 && (
        <div className="account-feedback account-feedback--error" role="alert">
          <ul>{errors.map((message) => <li key={message}>{message}</li>)}</ul>
        </div>
      )}
      <form className="profile-form soil-test-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="form-field">
          <label htmlFor="soil-test-farm">Farm <span className="form-field__required" aria-hidden="true">*</span></label>
          <select
            id="soil-test-farm"
            required
            value={draft.farmId}
            onChange={(event) => updateDraft('farmId', event.target.value)}
          >
            <option value="">Select an active farm</option>
            {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
          </select>
        </div>
        <FormField
          id="soil-test-date"
          name="testDate"
          label="Test or observation date"
          type="date"
          max={today}
          required
          value={draft.testDate}
          onChange={(event) => updateDraft('testDate', event.target.value)}
        />
        <div className="form-field">
          <label htmlFor="soil-source-type">Source type <span className="form-field__required" aria-hidden="true">*</span></label>
          <select
            id="soil-source-type"
            required
            value={draft.sourceType}
            onChange={(event) => {
              const nextValue = event.target.value
              if (nextValue === '') updateDraft('sourceType', '')
              else if (isSoilSourceType(nextValue)) updateDraft('sourceType', nextValue)
            }}
          >
            <option value="">Select a source type</option>
            {SOIL_SOURCE_TYPES.map((sourceType) => (
              <option key={sourceType} value={sourceType}>{formatLabel(sourceType)}</option>
            ))}
          </select>
        </div>
        <FormField
          id="soil-source-name"
          name="sourceName"
          label="Laboratory, provider, or reported source"
          description="For a farmer estimate, describe whose observation it is. This record remains unverified until reviewed."
          maxLength={120}
          required
          value={draft.sourceName}
          onChange={(event) => updateDraft('sourceName', event.target.value)}
        />
        <div className="soil-form-section">
          <h2>Optional soil measurements</h2>
          <p>Do not enter zero for a measurement that was not taken. No pH range is assumed.</p>
          <FormField
            id="soil-test-ph"
            name="ph"
            label="pH (optional)"
            type="number"
            step="any"
            inputMode="decimal"
            value={draft.ph}
            onChange={(event) => updateDraft('ph', event.target.value)}
          />
          <FormField
            id="soil-test-type"
            name="soilType"
            label="Reported soil type (optional)"
            maxLength={120}
            value={draft.soilType}
            onChange={(event) => updateDraft('soilType', event.target.value)}
          />
          <FormField
            id="soil-test-texture"
            name="texture"
            label="Reported soil texture (optional)"
            maxLength={120}
            value={draft.texture}
            onChange={(event) => updateDraft('texture', event.target.value)}
          />
        </div>
        <fieldset className="soil-nutrient-editor">
          <legend>Nutrient results (optional)</legend>
          <p>Enter the nutrient name, measured value, and the unit from the source. Add the method if it is provided.</p>
          {draft.nutrients.map((row, index) => (
            <div className="soil-nutrient-editor__row" key={index}>
              <FormField
                id={`nutrient-name-${index}`}
                label="Nutrient name"
                maxLength={120}
                value={row.name}
                onChange={(event) => updateNutrient(index, { name: event.target.value })}
              />
              <FormField
                id={`nutrient-value-${index}`}
                label="Measured value"
                type="number"
                step="any"
                inputMode="decimal"
                value={row.value}
                onChange={(event) => updateNutrient(index, { value: event.target.value })}
              />
              <FormField
                id={`nutrient-unit-${index}`}
                label="Unit"
                maxLength={120}
                value={row.unit}
                onChange={(event) => updateNutrient(index, { unit: event.target.value })}
              />
              <FormField
                id={`nutrient-method-${index}`}
                label="Method (if known)"
                maxLength={120}
                value={row.method}
                onChange={(event) => updateNutrient(index, { method: event.target.value })}
              />
              <button
                className="button button--secondary"
                type="button"
                onClick={() => updateDraft('nutrients', draft.nutrients.filter((_, rowIndex) => rowIndex !== index))}
              >
                Remove nutrient
              </button>
            </div>
          ))}
          <button
            className="button button--secondary"
            type="button"
            onClick={() => updateDraft('nutrients', [...draft.nutrients, { name: '', value: '', unit: '', method: '' }])}
          >
            Add nutrient result
          </button>
        </fieldset>
        <p className="soil-test-form__status-note" role="status">
          New soil-test records are saved as unverified. Only an assigned active expert can review them.
        </p>
        <div className="profile-form__actions">
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save soil-test record'}
          </button>
          <Link className="button button--secondary" to={draft.farmId ? `/farmer/soil-tests?farmId=${draft.farmId}` : '/farmer/soil-tests'}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
