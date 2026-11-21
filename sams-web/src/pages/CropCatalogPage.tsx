import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { useAuth } from '../hooks/useAuth'
import { firebaseAuthErrorMessage } from '../services/authService'
import { listPublicCropCategories, listPublicCrops } from '../services/cropService'
import type { Crop, CropCategory } from '../types/crop'

interface CropCatalogPageProps {
  embedded?: boolean
}

export function CropCatalogPage({ embedded = false }: CropCatalogPageProps) {
  const { role } = useAuth()
  const [crops, setCrops] = useState<Crop[]>([])
  const [categories, setCategories] = useState<CropCategory[]>([])
  const [searchText, setSearchText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loadedKey, setLoadedKey] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    void Promise.all([listPublicCrops(), listPublicCropCategories()])
      .then(([cropRecords, categoryRecords]) => {
        if (!active) return
        setCrops(cropRecords)
        setCategories(categoryRecords)
      })
      .catch((loadError: unknown) => {
        if (active) setError(firebaseAuthErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoadedKey(reloadKey)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  const loading = loadedKey !== reloadKey
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )
  const filteredCrops = useMemo(() => {
    const search = searchText.trim().toLocaleLowerCase()
    return crops.filter((crop) => (
      (!categoryId || crop.categoryId === categoryId)
      && (!search
        || crop.name.toLocaleLowerCase().includes(search)
        || (crop.description ?? '').toLocaleLowerCase().includes(search))
    ))
  }, [crops, searchText, categoryId])

  function clearFilters() {
    setSearchText('')
    setCategoryId('')
  }

  return (
    <div className="crop-catalog">
      {!embedded && (
        <div className="crop-catalog__heading">
          <div>
            <span className="section-kicker">SAMS crop library</span>
            <h1>Crop information</h1>
            <p>Browse published crop information and source-reviewed guidance.</p>
          </div>
          {role === 'admin' && (
            <Link className="button button--primary" to="/admin/crops">Manage crop catalog</Link>
          )}
        </div>
      )}

      <div className="crop-catalog__filters">
        <label className="form-field" htmlFor="crop-search">
          <span>Search crops</span>
          <input
            id="crop-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by crop name or description"
          />
        </label>
        <label className="form-field" htmlFor="crop-category">
          <span>Category</span>
          <select
            id="crop-category"
            className="farm-select"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">All crops</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <button className="button button--secondary crop-catalog__clear" type="button" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {error && (
        <ErrorState
          message={error}
          action={(
            <button className="button button--secondary" type="button" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          )}
        />
      )}
      {loading ? (
        <LoadingState label="Loading published crops..." />
      ) : !error && crops.length === 0 ? (
        <EmptyState
          title="No crop information published yet"
          description="The crop catalog will show records here after an administrator adds and approves them."
        />
      ) : !error && filteredCrops.length === 0 ? (
        <EmptyState
          title="No crops match your filters"
          description="Try another search or category, or clear the filters."
          action={<button className="button button--secondary" type="button" onClick={clearFilters}>Clear filters</button>}
        />
      ) : !error ? (
        <div className="crop-card-grid">
          {filteredCrops.map((crop) => (
            <article className="crop-card" key={crop.id}>
              <span className="crop-card__category">
                {categoryNames.get(crop.categoryId) ?? 'Category unavailable'}
              </span>
              <h2>{crop.name}</h2>
              <p>{crop.description || 'No description has been provided.'}</p>
              <Link className="text-link" to={`/crops/${crop.id}`}>View crop details</Link>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
