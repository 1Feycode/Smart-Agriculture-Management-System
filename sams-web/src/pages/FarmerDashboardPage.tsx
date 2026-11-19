import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { useAuth } from '../hooks/useAuth'
import { countActiveFarms, farmErrorMessage, listFarms } from '../services/farmService'
import type { Farm } from '../types/farm'

interface DashboardResult<T> {
  uid: string
  value?: T
  error?: string
}

export function FarmerDashboardPage() {
  const { user, profile } = useAuth()
  const [activeFarmResult, setActiveFarmResult] = useState<DashboardResult<number> | null>(null)
  const [recentFarmResult, setRecentFarmResult] = useState<DashboardResult<Farm[]> | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!user) return

    let active = true
    void countActiveFarms(user.uid)
      .then((count) => {
        if (active) setActiveFarmResult({ uid: user.uid, value: count })
      })
      .catch((error: unknown) => {
        if (active) setActiveFarmResult({ uid: user.uid, error: farmErrorMessage(error) })
      })

    void listFarms(user.uid, 'active')
      .then((page) => {
        if (active) setRecentFarmResult({ uid: user.uid, value: page.farms.slice(0, 3) })
      })
      .catch((error: unknown) => {
        if (active) setRecentFarmResult({ uid: user.uid, error: farmErrorMessage(error) })
      })

    return () => {
      active = false
    }
  }, [user, reloadKey])

  if (!user) return null

  const activeFarmState = activeFarmResult?.uid === user.uid ? activeFarmResult : null
  const recentFarmState = recentFarmResult?.uid === user.uid ? recentFarmResult : null

  return (
    <div className="farm-dashboard">
      <section className="farm-dashboard__welcome">
        <div>
          <span className="section-kicker">Farmer workspace</span>
          <h2>Welcome, {profile?.displayName || 'Farmer'}</h2>
          <p>Keep your farm information up to date and easy to find.</p>
        </div>
        <div className="farm-dashboard__actions">
          <Link className="button button--primary" to="/farmer/farms/new">Add a farm</Link>
          <Link className="button button--secondary" to="/farmer/farms">View all farms</Link>
          <Link className="text-link" to="/farmer/profile">Manage profile</Link>
        </div>
      </section>

      <section className="farm-dashboard__metric" aria-label="Active farms">
        <span>Active farms</span>
        {!activeFarmState ? (
          <strong aria-label="Loading active farms">Loading...</strong>
        ) : activeFarmState.error ? (
          <div>
            <p className="account-feedback account-feedback--error" role="alert">{activeFarmState.error}</p>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              Try again
            </button>
          </div>
        ) : (
          <strong>{activeFarmState.value}</strong>
        )}
      </section>

      <section className="farm-dashboard__recent" aria-labelledby="recent-farms-title">
        <div className="farm-dashboard__section-heading">
          <div>
            <h2 id="recent-farms-title">Recent farms</h2>
            <p>Your most recently updated active farms.</p>
          </div>
          <Link className="text-link" to="/farmer/farms">View all</Link>
        </div>

        {!recentFarmState ? (
          <LoadingState label="Loading recent farms..." />
        ) : recentFarmState.error ? (
          <ErrorState
            message={recentFarmState.error}
            action={(
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                Try again
              </button>
            )}
          />
        ) : recentFarmState.value?.length ? (
          <div className="farm-card-grid">
            {recentFarmState.value.map((farm) => (
              <article className="farm-card" key={farm.id}>
                <h3><Link to={`/farmer/farms/${farm.id}`}>{farm.name}</Link></h3>
                <p>{farm.location.community}, {farm.location.district}, {farm.location.region}</p>
                <p className="farm-card__size">
                  {farm.size.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                  {farm.sizeUnit === 'hectare' ? 'hectares' : 'acres'}
                </p>
                <Link className="text-link" to={`/farmer/farms/${farm.id}`}>View details</Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Start by adding your first farm"
            description="Your recent farms will appear here after you add them."
            action={<Link className="button button--primary" to="/farmer/farms/new">Add your first farm</Link>}
          />
        )}
      </section>
    </div>
  )
}
