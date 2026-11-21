import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { farmErrorMessage, getFarm, listAllFarms } from '../services/farmService'
import { listFarmerSoilTests, soilErrorMessage } from '../services/soilService'
import type { Farm } from '../types/farm'
import type { SoilTest, SoilTestPage } from '../types/soil'
import { formatLabel } from '../utils/formatLabel'

export function FarmerSoilTestsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const farmId = searchParams.get('farmId') ?? ''
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [records, setRecords] = useState<SoilTest[]>([])
  const [cursor, setCursor] = useState<SoilTestPage['nextCursor']>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const queryKey = `${user?.uid ?? 'pending'}|${farmId}`

  useEffect(() => {
    if (!user) return
    const ownerUid = user.uid
    let active = true

    async function loadSoilPage() {
      try {
        if (!farmId) {
          const farmRecords = await listAllFarms(ownerUid, 'active')
          if (!active) return
          setFarms(farmRecords)
          setSelectedFarm(null)
          setRecords([])
          setCursor(null)
        } else {
          const farm = await getFarm(farmId)
          if (!farm || farm.ownerUid !== ownerUid) {
            throw new Error('This farm could not be found in your farm records.')
          }
          const page = await listFarmerSoilTests(ownerUid, farmId)
          if (!active) return
          setSelectedFarm(farm)
          setRecords(page.records)
          setCursor(page.nextCursor)
        }
        setError(null)
      } catch (loadError) {
        if (!active) return
        setError(farmId ? soilErrorMessage(loadError) : farmErrorMessage(loadError))
        setRecords([])
        setCursor(null)
      } finally {
        if (active) setLoadedKey(queryKey)
      }
    }

    void loadSoilPage()
    return () => {
      active = false
    }
  }, [user, farmId, queryKey])

  const loading = loadedKey !== queryKey
  const visibleRecords = loading ? [] : records

  async function handleLoadMore() {
    if (!user || !farmId || !cursor || loadingMore) return
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const page = await listFarmerSoilTests(user.uid, farmId, cursor)
      setRecords((current) => [...current, ...page.records])
      setCursor(page.nextCursor)
    } catch (loadError) {
      setLoadMoreError(soilErrorMessage(loadError))
    } finally {
      setLoadingMore(false)
    }
  }

  function chooseFarm(nextFarmId: string) {
    if (nextFarmId) setSearchParams({ farmId: nextFarmId })
    else setSearchParams({})
  }

  return (
    <div className="soil-page">
      {loading ? (
        <LoadingState label="Loading your soil records..." />
      ) : farmId && error ? (
        <ErrorState message={error} action={<Link className="button button--secondary" to="/farmer/soil-tests">Choose a farm</Link>} />
      ) : !farmId && error ? (
        <ErrorState message={error} action={<Link className="button button--secondary" to="/farmer/dashboard">Back to dashboard</Link>} />
      ) : selectedFarm ? (
        <>
          {loadMoreError && <div className="account-feedback account-feedback--error" role="alert">{loadMoreError}</div>}
          <div className="soil-page__heading">
            <div>
              <span className="section-kicker">Farm soil records</span>
              <h2>{selectedFarm.name}</h2>
              <p>Each record retains its test date, source, measurements, and review status.</p>
            </div>
            <div className="farm-card__actions">
              <button className="button button--secondary" type="button" onClick={() => chooseFarm('')}>Choose another farm</button>
              {selectedFarm.status === 'active' && (
                <Link className="button button--primary" to={`/farmer/soil-tests/new?farmId=${selectedFarm.id}`}>Add soil test</Link>
              )}
            </div>
          </div>
          {visibleRecords.length === 0 ? (
            <EmptyState
              title="No soil tests recorded"
              description="General soil observations are saved separately on the farm. Add a dated record when you have soil-test information."
              action={selectedFarm.status === 'active'
                ? <Link className="button button--primary" to={`/farmer/soil-tests/new?farmId=${selectedFarm.id}`}>Add soil test</Link>
                : undefined}
            />
          ) : (
            <div className="soil-record-list">
              {visibleRecords.map((record) => <SoilTestCard key={record.id} record={record} />)}
            </div>
          )}
          {cursor && (
            <button
              className="button button--secondary"
              type="button"
              disabled={loadingMore}
              onClick={() => void handleLoadMore()}
            >
              {loadingMore ? 'Loading...' : 'Load more soil tests'}
            </button>
          )}
        </>
      ) : farms.length === 0 ? (
        <EmptyState
          title="Add a farm first"
          description="Soil information must be associated with one of your farms."
          action={<Link className="button button--primary" to="/farmer/farms/new">Add farm</Link>}
        />
      ) : (
        <section className="soil-farm-picker" aria-labelledby="soil-farm-picker-title">
          <div>
            <span className="section-kicker">Soil management</span>
            <h2 id="soil-farm-picker-title">Choose a farm</h2>
            <p>Choose an active farm to view or add its dated soil-test records.</p>
          </div>
          <label className="form-field" htmlFor="soil-farm-select">
            <span>Farm</span>
            <select
              id="soil-farm-select"
              value=""
              onChange={(event) => chooseFarm(event.target.value)}
            >
              <option value="">Select a farm</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </label>
          <div className="soil-farm-picker__cards">
            {farms.map((farm) => (
              <article className="farm-module-card" key={farm.id}>
                <h3>{farm.name}</h3>
                <p>{farm.location.district}, {farm.location.region}</p>
                <div className="farm-card__actions">
                  <button className="button button--secondary" type="button" onClick={() => chooseFarm(farm.id)}>
                    View tests
                  </button>
                  <Link className="button button--primary" to={`/farmer/soil-tests/new?farmId=${farm.id}`}>
                    Add soil test
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SoilTestCard({ record }: { record: SoilTest }) {
  return (
    <article className="soil-record-card">
      <div>
        <h3><Link to={`/farmer/soil-tests/${record.id}`}>Soil test: {formatDate(record.testDate.toDate())}</Link></h3>
        <p>Source: {formatLabel(record.sourceType)} — {record.sourceName}</p>
      </div>
      <StatusBadge
        label={formatLabel(record.verificationStatus)}
        tone={record.verificationStatus === 'verified' ? 'success' : 'warning'}
      />
      <dl>
        <div><dt>pH</dt><dd>{record.ph == null ? 'Not measured' : record.ph}</dd></div>
        <div><dt>Nutrient results</dt><dd>{record.nutrients ? Object.keys(record.nutrients).length : 0}</dd></div>
      </dl>
    </article>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}
