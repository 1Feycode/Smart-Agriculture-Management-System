import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { FormField } from '../forms/FormField'
import { useAuth } from '../hooks/useAuth'
import {
  createManagedAccount,
  firebaseAuthErrorMessage,
  sendManagedUserPasswordReset,
} from '../services/authService'
import { listUserProfiles, updateManagedUserAccess } from '../services/userService'
import {
  MANAGED_USER_ROLES,
  USER_ROLES,
  isManagedUserRole,
  isUserRole,
  roleLabels,
  type ManagedUserRole,
  type UserProfile,
  type UserRole,
} from '../types/user'

export function SuperadminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({})
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [newRole, setNewRole] = useState<ManagedUserRole>(MANAGED_USER_ROLES[0])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const refreshUsers = useCallback(async () => {
    const profiles = await listUserProfiles()
    setUsers(profiles)
    setSelectedRoles(profiles.reduce<Record<string, UserRole>>((roles, profile) => {
      roles[profile.uid] = profile.role
      return roles
    }, {}))
  }, [])

  useEffect(() => {
    let active = true
    void listUserProfiles()
      .then((profiles) => {
        if (!active) return
        setUsers(profiles)
        setSelectedRoles(profiles.reduce<Record<string, UserRole>>((roles, profile) => {
          roles[profile.uid] = profile.role
          return roles
        }, {}))
      })
      .catch((loadError: unknown) => {
        if (active) setError(firebaseAuthErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFeedback(null)
    if (!event.currentTarget.reportValidity()) return
    const name = fullName.trim()
    if (!name || name.length > 120) {
      setError('Enter a name that is between 1 and 120 characters.')
      return
    }

    setSubmitting(true)
    try {
      await createManagedAccount(name, email.trim(), newRole)
      setFullName('')
      setEmail('')
      await refreshUsers()
      setFeedback('Account created. Verification and password-reset emails were sent to the new user.')
    } catch (createError) {
      setError(firebaseAuthErrorMessage(createError))
      try {
        await refreshUsers()
      } catch (refreshError) {
        setError(`${firebaseAuthErrorMessage(createError)} ${firebaseAuthErrorMessage(refreshError)}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveRole(profile: UserProfile) {
    const role = selectedRoles[profile.uid]
    if (!role || role === profile.role || profile.uid === currentUser?.uid) return

    setError(null)
    setFeedback(null)
    setSubmitting(true)
    try {
      await updateManagedUserAccess(profile.uid, role, profile.status === 'active' ? 'active' : 'inactive')
      await refreshUsers()
      setFeedback(`${profile.displayName}'s role is now ${roleLabels[role]}.`)
    } catch (saveError) {
      setError(firebaseAuthErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(profile: UserProfile) {
    if (profile.uid === currentUser?.uid) return
    const nextStatus = profile.status === 'active' ? 'inactive' : 'active'
    const action = nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate'
    if (!window.confirm(`${action} ${profile.displayName}'s SAMS access?`)) return

    setError(null)
    setFeedback(null)
    setSubmitting(true)
    try {
      await updateManagedUserAccess(profile.uid, profile.role, nextStatus)
      await refreshUsers()
      setFeedback(nextStatus === 'inactive'
        ? `${profile.displayName}'s SAMS access is deactivated. Their Firebase Authentication account remains in place.`
        : `${profile.displayName}'s SAMS access is active again.`)
    } catch (statusError) {
      setError(firebaseAuthErrorMessage(statusError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePasswordReset(profile: UserProfile) {
    setError(null)
    setFeedback(null)
    setSubmitting(true)
    try {
      await sendManagedUserPasswordReset(profile.email)
      setFeedback(`A password-reset email was sent to ${profile.email}.`)
    } catch (resetError) {
      setError(firebaseAuthErrorMessage(resetError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="content-page user-management-page">
      <span className="section-kicker">Superadmin</span>
      <h1>User management</h1>
      <p className="profile-page__intro">
        Farmers register themselves. Use this page to create and manage staff accounts.
      </p>
      {error && <div className="account-feedback account-feedback--error" role="alert">{error}</div>}
      {feedback && <div className="account-feedback account-feedback--success" role="status">{feedback}</div>}

      <section className="profile-card" aria-labelledby="create-staff-title">
        <h2 id="create-staff-title">Create staff account</h2>
        <p>A verification email and a password-reset email will be sent to the new user.</p>
        <form className="profile-form" onSubmit={(event) => void handleCreateAccount(event)} noValidate>
          <FormField
            id="staff-full-name"
            name="name"
            label="Full name"
            autoComplete="name"
            maxLength={120}
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <FormField
            id="staff-email"
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div className="form-field">
            <label htmlFor="staff-role">Role</label>
            <select
              id="staff-role"
              className="user-management-select"
              value={newRole}
              onChange={(event) => {
                if (isManagedUserRole(event.target.value)) setNewRole(event.target.value)
              }}
            >
              {MANAGED_USER_ROLES.map((role) => (
                <option key={role} value={role}>{roleLabels[role]}</option>
              ))}
            </select>
          </div>
          <div className="profile-form__actions">
            <button className="button button--primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create staff account'}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-card" aria-labelledby="user-list-title">
        <h2 id="user-list-title">Accounts</h2>
        {loading ? (
          <p role="status">Loading accounts...</p>
        ) : users.length === 0 ? (
          <p>No user profiles were found.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Name and email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((profile) => {
                  const isCurrentUser = profile.uid === currentUser?.uid
                  const selectedRole = selectedRoles[profile.uid] ?? profile.role
                  return (
                    <tr key={profile.uid}>
                      <td>
                        <strong>{profile.displayName}{isCurrentUser ? ' (you)' : ''}</strong>
                        <br />
                        {profile.email}
                      </td>
                      <td>
                        <select
                          className="user-management-select"
                          aria-label={`Role for ${profile.displayName}`}
                          value={selectedRole}
                          disabled={isCurrentUser || submitting}
                          onChange={(event) => {
                            const role = event.currentTarget.value
                            if (!isUserRole(role)) return
                            setSelectedRoles((roles) => ({
                              ...roles,
                              [profile.uid]: role,
                            }))
                          }}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>{roleLabels[role]}</option>
                          ))}
                        </select>
                      </td>
                      <td>{profile.status === 'active' ? 'Active' : 'Inactive'}</td>
                      <td>
                        <div className="user-management-actions">
                          <button
                            className="button button--secondary"
                            type="button"
                            disabled={isCurrentUser || submitting || selectedRole === profile.role}
                            onClick={() => void handleSaveRole(profile)}
                          >
                            Save role
                          </button>
                          <button
                            className="button button--secondary"
                            type="button"
                            disabled={isCurrentUser || submitting}
                            onClick={() => void handleStatusChange(profile)}
                          >
                            {profile.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>
                          {profile.status === 'active' && (
                            <button
                              className="button button--secondary"
                              type="button"
                              disabled={submitting}
                              onClick={() => void handlePasswordReset(profile)}
                            >
                              Send password reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
