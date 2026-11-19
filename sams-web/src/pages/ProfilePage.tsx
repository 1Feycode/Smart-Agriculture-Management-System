import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FormField } from '../forms/FormField'
import { useAuth } from '../hooks/useAuth'
import { firebaseAuthErrorMessage } from '../services/authService'
import { roleDashboardPaths, roleLabels, type AdministrativeLocation } from '../types/user'

export function ProfilePage() {
  const { user, profile, role, updateProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [region, setRegion] = useState(profile?.location?.region ?? '')
  const [district, setDistrict] = useState(profile?.location?.district ?? '')
  const [community, setCommunity] = useState(profile?.location?.community ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | undefined>()

  if (!user || !profile || !role) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = displayName.trim()
    const location = {
      region: region.trim(),
      district: district.trim(),
      community: community.trim(),
    }
    if (!trimmedName) {
      setNameError('Enter your full name.')
      return
    }
    if (trimmedName.length > 120) {
      setNameError('Your name must be 120 characters or fewer.')
      return
    }
    setNameError(undefined)
    if (!location.region || !location.district || !location.community) {
      setError('Enter your region, district, and community or town.')
      return
    }
    if (Object.values(location).some((value) => value.length > 100)) {
      setError('Each location field must be 100 characters or fewer.')
      return
    }

    setError(null)
    setMessage(null)
    setSubmitting(true)
    try {
      await updateProfile(trimmedName, location)
      setDisplayName(trimmedName)
      setRegion(location.region)
      setDistrict(location.district)
      setCommunity(location.community)
      setMessage('Your profile has been updated.')
    } catch (updateError) {
      setError(firebaseAuthErrorMessage(updateError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="content-page profile-page">
      <span className="section-kicker">SAMS account</span>
      <h1>Your profile</h1>
      <p className="profile-page__intro">Review and update your account information.</p>

      <section className="profile-card" aria-labelledby="profile-details-title">
        <h2 id="profile-details-title">Account details</h2>
        <dl className="profile-details">
          <div><dt>Email address</dt><dd>{user.email ?? 'Not available'}</dd></div>
          <div><dt>Role</dt><dd>{roleLabels[role]}</dd></div>
          <div><dt>Account status</dt><dd>{profile.status}</dd></div>
          {profile.location && (
            <div>
              <dt>Location</dt>
              <dd>{formatLocation(profile.location)}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="profile-card" aria-labelledby="edit-profile-title">
        <h2 id="edit-profile-title">Edit profile</h2>
        <p className="profile-page__note">
          Location is used to tailor agricultural information. Enter administrative areas only; SAMS does not request precise coordinates.
        </p>
        <form className="profile-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <FormField
            id="profile-display-name"
            name="displayName"
            label="Full name"
            autoComplete="name"
            maxLength={120}
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            error={nameError}
          />
          <FormField
            id="profile-region"
            name="region"
            label="Region"
            maxLength={100}
            autoComplete="address-level1"
            required
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          />
          <FormField
            id="profile-district"
            name="district"
            label="District"
            maxLength={100}
            autoComplete="address-level2"
            required
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
          />
          <FormField
            id="profile-community"
            name="community"
            label="Community or town"
            maxLength={100}
            autoComplete="address-level3"
            required
            value={community}
            onChange={(event) => setCommunity(event.target.value)}
          />
          {error && <div className="account-feedback account-feedback--error" role="alert">{error}</div>}
          {message && <div className="account-feedback account-feedback--success" role="status">{message}</div>}
          <div className="profile-form__actions">
            <button className="button button--primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save changes'}
            </button>
            <Link className="button button--secondary" to={roleDashboardPaths[role]}>Return to dashboard</Link>
          </div>
        </form>
      </section>
    </div>
  )
}

function formatLocation(location: AdministrativeLocation): string {
  return `${location.community}, ${location.district}, ${location.region}`
}
