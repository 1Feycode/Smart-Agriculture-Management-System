import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { listAssignedSoilTests, soilErrorMessage } from '../services/soilService'
import type { SoilTest, SoilTestPage } from '../types/soil'
import { formatLabel } from '../utils/formatLabel'

export function ExpertSoilTestsPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<SoilTest[]>([])
  const [cursor, setCursor] = useState<SoilTestPage['nextCursor']>(null)
  const [loadedUid, setLoadedUid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const uid = user?.uid ?? ''

  useEffect(() => {
    if (!uid) return
    let active = true
    void listAssignedSoilTests(uid)
      .then((page) => {
        if (!active) return
        setRecords(page.records)
        setCursor(page.nextCursor)
        setError(null)
        setLoadedUid(uid)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(soilErrorMessage(loadError))
        setRecords([])
        setCursor(null)
        setLoadedUid(uid)
      })
    return () => {
      active = false
    }
  }, [uid])

  async function handleLoadMore() {
    if (!uid || !cursor || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const page = await listAssignedSoilTests(uid, cursor)
      setRecords((current) => [...current, ...page.records])
      setCursor(page.nextCursor)
    } catch (loadError) {
      setError(soilErrorMessage(loadError))
    } finally {
      setLoadingMore(false)
    }
  }

  if (loadedUid !== uid) return <LoadingState label="Loading assigned soil records..." />
  if (error && records.length === 0) return <ErrorState message={error} />

  return (
    <div className="soil-page">
      {error && <div className="account-feedback account-feedback--error" role="alert">{error}</div>}
      <p className="profile-page__intro">
        Only records assigned to your active expert account are shown. Review the source and reported status before updating a record.
      </p>
      {records.length === 0 ? (
        <EmptyState
          title="No soil records assigned"
          description="An administrator must assign a soil-test record before it appears in your review queue."
        />
      ) : (
        <div className="soil-record-list">
          {records.map((record) => <ExpertSoilRecordCard key={record.id} record={record} />)}
        </div>
      )}
      {cursor && (
        <button
          className="button button--secondary"
          type="button"
          disabled={loadingMore}
          onClick={() => void handleLoadMore()}
        >
          {loadingMore ? 'Loading...' : 'Load more soil records'}
        </button>
      )}
    </div>
  )
}

function ExpertSoilRecordCard({ record }: { record: SoilTest }) {
  return (
    <article className="soil-record-card">
      <div>
        <h2><Link to={`/expert/soil-tests/${record.id}`}>Farm record {record.farmId}</Link></h2>
        <p>{formatDate(record.testDate.toDate())} · {formatLabel(record.sourceType)} · {record.sourceName}</p>
      </div>
      <StatusBadge
        label={formatLabel(record.verificationStatus)}
        tone={record.verificationStatus === 'verified' ? 'success' : 'warning'}
      />
      <Link className="button button--secondary" to={`/expert/soil-tests/${record.id}`}>Review record</Link>
    </article>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}
