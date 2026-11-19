import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { farmErrorMessage, getFarm, setFarmStatus } from '../services/farmService'
import type { Farm } from '../types/farm'

export function FarmDetailsPage() {
  const { farmId } = useParams()
  const location = useLocation()
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loadedFarmId, setLoadedFarmId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingArchive, setConfirmingArchive] = useState(false)

  useEffect(() => {
    if (!farmId) return

    let active = true
    void getFarm(farmId)
      .then((record) => {
        if (!active) return
        setFarm(record)
        setError(null)
        setLoadedFarmId(farmId)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setFarm(null)
        setError(farmErrorMessage(loadError))
        setLoadedFarmId(farmId)
      })

    return () => {
      active = false
    }
  }, [farmId])

  async function handleStatusChange(status: 'active' | 'archived') {
    if (!farmId) return
    setSubmitting(true)
    setError(null)
    try {
      await setFarmStatus(farmId, status)
      const updatedFarm = await getFarm(farmId)
      setFarm(updatedFarm)
      setConfirmingArchive(false)
    } catch (updateError) {
      setError(farmErrorMessage(updateError))
    } finally {
      setSubmitting(false)
    }
  }

  if (!farmId) return <ErrorState message="A farm identifier is required." />
  if (loadedFarmId !== farmId) return <LoadingState label="Loading farm details..." />
  if (error && !farm) {
    return <ErrorState message={error} action={<Link className="button button--secondary" to="/farmer/farms">Back to farms</Link>} />
  }
  if (!farm) {
    return <ErrorState message="This farm could not be found." action={<Link className="button button--secondary" to="/farmer/farms">Back to farms</Link>} />
  }

  const successMessage = getFarmNotice(location.state)

  return (
    <div className="farm-details">
      {successMessage && <div className="account-feedback account-feedback--success" role="status">{successMessage}</div>}
      {error && <div className="account-feedback account-feedback--error" role="alert">{error}</div>}
      <section className="profile-card farm-details__card" aria-labelledby="farm-details-title">
        <div className="farm-details__heading">
          <div>
            <span className="section-kicker">Farm details</span>
            <h1 id="farm-details-title">{farm.name}</h1>
          </div>
          <StatusBadge
            label={farm.status === 'active' ? 'Active' : 'Archived'}
            tone={farm.status === 'active' ? 'success' : 'neutral'}
          />
        </div>
        <dl className="profile-details">
          <div><dt>Region</dt><dd>{farm.location.region}</dd></div>
          <div><dt>District</dt><dd>{farm.location.district}</dd></div>
          <div><dt>Community or town</dt><dd>{farm.location.community}</dd></div>
          <div>
            <dt>Farm area</dt>
            <dd>{farm.size.toLocaleString(undefined, { maximumFractionDigits: 2 })} {farm.sizeUnit === 'hectare' ? 'hectares' : 'acres'}</dd>
          </div>
          <div><dt>Last updated</dt><dd>{farm.updatedAt.toDate().toLocaleDateString()}</dd></div>
          <div><dt>Created</dt><dd>{farm.createdAt.toDate().toLocaleDateString()}</dd></div>
        </dl>
        <div className="profile-form__actions farm-details__actions">
          {farm.status === 'active' ? (
            <>
              <Link className="button button--primary" to={`/farmer/farms/${farm.id}/edit`}>Edit farm</Link>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setConfirmingArchive(true)}
              >
                Archive farm
              </button>
            </>
          ) : (
            <button
              className="button button--primary"
              type="button"
              disabled={submitting}
              onClick={() => void handleStatusChange('active')}
            >
              {submitting ? 'Restoring...' : 'Reactivate farm'}
            </button>
          )}
          <Link className="button button--secondary" to="/farmer/farms">Back to farms</Link>
        </div>
      </section>
      <ConfirmDialog
        open={confirmingArchive}
        title="Archive this farm?"
        description="The farm will leave your active list but remain in your records. You can reactivate it later."
        confirmLabel={submitting ? 'Archiving...' : 'Archive farm'}
        onCancel={() => setConfirmingArchive(false)}
        onConfirm={() => {
          if (!submitting) void handleStatusChange('archived')
        }}
      />
      <section className="farm-modules" aria-labelledby="farm-modules-title">
        <div className="farm-dashboard__section-heading">
          <div>
            <h2 id="farm-modules-title">Farm records and information</h2>
            <p>Additional records will appear here when their approved modules are available.</p>
          </div>
        </div>
        <div className="farm-module-grid">
          <article className="farm-module-card">
            <h3>Crops</h3>
            <p>Crop association is pending integration with the approved crop catalog.</p>
          </article>
          <article className="farm-module-card">
            <h3>Soil records</h3>
            <p>Soil-test records are not available yet. No measurements are stored on this farm.</p>
          </article>
          <article className="farm-module-card">
            <h3>Fertilizer recommendations</h3>
            <p>Recommendations will appear here after that module is implemented.</p>
          </article>
          <article className="farm-module-card">
            <h3>Weather</h3>
            <p>Farm-specific weather information is not available yet.</p>
          </article>
          <article className="farm-module-card">
            <h3>Farming activity summary</h3>
            <p>Activity-summary fields are not collected in this phase; the schema awaits confirmed activity requirements.</p>
          </article>
          <article className="farm-module-card">
            <h3>Farm activity history</h3>
            <p>Activity history is not available yet; no activity records have been added.</p>
          </article>
        </div>
      </section>
    </div>
  )
}

function getFarmNotice(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('farmNotice' in value)) return null
  return typeof value.farmNotice === 'string' ? value.farmNotice : null
}
