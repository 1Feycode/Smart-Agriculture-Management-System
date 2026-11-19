import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { farmErrorMessage, listFarms } from '../services/farmService'
import type { Farm, FarmPage, FarmSort, FarmStatus } from '../types/farm'

export function FarmListPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<FarmStatus>('active')
  const [sort, setSort] = useState<FarmSort>('updatedAt')
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [farms, setFarms] = useState<Farm[]>([])
  const [cursor, setCursor] = useState<FarmPage['nextCursor']>(null)
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorQuery, setErrorQuery] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchText.trim()), 250)
    return () => window.clearTimeout(timeout)
  }, [searchText])

  const effectiveSort: FarmSort = search ? 'name' : sort
  const queryKey = `${status}|${search}|${effectiveSort}`

  useEffect(() => {
    if (!user) return

    let active = true
    void listFarms(user.uid, status, { search, sort: effectiveSort })
      .then((page) => {
        if (!active) return
        setFarms(page.farms)
        setCursor(page.nextCursor)
        setError(null)
        setErrorQuery(null)
        setLoadedQuery(queryKey)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setFarms([])
        setCursor(null)
        setError(farmErrorMessage(loadError))
        setErrorQuery(queryKey)
        setLoadedQuery(queryKey)
      })

    return () => {
      active = false
    }
  }, [user, status, search, effectiveSort, queryKey])

  async function handleLoadMore() {
    if (!user || !cursor || loadedQuery !== queryKey || loadingMore) return
    setLoadingMore(true)
    setError(null)
    setErrorQuery(null)
    try {
      const page = await listFarms(user.uid, status, {
        cursor,
        search,
        sort: effectiveSort,
      })
      setFarms((current) => [...current, ...page.farms])
      setCursor(page.nextCursor)
    } catch (loadError) {
      setError(farmErrorMessage(loadError))
      setErrorQuery(queryKey)
    } finally {
      setLoadingMore(false)
    }
  }

  const loading = loadedQuery !== queryKey
  const visibleFarms = loading ? [] : farms
  const queryError = Boolean(error && errorQuery === queryKey && visibleFarms.length === 0)

  return (
    <div className="farm-page">
      <div className="farm-page__toolbar">
        <div className="farm-status-tabs" aria-label="Farm status">
          <button
            className={status === 'active' ? 'is-selected' : ''}
            type="button"
            aria-pressed={status === 'active'}
            disabled={loadingMore}
            onClick={() => setStatus('active')}
          >
            Active farms
          </button>
          <button
            className={status === 'archived' ? 'is-selected' : ''}
            type="button"
            aria-pressed={status === 'archived'}
            disabled={loadingMore || loading}
            onClick={() => setStatus('archived')}
          >
            Archived farms
          </button>
        </div>
        {status === 'active' && (
          <Link className="button button--primary" to="/farmer/farms/new">Add farm</Link>
        )}
      </div>

      <div className="farm-page__filters">
        <label className="form-field farm-page__search" htmlFor="farm-search">
          <span>Search farm names</span>
          <input
            id="farm-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Start typing a farm name"
          />
        </label>
        <label className="form-field farm-page__sort" htmlFor="farm-sort">
          <span>Sort by</span>
          <select
            id="farm-sort"
            className="farm-select"
            value={effectiveSort}
            disabled={Boolean(search) || loading || loadingMore}
            onChange={(event) => {
              if (event.target.value === 'name' || event.target.value === 'updatedAt') {
                setSort(event.target.value)
              }
            }}
          >
            <option value="updatedAt">Recently updated</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </label>
      </div>
      {search && <p className="farm-page__search-note">Search matches farm names that start with your text; it is case-sensitive.</p>}

      {error && errorQuery === queryKey && <ErrorState message={error} />}
      {loading && <LoadingState label="Loading your farms..." />}
      {!loading && !queryError && (visibleFarms.length === 0 ? (
        <EmptyState
          title={search
            ? 'No matching farms'
            : status === 'active' ? 'No farms registered yet' : 'No archived farms'}
          description={search
            ? 'Try another farm name or clear the search.'
            : status === 'active'
            ? 'Add your first farm to keep its location and size together in one place.'
            : 'Farms you archive will be kept here for your records.'}
          action={!search && status === 'active'
            ? <Link className="button button--primary" to="/farmer/farms/new">Add your first farm</Link>
            : undefined}
        />
      ) : (
        <>
          <div className="farm-card-grid">
            {visibleFarms.map((farm) => (
              <article className="farm-card" key={farm.id}>
                <div className="farm-card__heading">
                  <h2><Link to={`/farmer/farms/${farm.id}`}>{farm.name}</Link></h2>
                  <StatusBadge
                    label={farm.status === 'active' ? 'Active' : 'Archived'}
                    tone={farm.status === 'active' ? 'success' : 'neutral'}
                  />
                </div>
                <p>{farm.location.community}, {farm.location.district}, {farm.location.region}</p>
                <p className="farm-card__size">
                  {formatSize(farm.size)} {farm.sizeUnit === 'hectare' ? 'hectares' : 'acres'}
                </p>
                <div className="farm-card__actions">
                  <Link className="button button--secondary" to={`/farmer/farms/${farm.id}`}>View details</Link>
                  {farm.status === 'active' && (
                    <Link className="button button--secondary" to={`/farmer/farms/${farm.id}/edit`}>Edit</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
          {cursor && (
            <div className="farm-page__load-more">
              <button
                className="button button--secondary"
                type="button"
                disabled={loadingMore}
                onClick={() => void handleLoadMore()}
              >
                {loadingMore ? 'Loading...' : 'Load more farms'}
              </button>
            </div>
          )}
        </>
      ))}
    </div>
  )
}

function formatSize(size: number): string {
  return size.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
