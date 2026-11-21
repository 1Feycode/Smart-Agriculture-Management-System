import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { FormField } from '../forms/FormField'
import { firebaseAuthErrorMessage } from '../services/authService'
import {
  createCropCategory,
  listManagedCropCategories,
  listManagedCrops,
  updateCropCategory,
} from '../services/cropService'
import type { Crop, CropCategory, CropCategoryInput } from '../types/crop'

export function CropManagementPage() {
  const location = useLocation()
  const [crops, setCrops] = useState<Crop[]>([])
  const [categories, setCategories] = useState<CropCategory[]>([])
  const [search, setSearch] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [editingCategory, setEditingCategory] = useState<CropCategory | null>(null)
  const [loadedKey, setLoadedKey] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(() => getCropNotice(location.state))
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    void Promise.all([listManagedCrops(), listManagedCropCategories()])
      .then(([cropRecords, categoryRecords]) => {
        if (!active) return
        setCrops(cropRecords)
        setCategories(categoryRecords)
        setError(null)
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
  const filteredCrops = crops.filter((crop) => (
    crop.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ))

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFeedback(null)
    if (!event.currentTarget.reportValidity()) return

    const input: CropCategoryInput = {
      name: categoryName.trim(),
      description: categoryDescription.trim(),
      status: editingCategory?.status ?? 'active',
    }

    if (!input.name || !input.description) {
      setError('Enter both a category name and description.')
      return
    }

    setSubmitting(true)
    try {
      if (editingCategory) {
        await updateCropCategory(editingCategory.id, input)
        setFeedback('Category updated.')
      } else {
        await createCropCategory(input)
        setFeedback('Category created.')
      }
      setCategoryName('')
      setCategoryDescription('')
      setEditingCategory(null)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setError(firebaseAuthErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  function startCategoryEdit(category: CropCategory) {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description)
    setError(null)
    setFeedback(null)
  }

  async function handleCategoryStatus(category: CropCategory) {
    const nextStatus = category.status === 'active' ? 'inactive' : 'active'
    setError(null)
    setFeedback(null)
    setSubmitting(true)
    try {
      await updateCropCategory(category.id, {
        name: category.name,
        description: category.description,
        status: nextStatus,
      })
      setFeedback(`${category.name} is now ${nextStatus}.`)
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setError(firebaseAuthErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="crop-management">
      <p className="profile-page__intro">
        Maintain crop records and categories. Only active, approved, public crops appear in the public catalog.
      </p>
      {error && <div className="account-feedback account-feedback--error" role="alert">{error}</div>}
      {feedback && <div className="account-feedback account-feedback--success" role="status">{feedback}</div>}

      <section className="profile-card" aria-labelledby="managed-crops-title">
        <div className="crop-management__section-heading">
          <div>
            <h2 id="managed-crops-title">Crop records</h2>
            <p>Create, review, publish, and archive catalog entries. Records are not permanently deleted.</p>
          </div>
          <Link className="button button--primary" to="/admin/crops/new">Add crop</Link>
        </div>
        <label className="form-field crop-management__search" htmlFor="managed-crop-search">
          <span>Search crop names</span>
          <input
            id="managed-crop-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        {loading ? (
          <LoadingState label="Loading crop records..." />
        ) : crops.length === 0 ? (
          <EmptyState
            title="No crop records yet"
            description="Add a crop record using a trusted source. Crop facts are not preloaded."
            action={<Link className="button button--primary" to="/admin/crops/new">Add crop</Link>}
          />
        ) : filteredCrops.length === 0 ? (
          <EmptyState title="No matching crops" description="Try a different crop name." />
        ) : (
          <div className="crop-management__list">
            {filteredCrops.map((crop) => (
              <article className="crop-management__item" key={crop.id}>
                <div>
                  <h3>{crop.name}</h3>
                  <p>{categoryNames.get(crop.categoryId) ?? 'Category unavailable'}</p>
                  <div className="crop-management__badges">
                    <span>{crop.status}</span>
                    <span>{crop.reviewStatus}</span>
                    <span>{crop.isPublic ? 'Public' : 'Not public'}</span>
                  </div>
                </div>
                <Link className="button button--secondary" to={`/admin/crops/${crop.id}/edit`}>Edit</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="profile-card" aria-labelledby="crop-categories-title">
        <h2 id="crop-categories-title">Crop categories</h2>
        <form className="profile-form crop-category-form" onSubmit={(event) => void handleCategorySubmit(event)} noValidate>
          <FormField
            id="crop-category-name"
            name="categoryName"
            label="Category name"
            required
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
          />
          <div className="form-field">
            <label htmlFor="crop-category-description">Description</label>
            <textarea
              id="crop-category-description"
              required
              rows={3}
              value={categoryDescription}
              onChange={(event) => setCategoryDescription(event.target.value)}
            />
          </div>
          <div className="profile-form__actions">
            <button className="button button--primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingCategory ? 'Save category' : 'Add category'}
            </button>
            {editingCategory && (
              <button
                className="button button--secondary"
                type="button"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryName('')
                  setCategoryDescription('')
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <LoadingState label="Loading crop categories..." />
        ) : categories.length === 0 ? (
          <p className="crop-management__note">No categories have been created.</p>
        ) : (
          <div className="crop-management__list">
            {categories.map((category) => (
              <article className="crop-management__item" key={category.id}>
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span className="crop-management__category-status">{category.status}</span>
                </div>
                <div className="farm-card__actions">
                  <button className="button button--secondary" type="button" onClick={() => startCategoryEdit(category)}>
                    Edit
                  </button>
                  <button
                    className="button button--secondary"
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleCategoryStatus(category)}
                  >
                    {category.status === 'active' ? 'Archive' : 'Reactivate'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function getCropNotice(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('cropNotice' in value)) return null
  return typeof value.cropNotice === 'string' ? value.cropNotice : null
}
