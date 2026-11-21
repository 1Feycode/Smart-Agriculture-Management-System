import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { FormField } from '../forms/FormField'
import { useAuth } from '../hooks/useAuth'
import { getSoilTest, assignSoilTest, reviewSoilTest, soilErrorMessage } from '../services/soilService'
import {
  isSoilVerificationStatus,
  SOIL_VERIFICATION_STATUSES,
  type SoilTest,
  type SoilVerificationStatus,
} from '../types/soil'
import type { UserRole } from '../types/user'
import { formatLabel } from '../utils/formatLabel'

export function SoilTestDetailsPage() {
  const { soilTestId } = useParams()
  const { role } = useAuth()
  const location = useLocation()
  const [record, setRecord] = useState<SoilTest | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState<SoilVerificationStatus>('unverified')
  const [reviewNotes, setReviewNotes] = useState('')
  const [expertUid, setExpertUid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(() => getSoilNotice(location.state))

  useEffect(() => {
    if (!soilTestId) return
    let active = true
    void getSoilTest(soilTestId)
      .then((soilTest) => {
        if (!active) return
        setRecord(soilTest)
        if (soilTest) {
          setReviewStatus(soilTest.verificationStatus)
          setReviewNotes(soilTest.reviewNotes ?? '')
          setExpertUid(soilTest.assignedExpertUid ?? '')
        }
        setLoadError(null)
        setLoadedId(soilTestId)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setLoadError(soilErrorMessage(loadError))
        setLoadedId(soilTestId)
      })
    return () => {
      active = false
    }
  }, [soilTestId])

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!soilTestId || !event.currentTarget.reportValidity()) return
    setError(null)
    setFeedback(null)
    setSubmitting(true)
    try {
      await reviewSoilTest(soilTestId, reviewStatus, reviewNotes)
      const updatedRecord = await getSoilTest(soilTestId)
      setRecord(updatedRecord)
      setFeedback('Expert review saved.')
    } catch (saveError) {
      setError(soilErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAssignmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!soilTestId || !event.currentTarget.reportValidity()) return
    setError(null)
    setFeedback(null)
    setSubmitting(true)
    try {
      await assignSoilTest(soilTestId, expertUid.trim())
      const updatedRecord = await getSoilTest(soilTestId)
      setRecord(updatedRecord)
      setExpertUid(updatedRecord?.assignedExpertUid ?? '')
      setFeedback('Expert assignment saved.')
    } catch (saveError) {
      setError(soilErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnassign() {
    if (!soilTestId) return
    setError(null)
    setFeedback(null)
    setSubmitting(true)
    try {
      await assignSoilTest(soilTestId, null)
      const updatedRecord = await getSoilTest(soilTestId)
      setRecord(updatedRecord)
      setExpertUid('')
      setFeedback('Expert assignment removed.')
    } catch (saveError) {
      setError(soilErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  if (!soilTestId) return <ErrorState message="A soil-test identifier is required." />
  if (loadedId !== soilTestId) return <LoadingState label="Loading soil-test record..." />
  if (loadError) return <ErrorState message={loadError} action={<BackLink role={role} record={record} />} />
  if (!record) return <ErrorState message="This soil-test record could not be found." action={<BackLink role={role} record={record} />} />

  const farmerEstimate = record.sourceType === 'farmer-estimate'

  return (
    <div className="soil-details-page">
      {feedback && <div className="account-feedback account-feedback--success" role="status">{feedback}</div>}
      {error && <div className="account-feedback account-feedback--error" role="alert">{error}</div>}
      <section className="profile-card soil-details-card" aria-labelledby="soil-test-title">
        <div className="soil-details-card__heading">
          <div>
            <span className="section-kicker">Soil-test record</span>
            <h2 id="soil-test-title">{formatDate(record.testDate.toDate())}</h2>
            <p>{farmerEstimate ? 'Farmer-reported estimate' : formatLabel(record.sourceType)} — {record.sourceName}</p>
          </div>
          <StatusBadge
            label={formatLabel(record.verificationStatus)}
            tone={record.verificationStatus === 'verified' ? 'success' : 'warning'}
          />
        </div>
        <p className="soil-details-card__source-note">
          {farmerEstimate
            ? 'These values are farmer-reported and are not laboratory results.'
            : record.sourceType === 'laboratory'
              ? 'Laboratory source is recorded; the results are not considered verified until an assigned expert reviews them.'
              : 'The recorded source type is other; check the source details before relying on these values.'}
        </p>
        <dl className="profile-details">
          <div><dt>Farm reference</dt><dd>{record.farmId}</dd></div>
          <div><dt>Test date</dt><dd>{formatDate(record.testDate.toDate())}</dd></div>
          <div><dt>pH</dt><dd>{record.ph == null ? 'Not measured' : record.ph}</dd></div>
          <div><dt>Reported soil type</dt><dd>{record.soilType || 'Not reported'}</dd></div>
          <div><dt>Reported texture</dt><dd>{record.texture || 'Not reported'}</dd></div>
          <div><dt>Created</dt><dd>{formatDate(record.createdAt.toDate())}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDate(record.updatedAt.toDate())}</dd></div>
        </dl>
        {record.nutrients && Object.keys(record.nutrients).length > 0 ? (
          <section className="soil-nutrient-results" aria-labelledby="soil-nutrient-results-title">
            <h3 id="soil-nutrient-results-title">Recorded nutrient results</h3>
            <div className="soil-nutrient-results__list">
              {Object.entries(record.nutrients).map(([name, result]) => (
                <article key={name}>
                  <h4>{name}</h4>
                  <p>{result.value} {result.unit}</p>
                  <p>{result.method ? `Method: ${result.method}` : 'Method not provided'}</p>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <p>No nutrient results were recorded.</p>
        )}
        {record.reviewNotes && (
          <section className="soil-review-notes" aria-labelledby="soil-review-notes-title">
            <h3 id="soil-review-notes-title">Expert review notes</h3>
            <p>{record.reviewNotes}</p>
          </section>
        )}
        <p className="soil-details-card__audit">
          Submitted by farmer account {record.ownerUid}
          {record.assignedExpertUid ? ` · Assigned expert ${record.assignedExpertUid}` : ' · No expert assigned'}
        </p>
        <div className="profile-form__actions">
          <BackLink role={role} record={record} />
          {role === 'farmer' && (
            <Link className="button button--secondary" to={`/farmer/farms/${record.farmId}`}>View farm</Link>
          )}
        </div>
      </section>

      {role === 'expert' && (
        <section className="profile-card soil-review-form" aria-labelledby="soil-review-title">
          <h2 id="soil-review-title">Expert review</h2>
          <p>Saving a review updates only verification status and review notes. Source measurements remain unchanged.</p>
          <form className="profile-form" onSubmit={(event) => void handleReviewSubmit(event)} noValidate>
            <div className="form-field">
              <label htmlFor="soil-verification-status">Review status</label>
              <select
                id="soil-verification-status"
                required
                value={reviewStatus}
                onChange={(event) => {
                  const nextStatus = event.target.value
                  if (isSoilVerificationStatus(nextStatus)) {
                    setReviewStatus(nextStatus)
                  }
                }}
              >
                {SOIL_VERIFICATION_STATUSES.map((status) => (
                  <option value={status} key={status}>{formatLabel(status)}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="soil-review-notes">Review notes</label>
              <textarea
                id="soil-review-notes"
                rows={5}
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
              />
            </div>
            <button className="button button--primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save review'}
            </button>
          </form>
        </section>
      )}

      {role === 'admin' && (
        <section className="profile-card soil-assignment-form" aria-labelledby="soil-assignment-title">
          <h2 id="soil-assignment-title">Assign an agricultural expert</h2>
          <p>Enter an active expert's Firebase UID. Firestore Rules reject missing, inactive, or non-expert accounts.</p>
          <form className="profile-form" onSubmit={(event) => void handleAssignmentSubmit(event)} noValidate>
            <FormField
              id="soil-assigned-expert"
              name="assignedExpertUid"
              label="Expert UID"
              required
              value={expertUid}
              onChange={(event) => setExpertUid(event.target.value)}
            />
            <div className="profile-form__actions">
              <button className="button button--primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Assign expert'}
              </button>
              {record.assignedExpertUid && (
                <button className="button button--secondary" type="button" disabled={submitting} onClick={() => void handleUnassign()}>
                  Remove assignment
                </button>
              )}
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

function BackLink({ role, record }: { role: UserRole | null; record: SoilTest | null }) {
  const destination = role === 'expert'
    ? '/expert/soil-tests'
    : role === 'admin'
      ? '/admin/soil-tests'
      : record
        ? `/farmer/soil-tests?farmId=${record.farmId}`
        : '/farmer/soil-tests'
  return <Link className="button button--secondary" to={destination}>Back to soil records</Link>
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

function getSoilNotice(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('soilNotice' in value)) return null
  return typeof value.soilNotice === 'string' ? value.soilNotice : null
}
