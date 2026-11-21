import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormField } from '../forms/FormField'
import { useAuth } from '../hooks/useAuth'
import { firebaseAuthErrorMessage } from '../services/authService'
import { createFarm, farmErrorMessage, getFarm, updateFarm } from '../services/farmService'
import { listPublicCrops } from '../services/cropService'
import { FARM_SIZE_UNITS, isFarmSizeUnit, type FarmInput, type FarmSizeUnit } from '../types/farm'
import type { Crop } from '../types/crop'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'

export function FarmFormPage() {
  const { farmId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const editing = Boolean(farmId)
  const [name, setName] = useState('')
  const [region, setRegion] = useState(profile?.location?.region ?? '')
  const [district, setDistrict] = useState(profile?.location?.district ?? '')
  const [community, setCommunity] = useState(profile?.location?.community ?? '')
  const [soilType, setSoilType] = useState('')
  const [soilTexture, setSoilTexture] = useState('')
  const [size, setSize] = useState('')
  const [sizeUnit, setSizeUnit] = useState<FarmSizeUnit>('hectare')
  const [crops, setCrops] = useState<Crop[]>([])
  const [selectedCropIds, setSelectedCropIds] = useState<string[]>([])
  const [cropLoadError, setCropLoadError] = useState<string | null>(null)
  const [cropsLoading, setCropsLoading] = useState(true)
  const [loadedFarmId, setLoadedFarmId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void listPublicCrops()
      .then((records) => {
        if (active) setCrops(records)
      })
      .catch((loadError: unknown) => {
        if (active) setCropLoadError(firebaseAuthErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setCropsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!farmId) return

    let active = true
    void getFarm(farmId)
      .then((farm) => {
        if (!active) return
        if (!farm) {
          setLoadError('This farm could not be found.')
          setLoadedFarmId(farmId)
          return
        }
        if (farm.status !== 'active') {
          setLoadError('Archived farms cannot be edited. Reactivate the farm first.')
          setLoadedFarmId(farmId)
          return
        }

        setLoadError(null)
        setName(farm.name)
        setRegion(farm.location.region)
        setDistrict(farm.location.district)
        setCommunity(farm.location.community)
        setSoilType(farm.soilType ?? '')
        setSoilTexture(farm.soilTexture ?? '')
        setSize(String(farm.size))
        setSizeUnit(farm.sizeUnit)
        setSelectedCropIds(farm.cropIds ?? [])
        setLoadedFarmId(farmId)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setLoadError(farmErrorMessage(loadError))
        setLoadedFarmId(farmId)
      })

    return () => {
      active = false
    }
  }, [farmId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!event.currentTarget.reportValidity()) return

    const trimmedName = name.trim()
    const location = {
      region: region.trim(),
      district: district.trim(),
      community: community.trim(),
    }
    const numericSize = Number(size)
    if (!trimmedName || trimmedName.length > 120) {
      setError('Enter a farm name between 1 and 120 characters.')
      return
    }
    if (Object.values(location).some((value) => !value || value.length > 100)) {
      setError('Enter a region, district, and community or town, each no longer than 100 characters.')
      return
    }
    if (soilType.trim().length > 120 || soilTexture.trim().length > 120) {
      setError('Soil type and texture must each be no longer than 120 characters.')
      return
    }
    if (!Number.isFinite(numericSize) || numericSize <= 0) {
      setError('Farm size must be a number greater than zero.')
      return
    }

    const input: FarmInput = {
      name: trimmedName,
      location,
      size: numericSize,
      sizeUnit,
      cropIds: [...new Set(selectedCropIds)],
      ...(soilType.trim() ? { soilType: soilType.trim() } : {}),
      ...(soilTexture.trim() ? { soilTexture: soilTexture.trim() } : {}),
    }

    if (!user) return
    setSubmitting(true)
    try {
      if (farmId) {
        await updateFarm(farmId, input)
        navigate(`/farmer/farms/${farmId}`, {
          replace: true,
          state: { farmNotice: 'Farm details updated successfully.' },
        })
      } else {
        const newFarmId = await createFarm(user.uid, input)
        navigate(`/farmer/farms/${newFarmId}`, {
          replace: true,
          state: { farmNotice: 'Farm created successfully.' },
        })
      }
    } catch (saveError) {
      setError(farmErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  if (farmId && loadedFarmId !== farmId) return <LoadingState label="Loading farm..." />
  if (loadError) {
    return <ErrorState message={loadError} action={<Link className="button button--secondary" to="/farmer/farms">Back to farms</Link>} />
  }

  return (
    <div className="farm-form-page">
      <p className="profile-page__intro">
        {editing
          ? 'Update your farm details. Changing the farm location does not change your profile location.'
          : 'Enter a name, location, and area for this farm. Its location starts from your profile and can be changed here.'}
      </p>
      {error && <div className="account-feedback account-feedback--error" role="alert">{error}</div>}
      <form className="profile-form farm-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <FormField
          id="farm-name"
          name="farmName"
          label="Farm name"
          maxLength={120}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="farm-form__location">
          <h2>Farm location</h2>
          <p>These details describe this farm and may differ from your profile location.</p>
        </div>
        <FormField
          id="farm-region"
          name="region"
          label="Region"
          maxLength={100}
          autoComplete="address-level1"
          required
          value={region}
          onChange={(event) => setRegion(event.target.value)}
        />
        <FormField
          id="farm-district"
          name="district"
          label="District"
          maxLength={100}
          autoComplete="address-level2"
          required
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
        />
        <FormField
          id="farm-community"
          name="community"
          label="Community or town"
          maxLength={100}
          autoComplete="address-level3"
          required
          value={community}
          onChange={(event) => setCommunity(event.target.value)}
        />
        <div className="farm-form__size">
          <FormField
            id="farm-size"
            name="size"
            label="Farm area"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            required
            value={size}
            onChange={(event) => setSize(event.target.value)}
          />
          <div className="form-field">
            <label htmlFor="farm-size-unit">Measurement unit</label>
            <select
              id="farm-size-unit"
              className="farm-select"
              value={sizeUnit}
              onChange={(event) => {
                if (isFarmSizeUnit(event.target.value)) setSizeUnit(event.target.value)
              }}
            >
              {FARM_SIZE_UNITS.map((unit) => (
                <option key={unit} value={unit}>{unit === 'hectare' ? 'Hectares' : 'Acres'}</option>
              ))}
            </select>
          </div>
        </div>
        <section className="farm-form__soil" aria-labelledby="farm-soil-profile-title">
          <h2 id="farm-soil-profile-title">General soil information</h2>
          <p>These are your general observations for this farm, not laboratory soil-test results.</p>
          <FormField
            id="farm-soil-type"
            name="soilType"
            label="Soil type (optional)"
            maxLength={120}
            value={soilType}
            onChange={(event) => setSoilType(event.target.value)}
          />
          <FormField
            id="farm-soil-texture"
            name="soilTexture"
            label="Soil texture (optional)"
            maxLength={120}
            value={soilTexture}
            onChange={(event) => setSoilTexture(event.target.value)}
          />
        </section>
        <fieldset className="farm-crop-picker">
          <legend>Crops grown on this farm</legend>
          <p>Select from published crop records. Crop selection does not add soil or recommendation records.</p>
          {cropLoadError && (
            <div className="account-feedback account-feedback--error" role="alert">
              {cropLoadError} Existing crop associations will be preserved unless you remove them below.
            </div>
          )}
          {cropsLoading ? (
            <p role="status">Loading published crops...</p>
          ) : !cropLoadError && crops.length === 0 ? (
            <p>No published crops are available yet.</p>
          ) : (
            <div className="farm-crop-picker__options">
              {crops.map((crop) => (
                <label key={crop.id}>
                  <input
                    type="checkbox"
                    checked={selectedCropIds.includes(crop.id)}
                    onChange={(event) => {
                      setSelectedCropIds((current) => event.target.checked
                        ? [...new Set([...current, crop.id])]
                        : current.filter((id) => id !== crop.id))
                    }}
                  />
                  <span>{crop.name}</span>
                </label>
              ))}
            </div>
          )}
          {selectedCropIds.some((id) => !crops.some((crop) => crop.id === id)) && (
            <div className="farm-crop-picker__unavailable">
              {selectedCropIds
                .filter((id) => !crops.some((crop) => crop.id === id))
                .map((id) => (
                  <div key={id}>
                    <span>Unavailable crop record ({id})</span>
                    <button
                      className="text-link"
                      type="button"
                      onClick={() => setSelectedCropIds((current) => current.filter((cropId) => cropId !== id))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          )}
        </fieldset>
        <div className="profile-form__actions">
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editing ? 'Save changes' : 'Add farm'}
          </button>
          <Link className="button button--secondary" to={farmId ? `/farmer/farms/${farmId}` : '/farmer/farms'}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
