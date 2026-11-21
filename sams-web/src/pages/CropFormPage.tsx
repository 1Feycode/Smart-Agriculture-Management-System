import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { FormField } from '../forms/FormField'
import { useAuth } from '../hooks/useAuth'
import { firebaseAuthErrorMessage } from '../services/authService'
import {
  createCrop,
  getManagedCrop,
  listManagedCropCategories,
  updateCrop,
} from '../services/cropService'
import {
  isCropReviewStatus,
  isCropStatus,
  type Crop,
  type CropCategory,
  type CropInput,
  type CropReviewStatus,
  type CropStatus,
} from '../types/crop'

export function CropFormPage() {
  const { cropId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [crop, setCrop] = useState<Crop | null>(null)
  const [categories, setCategories] = useState<CropCategory[]>([])
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [soilGuidance, setSoilGuidance] = useState('')
  const [plantingSeason, setPlantingSeason] = useState('')
  const [waterGuidance, setWaterGuidance] = useState('')
  const [growthDuration, setGrowthDuration] = useState('')
  const [harvestPeriod, setHarvestPeriod] = useState('')
  const [source, setSource] = useState('')
  const [reviewStatus, setReviewStatus] = useState<CropReviewStatus>('pending')
  const [status, setStatus] = useState<CropStatus>('active')
  const [isPublic, setIsPublic] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function fillForm(record: Crop) {
    setName(record.name)
    setCategoryId(record.categoryId)
    setDescription(record.description ?? '')
    setSoilGuidance(record.soilGuidance ?? '')
    setPlantingSeason(record.plantingSeason ?? '')
    setWaterGuidance(record.waterGuidance ?? '')
    setGrowthDuration(record.growthDuration ?? '')
    setHarvestPeriod(record.harvestPeriod ?? '')
    setSource(record.source)
    setReviewStatus(record.reviewStatus)
    setStatus(record.status)
    setIsPublic(record.isPublic)
  }

  useEffect(() => {
    let active = true
    const cropPromise = cropId ? getManagedCrop(cropId) : Promise.resolve(null)
    void Promise.all([cropPromise, listManagedCropCategories()])
      .then(([record, categoryRecords]) => {
        if (!active) return
        if (cropId && !record) {
          setLoadingError('This crop record could not be found.')
          setLoaded(true)
          return
        }
        setCrop(record)
        setCategories(categoryRecords)
        if (record) fillForm(record)
        else setCategoryId(categoryRecords.find((category) => category.status === 'active')?.id ?? '')
        setLoaded(true)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setLoadingError(firebaseAuthErrorMessage(loadError))
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [cropId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!event.currentTarget.reportValidity()) return
    if (!user) return

    const cleanName = name.trim()
    const cleanSource = source.trim()
    if (!cleanName || !categoryId || !cleanSource) {
      setError('Crop name, category, and information source are required.')
      return
    }
    if (isPublic && (reviewStatus !== 'approved' || status !== 'active')) {
      setError('Only active, approved crop records can be published.')
      return
    }
    if (!categories.some((category) => category.id === categoryId)) {
      setError('Select an existing crop category.')
      return
    }

    const input: CropInput = {
      name: cleanName,
      categoryId,
      description,
      soilGuidance,
      plantingSeason,
      waterGuidance,
      growthDuration,
      harvestPeriod,
      source: cleanSource,
      reviewStatus,
      isPublic,
      status,
    }
    setSubmitting(true)
    try {
      if (cropId) {
        await updateCrop(cropId, input, user.uid)
      } else {
        await createCrop(input, user.uid)
        navigate('/admin/crops', {
          replace: true,
          state: { cropNotice: 'Crop record created.' },
        })
        return
      }
      navigate('/admin/crops', { replace: true, state: { cropNotice: 'Crop record saved.' } })
    } catch (saveError) {
      setError(firebaseAuthErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  if (!loaded) return <LoadingState label="Loading crop form..." />
  if (loadingError) {
    return <ErrorState message={loadingError} action={<Link className="button button--secondary" to="/admin/crops">Back to crop management</Link>} />
  }
  if (cropId && !crop) {
    return <ErrorState title="Crop not found" message="This crop record could not be found." action={<Link className="button button--secondary" to="/admin/crops">Back to crop management</Link>} />
  }
  if (categories.length === 0) {
    return (
      <div className="crop-form">
        <ErrorState
          title="Create a category first"
          message="Crop records require an existing category. Add one in crop management, then return here."
          action={<Link className="button button--secondary" to="/admin/crops">Crop management</Link>}
        />
      </div>
    )
  }

  return (
    <div className="crop-form">
      <p className="profile-page__intro">
        Enter only information supported by a reliable source. Unreviewed records stay out of the public catalog.
      </p>
      {error && <div className="account-feedback account-feedback--error" role="alert">{error}</div>}
      <form className="profile-form crop-form__fields" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <FormField
          id="crop-name"
          name="cropName"
          label="Crop name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="form-field">
          <label htmlFor="crop-category">Category</label>
          <select
            id="crop-category"
            className="farm-select"
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}{category.status === 'inactive' ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
        </div>
        <TextAreaField id="crop-description" label="Description" value={description} onChange={setDescription} />
        <TextAreaField id="crop-soil-guidance" label="Suitable soil conditions" value={soilGuidance} onChange={setSoilGuidance} />
        <TextAreaField id="crop-planting-season" label="Planting seasons" value={plantingSeason} onChange={setPlantingSeason} />
        <TextAreaField id="crop-water-guidance" label="Water requirements" value={waterGuidance} onChange={setWaterGuidance} />
        <TextAreaField id="crop-growth-duration" label="Growth duration" value={growthDuration} onChange={setGrowthDuration} />
        <TextAreaField id="crop-harvest-period" label="Harvest period" value={harvestPeriod} onChange={setHarvestPeriod} />
        <FormField
          id="crop-source"
          name="source"
          label="Information source"
          description="Record the source for this crop information. Do not enter unsupported guidance."
          required
          value={source}
          onChange={(event) => setSource(event.target.value)}
        />
        <div className="crop-form__selects">
          <div className="form-field">
            <label htmlFor="crop-review-status">Review status</label>
            <select
              id="crop-review-status"
              className="farm-select"
              value={reviewStatus}
              onChange={(event) => {
                if (isCropReviewStatus(event.target.value)) setReviewStatus(event.target.value)
              }}
            >
              <option value="pending">Pending review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="crop-status">Record status</label>
            <select
              id="crop-status"
              className="farm-select"
              value={status}
              onChange={(event) => {
                if (isCropStatus(event.target.value)) setStatus(event.target.value)
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Archived</option>
            </select>
          </div>
        </div>
        <label className="crop-form__publish">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          <span>Publish in public crop catalog</span>
        </label>
        <div className="profile-form__actions">
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : cropId ? 'Save crop' : 'Create crop'}
          </button>
          <Link className="button button--secondary" to="/admin/crops">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

interface TextAreaFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

function TextAreaField({ id, label, value, onChange }: TextAreaFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
