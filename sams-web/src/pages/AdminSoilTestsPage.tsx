import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { listRecentSoilTests, soilErrorMessage } from '../services/soilService'
import type { SoilTest, SoilTestPage } from '../types/soil'
import { formatLabel } from '../utils/formatLabel'

export function AdminSoilTestsPage() {
  const [records, setRecords] = useState<SoilTest[]>([])
  const [cursor, setCursor] = useState<SoilTestPage['nextCursor']>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let active = true
    void listRecentSoilTests()
      .then((page) => {
        if (!active) return
        setRecords(page.records)
        setCursor(page.nextCursor)
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (active) setError(soilErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleLoadMore() {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const page = await listRecentSoilTests(cursor)
      setRecords((current) => [...current, ...page.records])
      setCursor(page.nextCursor)
    } catch (loadError) {
      setError(soilErrorMessage(loadError))
    } finally {
      setLoadingMore(false)
    }
  }

  if (!loaded) return <LoadingState label="Loading soil-test assignments..." />
  if (error && records.length === 0) return <ErrorState message={error} />

  return (
    <div className="soil-page">
      {error && <div className="account-feedback account-feedback--error" role="alert">{error}</div>}
      <p className="profile-page__intro">
        Assign records to active experts by UID. Expert assignment is required before an expert can open or review a soil test.
      </p>
      {records.length === 0 ? (
        <EmptyState title="No soil-test records yet" description="Farmer-submitted records will appear here for assignment." />
      ) : (
        <div className="soil-record-list">
          {records.map((record) => <AdminSoilRecordCard key={record.id} record={record} />)}
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

function AdminSoilRecordCard({ record }: { record: SoilTest }) {
  return (
    <article className="soil-record-card">
      <div>
        <h2><Link to={`/admin/soil-tests/${record.id}`}>Farm record {record.farmId}</Link></h2>
        <p>{formatDate(record.testDate.toDate())} · Owner {record.ownerUid}</p>
        <p>{formatLabel(record.sourceType)} · {record.sourceName}</p>
        <p>{record.assignedExpertUid ? `Assigned: ${record.assignedExpertUid}` : 'No expert assigned'}</p>
      </div>
      <StatusBadge
        label={formatLabel(record.verificationStatus)}
        tone={record.verificationStatus === 'verified' ? 'success' : 'warning'}
      />
      <Link className="button button--secondary" to={`/admin/soil-tests/${record.id}`}>Manage assignment</Link>
    </article>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}
