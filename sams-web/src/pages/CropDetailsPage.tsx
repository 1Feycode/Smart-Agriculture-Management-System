import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { firebaseAuthErrorMessage } from '../services/authService'
import { getPublicCrop, listPublicCropCategories } from '../services/cropService'
import type { Crop, CropCategory } from '../types/crop'

export function CropDetailsPage() {
  const { cropId } = useParams()
  const [crop, setCrop] = useState<Crop | null>(null)
  const [category, setCategory] = useState<CropCategory | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cropId) return
    let active = true
    void Promise.all([getPublicCrop(cropId), listPublicCropCategories()])
      .then(([record, categories]) => {
        if (!active) return
        setCrop(record)
        setCategory(categories.find((item) => item.id === record?.categoryId) ?? null)
        setError(null)
        setLoadedId(cropId)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setCrop(null)
        setError(firebaseAuthErrorMessage(loadError))
        setLoadedId(cropId)
      })
    return () => {
      active = false
    }
  }, [cropId])

  if (!cropId) return <ErrorState message="A crop identifier is required." />
  if (loadedId !== cropId) return <LoadingState label="Loading crop information..." />
  if (error) {
    return (
      <div className="crop-details">
        <ErrorState message={error} action={<Link className="button button--secondary" to="/crops">Back to crops</Link>} />
      </div>
    )
  }
  if (!crop) {
    return (
      <div className="crop-details">
        <ErrorState title="Crop not found" message="This crop does not exist or is not currently published." action={<Link className="button button--secondary" to="/crops">Back to crops</Link>} />
      </div>
    )
  }

  const information = [
    ['Description', crop.description],
    ['Suitable soil conditions', crop.soilGuidance],
    ['Planting seasons', crop.plantingSeason],
    ['Water requirements', crop.waterGuidance],
    ['Growth duration', crop.growthDuration],
    ['Harvest period', crop.harvestPeriod],
  ] as const

  return (
    <article className="crop-details">
      <Link className="text-link crop-details__back" to="/crops">Back to crop catalog</Link>
      <header className="crop-details__header">
        <span className="crop-card__category">{category?.name ?? 'Category unavailable'}</span>
        <h1>{crop.name}</h1>
      </header>
      <section className="crop-details__content" aria-label="Crop information">
        {information.map(([label, value]) => value && (
          <div className="crop-details__item" key={label}>
            <h2>{label}</h2>
            <p>{value}</p>
          </div>
        ))}
        <div className="crop-details__source">
          <h2>Information source</h2>
          <p>{crop.source}</p>
        </div>
      </section>
    </article>
  )
}
